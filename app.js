/**
 * STUDY PLAN - AI Self-Learning Planner
 * app.js - Full Logic with Natural Language Parsing & Advanced AI
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 상태 관리
    const state = {
        events: JSON.parse(localStorage.getItem('timetable_events')) || [],
        aiTasks: JSON.parse(localStorage.getItem('ai_tasks')) || [],
        editIndex: -1
    };

    const quotes = [
        "성공은 매일 반복되는 작은 노력의 합산입니다.",
        "당신의 노력이 당신의 운명을 만든다.",
        "오늘 걷지 않으면 내일은 뛰어야 한다.",
        "가장 늦었다고 생각할 때가 가장 빠를 때다.",
        "공부는 양보다 질, 그리고 꾸준함입니다.",
        "꿈을 기록하면 목표가 되고, 실행하면 현실이 됩니다."
    ];

    // 2. UI 요소
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const calendarGrid = document.getElementById('calendar-grid');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingQuote = document.getElementById('loading-quote');
    const timetableForm = document.getElementById('timetable-form');
    const eventList = document.getElementById('event-list');
    const submitBtn = document.getElementById('timetable-submit-btn');
    const aiTimetableBtn = document.getElementById('ai-timetable-btn');
    const aiTimetableInput = document.getElementById('ai-timetable-input');

    // 3. 기능: 탭 전환
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) content.classList.add('active');
            });
        });
    });

    // 4. 기능: 캘린더 초기화
    function initCalendar() {
        calendarGrid.innerHTML = '';
        ['시간', '일', '월', '화', '수', '목', '금', '토'].forEach(day => {
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
            for (let day = 0; day < 7; day++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.time = `${hour}:00`;
                cell.dataset.day = day;
                calendarGrid.appendChild(cell);
            }
        }
    }
    initCalendar();

    // 5. 기능: 시간 변환 (12h <-> 24h)
    function to24h(h, m, ap) {
        h = parseInt(h); m = parseInt(m) || 0;
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // 6. 기능: 렌더링 시스템
    function render() {
        document.querySelectorAll('.event-block').forEach(el => el.remove());

        // 고정 시간표 그리기
        state.events.forEach(ev => drawBlock(ev, 'fixed-event'));

        // AI 스케줄 그리기 (체크박스 포함)
        state.aiTasks.forEach((task, idx) => {
            const block = drawBlock(task, 'ai-event');
            if (block) {
                if (task.completed) block.classList.add('completed');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'event-checkbox';
                cb.checked = task.completed;
                cb.onclick = (e) => {
                    e.stopPropagation();
                    task.completed = cb.checked;
                    localStorage.setItem('ai_tasks', JSON.stringify(state.aiTasks));
                    render();
                };
                block.prepend(cb);
            }
        });

        renderEventList();
    }

    function drawBlock(item, className) {
        const [sh, sm] = item.start.split(':').map(Number);
        const [eh, em] = item.end.split(':').map(Number);
        if (sh < 8 || sh >= 24) return null;

        const block = document.createElement('div');
        block.className = `event-block ${className}`;
        block.title = item.name;
        block.innerHTML = `<span>${item.name}</span>`;

        const top = (sm / 60) * 70;
        const height = ((eh * 60 + em) - (sh * 60 + sm)) / 60 * 70;
        block.style.top = `${top}px`;
        block.style.height = `${Math.max(height, 30)}px`;

        const target = Array.from(calendarGrid.querySelectorAll('.grid-cell')).find(c => 
            parseInt(c.dataset.day) === parseInt(item.day) && parseInt(c.dataset.time.split(':')[0]) === sh
        );
        if (target) {
            target.appendChild(block);
            return block;
        }
        return null;
    }

    function renderEventList() {
        eventList.innerHTML = '';
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        state.events.forEach((ev, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div><strong>${ev.name}</strong><br><small>${dayNames[ev.day]} | ${ev.start} ~ ${ev.end}</small></div>
                <div>
                    <button class="edit-btn" onclick="window.editEvent(${i})">수정</button>
                    <button class="delete-btn" onclick="window.deleteEvent(${i})">삭제</button>
                </div>
            `;
            eventList.appendChild(div);
        });
    }

    // 7. 기능: 일정 추가 및 수정
    window.deleteEvent = (i) => {
        state.events.splice(i, 1);
        localStorage.setItem('timetable_events', JSON.stringify(state.events));
        render();
    };

    window.editEvent = (i) => {
        const ev = state.events[i];
        document.getElementById('event-name').value = ev.name;
        document.getElementById('event-day').value = ev.day;
        let [h, m] = ev.start.split(':').map(Number);
        const ap = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12; if (h === 0) h = 12;
        document.getElementById('start-h').value = h;
        document.getElementById('start-m').value = m;
        document.getElementById('start-ap').value = ap;
        state.editIndex = i;
        submitBtn.innerText = '수정 완료';
        document.getElementById('timetable').scrollIntoView();
    };

    timetableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = to24h(document.getElementById('start-h').value, document.getElementById('start-m').value, document.getElementById('start-ap').value);
        const end = to24h(document.getElementById('end-h').value, document.getElementById('end-m').value, document.getElementById('end-ap').value);
        const data = { name: document.getElementById('event-name').value, day: document.getElementById('event-day').value, start, end };

        if (state.editIndex > -1) {
            state.events[state.editIndex] = data;
            state.editIndex = -1;
            submitBtn.innerText = '일정 수동 추가';
        } else {
            state.events.push(data);
        }
        localStorage.setItem('timetable_events', JSON.stringify(state.events));
        timetableForm.reset();
        render();
    });

    // 8. 기능: Gemini AI 연동
    async function callGemini(prompt) {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) { alert('설정에서 API 키를 먼저 입력해 주세요!'); return null; }
        
        loadingQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
        loadingOverlay.classList.remove('hidden');

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });
            const data = await resp.json();
            hideLoading();
            return JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (err) {
            console.error(err);
            hideLoading();
            alert('AI 요청 중 오류가 발생했습니다.');
            return null;
        }
    }

    function hideLoading() { loadingOverlay.classList.add('hidden'); }

    // 자연어 시간표 추가
    aiTimetableBtn.addEventListener('click', async () => {
        const text = aiTimetableInput.value.trim();
        if (!text) return;

        const prompt = `
            사용자의 텍스트를 분석해서 고정 시간표 JSON 배열을 만들어줘.
            입력: "${text}"
            응답 형식: [{"name": "일정명", "day": 요일인덱스0-6, "start": "HH:MM", "end": "HH:MM"}]
            요일 인덱스: 일(0), 월(1), 화(2), 수(3), 목(4), 금(5), 토(6)
            JSON 배열만 응답해.
        `;

        const result = await callGemini(prompt);
        if (result && Array.isArray(result)) {
            state.events.push(...result);
            localStorage.setItem('timetable_events', JSON.stringify(state.events));
            aiTimetableInput.value = '';
            render();
            alert('AI가 시간표를 인식해서 추가했습니다!');
        }
    });

    // AI 학습 스케줄 생성 (목표 세분화 포함)
    document.getElementById('generate-ai-btn').addEventListener('click', async () => {
        const goal = document.getElementById('final-goal').value;
        const level = document.getElementById('learner-level').value;
        const hours = document.getElementById('target-hours').value;
        const subjects = document.getElementById('target-subjects').value;

        const prompt = `
            너는 최고의 학습 컨설턴트야. 사용자의 목표를 세분화하고 효율적인 주간 스케줄을 짜줘.
            최종 목표: ${goal}
            학습 수준: ${level}
            하루 공부 가능 시간: ${hours}시간
            공부 과목: ${subjects}
            고정 일정: ${JSON.stringify(state.events)}
            미완료된 기존 학습: ${JSON.stringify(state.aiTasks.filter(t => !t.completed))}

            요구사항:
            1. 거대 목표를 이번 주에 실천 가능한 단위로 구체적으로 쪼개줘.
            2. 수준에 맞는 학습법(예: 백지 복습, 3회독법 등)을 일정 이름에 명시해줘.
            3. 시간은 08:00~23:00 사이 빈 공간에 배치해.
            4. JSON 형식으로만 응답해: [{"name": "과목(학습법)", "day": 요일인덱스, "start": "HH:MM", "end": "HH:MM"}]
        `;

        const result = await callGemini(prompt);
        if (result) {
            state.aiTasks = result.map(t => ({ ...t, completed: false }));
            localStorage.setItem('ai_tasks', JSON.stringify(state.aiTasks));
            render();
            alert('나만의 AI 맞춤 스케줄이 생성되었습니다!');
        }
    });

    // 9. 설정 저장
    document.getElementById('save-settings-btn').onclick = () => {
        localStorage.setItem('dashboard_title', document.getElementById('dashboard-name').value);
        alert('설정이 저장되었습니다!');
        location.reload();
    };
    document.getElementById('save-goals-btn').onclick = () => {
        localStorage.setItem('study_target_hours', document.getElementById('target-hours').value);
        localStorage.setItem('study_target_subjects', document.getElementById('target-subjects').value);
        alert('학습 목표가 저장되었습니다!');
    };

    render();
});
