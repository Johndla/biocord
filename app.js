/**
 * STUDY PLAN - AI Self-Learning Planner
 * app.js - 핵심 로직 및 UI 제어 (수정/추가 기능 복구 버전)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 탭 전환
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

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

    // 2. 캘린더 생성
    const calendarGrid = document.getElementById('calendar-grid');
    const dayNames = ['시간', '일', '월', '화', '수', '목', '금', '토'];

    function initCalendar() {
        calendarGrid.innerHTML = '';
        dayNames.forEach(day => {
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

    // 3. 설정 관리 (이름, 테마, API 키)
    const dashboardTitle = document.getElementById('dashboard-title');
    const dashboardNameInput = document.getElementById('dashboard-name');
    const apiKeyInput = document.getElementById('api-key');
    const themeRadios = document.querySelectorAll('input[name="theme"]');

    function loadSettings() {
        const title = localStorage.getItem('dashboard_title') || '';
        const theme = localStorage.getItem('theme') || 'dark';
        const apiKey = localStorage.getItem('gemini_api_key') || '';

        dashboardNameInput.value = title;
        dashboardTitle.innerText = title || '제목을 지어주세요.';
        apiKeyInput.value = apiKey;
        document.body.className = `${theme}-theme`;
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
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('theme', theme);
            document.body.className = `${theme}-theme`;
        });
    });

    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
    });

    // 4. 학습 목표
    const targetHoursInput = document.getElementById('target-hours');
    const targetSubjectsInput = document.getElementById('target-subjects');

    targetHoursInput.value = localStorage.getItem('study_target_hours') || '4';
    targetSubjectsInput.value = localStorage.getItem('study_target_subjects') || '';

    [targetHoursInput, targetSubjectsInput].forEach(input => {
        input.addEventListener('input', () => {
            localStorage.setItem('study_target_hours', targetHoursInput.value);
            localStorage.setItem('study_target_subjects', targetSubjectsInput.value);
        });
    });

    // 5. 고정 시간표 핵심 로직
    const timetableForm = document.getElementById('timetable-form');
    const eventList = document.getElementById('event-list');
    const submitBtn = document.getElementById('timetable-submit-btn');
    let events = JSON.parse(localStorage.getItem('timetable_events')) || [];
    let editIndex = -1;

    function to24h(h, m, ap) {
        h = parseInt(h); m = parseInt(m) || 0;
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function renderTimetable() {
        document.querySelectorAll('.event-block').forEach(el => el.remove());

        events.forEach(event => {
            const [sh, sm] = event.start.split(':').map(Number);
            const [eh, em] = event.end.split(':').map(Number);

            if (sh >= 8 && sh < 24) {
                const block = document.createElement('div');
                block.className = 'event-block fixed-event';
                block.innerText = event.name;

                const topOffset = (sm / 60) * 60;
                const height = ((eh * 60 + em) - (sh * 60 + sm)) / 60 * 60;

                block.style.top = `${topOffset}px`;
                block.style.height = `${height}px`;

                const cells = calendarGrid.querySelectorAll('.grid-cell');
                const target = Array.from(cells).find(c => parseInt(c.dataset.day) === parseInt(event.day) && parseInt(c.dataset.time.split(':')[0]) === sh);
                if (target) target.appendChild(block);
            }
        });

        eventList.innerHTML = '';
        const dayNamesList = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        events.forEach((ev, i) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div><strong>${ev.name}</strong><br><small>${dayNamesList[ev.day]} | ${ev.start} ~ ${ev.end}</small></div>
                <div><button class="edit-btn" data-index="${i}">수정</button><button class="delete-btn" data-index="${i}">삭제</button></div>
            `;
            eventList.appendChild(item);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const ev = events[idx];
                document.getElementById('event-name').value = ev.name;
                document.getElementById('event-day').value = ev.day;
                
                let [h, m] = ev.start.split(':').map(Number);
                const ap = h >= 12 ? 'PM' : 'AM';
                if (h > 12) h -= 12; if (h === 0) h = 12;
                document.getElementById('start-h').value = h;
                document.getElementById('start-m').value = m;
                document.getElementById('start-ap').value = ap;

                editIndex = idx;
                submitBtn.innerText = '수정 완료';
                timetableForm.scrollIntoView({ behavior: 'smooth' });
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                events.splice(e.target.dataset.index, 1);
                localStorage.setItem('timetable_events', JSON.stringify(events));
                renderTimetable();
            });
        });
    }

    timetableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const start = to24h(document.getElementById('start-h').value, document.getElementById('start-m').value, document.getElementById('start-ap').value);
        const end = to24h(document.getElementById('end-h').value, document.getElementById('end-m').value, document.getElementById('end-ap').value);

        const data = { name: document.getElementById('event-name').value, day: document.getElementById('event-day').value, start, end };

        if (editIndex > -1) { events[editIndex] = data; editIndex = -1; submitBtn.innerText = '일정 추가'; }
        else { events.push(data); }

        localStorage.setItem('timetable_events', JSON.stringify(events));
        timetableForm.reset();
        renderTimetable();
    });

    renderTimetable();

    // 6. 로딩 & AI (자극 문구)
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingQuote = document.getElementById('loading-quote');
    const quotes = ["성공은 매일 반복되는 작은 노력의 합산입니다.", "당신의 노력이 당신의 운명을 만든다.", "오늘 걷지 않으면 내일은 뛰어야 한다."];

    document.getElementById('generate-ai-btn').addEventListener('click', () => {
        loadingQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
        loadingOverlay.classList.remove('hidden');
        setTimeout(() => loadingOverlay.classList.add('hidden'), 2000);
    });
});
