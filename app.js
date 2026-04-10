/**
 * STUDY PLAN - AI Self-Learning Planner
 * app.js - Refined UI Logic (Time Picker, Theme, and Scheduling)
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

    // 2. UI 요소 참조
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const calendarGrid = document.getElementById('calendar-grid');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingQuote = document.getElementById('loading-quote');
    const timetableForm = document.getElementById('timetable-form');
    const eventList = document.getElementById('event-list');
    const submitBtn = document.getElementById('timetable-submit-btn');
    
    // 시간 선택기 요소
    const startH = document.getElementById('start-h');
    const startM = document.getElementById('start-m');
    const endH = document.getElementById('end-h');
    const endM = document.getElementById('end-m');
    const aiImageInput = document.getElementById('ai-image-input');

    // 4. 기능: 탭 전환
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

    // 5. 기능: 캘린더 초기화
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

    // 6. 설정 관리 (이름, 테마, API 키)
    const dashboardTitle = document.getElementById('dashboard-title');
    const dashboardNameInput = document.getElementById('dashboard-name');
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('ai-model-select');
    const themeRadios = document.querySelectorAll('input[name="theme"]');

    function applyTheme(theme) {
        document.body.className = `${theme}-theme`;
        localStorage.setItem('theme', theme);
    }

    function loadSettings() {
        const title = localStorage.getItem('dashboard_title') || '';
        const theme = localStorage.getItem('theme') || 'dark';
        const apiKey = localStorage.getItem('gemini_api_key') || '';
        const model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';

        dashboardNameInput.value = title;
        dashboardTitle.innerText = title || '제목을 지어주세요.';
        apiKeyInput.value = apiKey;
        modelSelect.value = model;
        
        applyTheme(theme);
        const targetRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (targetRadio) targetRadio.checked = true;
    }
    loadSettings();

    dashboardNameInput.addEventListener('input', () => {
        const val = dashboardNameInput.value.trim();
        localStorage.setItem('dashboard_title', val);
        dashboardTitle.innerText = val || '제목을 지어주세요.';
    });

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => applyTheme(e.target.value));
    });

    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
    });

    modelSelect.addEventListener('change', () => {
        localStorage.setItem('gemini_model', modelSelect.value);
    });

    // 7. 유틸리티 및 렌더링
    function to24h(h, m, ap) {
        h = parseInt(h); m = parseInt(m) || 0;
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function render() {
        document.querySelectorAll('.event-block').forEach(el => el.remove());
        state.events.forEach(ev => drawBlock(ev, 'fixed-event'));
        state.aiTasks.forEach((task) => {
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
        block.innerHTML = `<span>${item.name}</span>`;

        const top = (sm / 60) * 70;
        const height = ((eh * 60 + em) - (sh * 60 + sm)) / 60 * 70;
        block.style.top = `${top}px`;
        block.style.height = `${Math.max(height, 35)}px`;

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

    window.deleteEvent = (i) => {
        state.events.splice(i, 1);
        localStorage.setItem('timetable_events', JSON.stringify(state.events));
        render();
    };

    window.editEvent = (i) => {
        const ev = state.events[i];
        document.getElementById('event-name').value = ev.name;
        document.getElementById('event-day').value = ev.day;
        
        // 시작 시간 처리
        let [sh, sm] = ev.start.split(':').map(Number);
        const sap = sh >= 12 ? 'PM' : 'AM';
        if (sh > 12) sh -= 12; if (sh === 0) sh = 12;
        startH.value = sh;
        startM.value = String(sm).padStart(2, '0');
        document.getElementById('start-ap').value = sap;

        // 종료 시간 처리
        let [eh, em] = ev.end.split(':').map(Number);
        const eap = eh >= 12 ? 'PM' : 'AM';
        if (eh > 12) eh -= 12; if (eh === 0) eh = 12;
        endH.value = eh;
        endM.value = String(em).padStart(2, '0');
        document.getElementById('end-ap').value = eap;

        state.editIndex = i;
        submitBtn.innerText = '수정 완료';
        document.getElementById('timetable').scrollIntoView({ behavior: 'smooth' });
    };

    timetableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = to24h(startH.value, startM.value, document.getElementById('start-ap').value);
        const end = to24h(endH.value, endM.value, document.getElementById('end-ap').value);
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

    // 8. AI 연동 (생략된 기존 AI 로직 보강)
    const generateBtn = document.getElementById('generate-ai-btn');
    const aiTimetableBtn = document.getElementById('ai-timetable-btn');
    const aiTimetableInput = document.getElementById('ai-timetable-input');

    // 일정 데이터 보정 유틸리티 (매우 강력하게 개선)
    function processAiEvents(events) {
        if (!Array.isArray(events)) return [];
        
        const dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일요일': 0, '월요일': 1, '화요일': 2, '수요일': 3, '목요일': 4, '금요일': 5, '토요일': 6 };

        return events.map(ev => {
            // 요일 처리 (숫자 또는 문자열 대응)
            let day = ev.day;
            if (typeof day === 'string' && dayMap[day] !== undefined) day = dayMap[day];
            else if (typeof day === 'string') day = parseInt(day.replace(/[^0-6]/g, '')) || 0;
            
            // 시간 처리 (HH:MM 형식 강제)
            const formatTime = (t) => {
                if (!t) return '09:00';
                let clean = String(t).replace(/[^0-9:]/g, '');
                if (clean.includes(':')) {
                    let [h, m] = clean.split(':');
                    return `${h.padStart(2, '0')}:${(m || '00').padEnd(2, '0').substring(0, 2)}`;
                } else {
                    let h = clean.substring(0, 2) || '09';
                    return `${h.padStart(2, '0')}:00`;
                }
            };

            return {
                name: ev.name || '알 수 없는 일정',
                day: parseInt(day) || 0,
                start: formatTime(ev.start),
                end: formatTime(ev.end)
            };
        }).filter(ev => !isNaN(ev.day) && ev.start.includes(':') && ev.end.includes(':'));
    }

    async function callGemini(prompt, imageData = null) {
        const apiKey = (localStorage.getItem('gemini_api_key') || '').trim();
        if (!apiKey) { 
            alert('설정(⚙️) 탭에서 Gemini API 키를 먼저 입력해 주세요!'); 
            document.querySelector('[data-tab="settings"]').click();
            return null; 
        }

        const baseModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
        const modelsToTry = imageData 
            ? [baseModel, 'gemini-1.5-pro'] 
            : [baseModel, 'gemini-1.5-flash', 'gemini-pro'];

        loadingQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
        loadingOverlay.classList.remove('hidden');

        // 프롬프트 보강: JSON 스키마를 명확히 제시
        const systemPrompt = "You are a professional study planner. Output ONLY a valid JSON array.";
        const formatInstruction = "Required format: Array of objects with keys: name (string), day (number 0-6, 0=Sun), start (string HH:MM), end (string HH:MM).";
        const finalPrompt = `${systemPrompt}\n${formatInstruction}\n\nUser Request: ${prompt}`;

        try {
            for (const model of modelsToTry) {
                try {
                    const parts = [{ text: finalPrompt }];
                    if (imageData) {
                        if (model.includes('gemini-pro') && !model.includes('1.5')) continue;
                        parts.push({
                            inline_data: { mime_type: imageData.mimeType, data: imageData.data }
                        });
                    }

                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 25000); 

                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            contents: [{ parts }],
                            generationConfig: {
                                temperature: 0.1, // 일관된 JSON 출력을 위해 낮춤
                                response_mime_type: "application/json" // 모델이 지원하는 경우 JSON 모드 활성화
                            }
                        }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    const data = await resp.json();
                    if (data.error) {
                        console.error(`Model ${model} error:`, data.error.message);
                        continue;
                    }

                    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                        let text = data.candidates[0].content.parts[0].text;
                        // 마크다운 코드 블록 제거 및 순수 JSON 추출
                        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        const startIdx = text.indexOf('[');
                        const endIdx = text.lastIndexOf(']');
                        
                        if (startIdx !== -1 && endIdx !== -1) {
                            return JSON.parse(text.substring(startIdx, endIdx + 1));
                        }
                    }
                } catch (innerErr) {
                    console.warn(`${model} failed, trying next...`, innerErr);
                }
            }
            throw new Error('All models failed to return valid data.');
        } catch (outerErr) {
            console.error('Gemini API Error:', outerErr);
            alert('AI 분석 중 오류가 발생했습니다. API 키나 모델 설정을 확인해 주세요.');
        } finally {
            hideLoading();
        }
        return null;
    }

    aiImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target.result.split(',')[1];
            const mimeType = file.type;
            
            const result = await callGemini(
                "첨부된 이미지에서 시간표 정보를 추출하세요.",
                { mimeType, data: base64Data }
            );

            if (result) {
                const processed = processAiEvents(result);
                if (processed.length > 0) {
                    state.events.push(...processed);
                    localStorage.setItem('timetable_events', JSON.stringify(state.events));
                    render();
                    const names = processed.map(ev => ev.name).join(', ');
                    alert(`성공적으로 추가됨: ${names}`);
                } else {
                    alert('이미지에서 유효한 시간표 데이터를 찾지 못했습니다.');
                }
            }
            aiImageInput.value = '';
        };
        reader.readAsDataURL(file);
    });

    aiTimetableBtn.addEventListener('click', async () => {
        const text = aiTimetableInput.value.trim();
        if (!text) return;
        const result = await callGemini(`다음 텍스트에서 시간표 정보를 추출하세요: "${text}"`);
        if (result) {
            const processed = processAiEvents(result);
            if (processed.length > 0) {
                state.events.push(...processed);
                localStorage.setItem('timetable_events', JSON.stringify(state.events));
                aiTimetableInput.value = '';
                render();
                const names = processed.map(ev => ev.name).join(', ');
                alert(`성공적으로 추가됨: ${names}`);
            } else {
                alert('텍스트에서 유효한 시간표 데이터를 분석하지 못했습니다.');
            }
        }
    });

    generateBtn.addEventListener('click', async () => {
        const prompt = `학습 스케줄 생성. 목표: ${document.getElementById('final-goal').value}, 수준: ${document.getElementById('learner-level').value}, 시간: ${document.getElementById('target-hours').value}, 과목: ${document.getElementById('target-subjects').value}, 고정: ${JSON.stringify(state.events)}`;
        const result = await callGemini(prompt);
        if (result) {
            state.aiTasks = result.map(t => ({ ...t, completed: false }));
            localStorage.setItem('ai_tasks', JSON.stringify(state.aiTasks));
            render();
        }
    });

    // 9. 학습 목표 및 설정 저장
    document.getElementById('save-settings-btn').onclick = () => {
        localStorage.setItem('dashboard_title', document.getElementById('dashboard-name').value);
        alert('설정이 저장되었습니다!');
    };
    document.getElementById('save-goals-btn').onclick = () => {
        localStorage.setItem('study_target_hours', document.getElementById('target-hours').value);
        localStorage.setItem('study_target_subjects', document.getElementById('target-subjects').value);
        alert('학습 목표가 저장되었습니다!');
    };

    render();
});
