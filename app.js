/**
 * STUDY PLAN - AI Self-Learning Planner
 * app.js - Optimized UI & AI Scheduling Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 상태 관리
    const state = {
        events: JSON.parse(localStorage.getItem('timetable_events')) || [],
        aiTasks: JSON.parse(localStorage.getItem('ai_tasks')) || [],
        editIndex: -1
    };

    // 2. UI 요소 참조
    const calendarGrid = document.getElementById('calendar-grid');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingQuote = document.getElementById('loading-quote');
    const generateBtn = document.getElementById('generate-ai-btn');

    // 3. 로딩 제어
    function showLoading() {
        loadingOverlay.classList.remove('hidden');
    }
    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    // 4. 캘린더 초기화 (월요일 1 ~ 일요일 7)
    function initCalendar() {
        calendarGrid.innerHTML = '';
        ['시간', '월', '화', '수', '목', '금', '토', '일'].forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.innerText = day;
            calendarGrid.appendChild(header);
        });

        for (let hour = 8; hour < 24; hour++) {
            const label = document.createElement('div');
            label.className = 'time-label';
            label.innerText = `${hour}:00`;
            calendarGrid.appendChild(label);
            for (let day = 1; day <= 7; day++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.time = `${hour}:00`;
                cell.dataset.day = day;
                calendarGrid.appendChild(cell);
            }
        }
    }
    initCalendar();

    // 5. 렌더링
    function render() {
        document.querySelectorAll('.event-block').forEach(el => el.remove());
        // 수업 일정 (체크박스 없음)
        state.events.forEach(ev => drawBlock(ev, 'fixed-event', false));
        // AI 학습 일정 (공부 완료 버튼 포함)
        state.aiTasks.forEach((task, index) => {
            drawBlock(task, 'ai-event', true, index);
        });
    }

    function drawBlock(item, className, isTask, index) {
        const [sh, sm] = item.start.split(':').map(Number);
        const [eh, em] = item.end.split(':').map(Number);
        if (sh < 8 || sh >= 24) return;

        const block = document.createElement('div');
        block.className = `event-block ${className} ${item.completed ? 'completed' : ''}`;
        block.innerHTML = `<span>${item.name}</span>`;
        block.style.height = `${Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 70, 35)}px`;

        if (isTask) {
            const btn = document.createElement('button');
            btn.className = 'complete-btn';
            btn.innerText = item.completed ? '완료됨' : '공부 완료';
            btn.onclick = () => {
                state.aiTasks[index].completed = !state.aiTasks[index].completed;
                localStorage.setItem('ai_tasks', JSON.stringify(state.aiTasks));
                render();
            };
            block.prepend(btn);
        }

        const target = Array.from(calendarGrid.querySelectorAll('.grid-cell')).find(c => 
            parseInt(c.dataset.day) === parseInt(item.day) && parseInt(c.dataset.time.split(':')[0]) === sh
        );
        if (target) target.appendChild(block);
    }

    // 6. AI 연동
    function processAiEvents(events) {
        if (!Array.isArray(events)) return [];
        const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
        return events.map(ev => {
            let day = typeof ev.day === 'string' ? (dayMap[ev.day] || parseInt(ev.day)) : ev.day;
            return { ...ev, day: day || 1, completed: false };
        });
    }

    async function callGemini(systemInstruction, imageData = null) {
        const WORKER_URL = 'https://deploy.ljc71212.workers.dev';
        showLoading();
        try {
            const payload = { contents: [{ parts: [{ text: systemInstruction }] }] };
            const resp = await fetch(`${WORKER_URL}?model=gemini-3.1-flash-lite-preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            const text = data.result.candidates[0].content.parts[0].text;
            return JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
        } catch (err) {
            alert('AI 분석 오류: ' + err.message);
        } finally {
            hideLoading();
        }
    }

    generateBtn.addEventListener('click', async () => {
        const sys = `
            사용자의 학습 계획을 JSON 배열(name, day(1-7), start(HH:MM), end(HH:MM))로 생성해줘.
            - 목표: ${document.getElementById('final-goal').value}
            - 학습량: ${document.getElementById('target-hours').value}시간/일
            - 제약 사항: 
              1. 일주일(월-일) 동안 학습 시간을 균등하게 분산할 것.
              2. 목표 시간 외 시간은 '자율학습'으로 할당.
              3. 50분 학습 후 10분 '휴식'을 필수로 배치할 것.
              4. 모든 시간대를 빈틈없이 채울 것.
        `;
        const result = await callGemini(sys);
        if (result) {
            state.aiTasks = processAiEvents(result);
            localStorage.setItem('ai_tasks', JSON.stringify(state.aiTasks));
            render();
        }
    });

    render();
});
