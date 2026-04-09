/**
 * BIOCORD - AI Self-Learning Planner
 * app.js - 핵심 로직 및 UI 제어
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 탭 전환 시스템
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            // 네비게이션 활성화 상태 변경
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 탭 콘텐츠 표시 변경
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    const quotes = [
        "성공은 매일 반복되는 작은 노력의 합산입니다.",
        "지금 공부하면 꿈을 이루지만, 지금 자면 꿈을 꾼다.",
        "노력은 결코 배신하지 않는다.",
        "오늘 걷지 않으면 내일은 뛰어야 한다.",
        "가장 늦었다고 생각할 때가 가장 빠를 때다.",
        "당신의 노력이 당신의 운명을 만든다.",
        "천재는 1%의 영감과 99%의 노력으로 만들어진다."
    ];

    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingQuote = document.getElementById('loading-quote');

    function showLoading() {
        loadingQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    // AI 버튼 클릭 시 테스트용 (3단계에서 실제 API 연결 시 사용)
    document.getElementById('generate-ai-btn').addEventListener('click', () => {
        showLoading();
        // 3단계 연동 전 시뮬레이션
        setTimeout(hideLoading, 3000);
    });

    // 2. 캘린더 그리드 생성
    const calendarGrid = document.getElementById('calendar-grid');
    const days = ['시간', '일', '월', '화', '수', '목', '금', '토'];

    function initCalendar() {
        calendarGrid.innerHTML = '';

        // 헤더 생성 (요일)
        days.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.innerText = day;
            calendarGrid.appendChild(header);
        });

        // 시간행 생성 (08:00 ~ 23:00)
        for (let hour = 8; hour < 24; hour++) {
            // 시간 라벨
            const label = document.createElement('div');
            label.className = 'time-label';
            label.innerText = `${hour}:00`;
            calendarGrid.appendChild(label);

            // 요일별 셀
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

    // 3. 설정 관리 (대시보드 제목, 테마, API 키)
    const dashboardTitle = document.getElementById('dashboard-title');
    const dashboardNameInput = document.getElementById('dashboard-name');
    const apiKeyInput = document.getElementById('api-key');
    const themeRadios = document.querySelectorAll('input[name="theme"]');

    // 초기 값 로드 및 적용
    function loadSettings() {
        const savedTitle = localStorage.getItem('dashboard_title') || '';
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedApiKey = localStorage.getItem('gemini_api_key') || '';

        dashboardNameInput.value = savedTitle;
        dashboardTitle.innerText = savedTitle || '제목을 지어주세요.';
        
        apiKeyInput.value = savedApiKey;

        // 테마 적용
        document.body.className = `${savedTheme}-theme`;
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    }

    loadSettings();

    // 대시보드 제목 변경 이벤트
    dashboardNameInput.addEventListener('input', () => {
        const title = dashboardNameInput.value.trim();
        localStorage.setItem('dashboard_title', title);
        dashboardTitle.innerText = title || '제목을 지어주세요.';
    });

    // 테마 변경 이벤트
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('theme', theme);
            document.body.className = `${theme}-theme`;
        });
    });

    // API 키 자동 저장
    apiKeyInput.addEventListener('input', () => {
        const key = apiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', key);
    });

    // 4. 학습 목표 자동 저장
    const targetHoursInput = document.getElementById('target-hours');
    const targetSubjectsInput = document.getElementById('target-subjects');

    // 초기 값 로드
    targetHoursInput.value = localStorage.getItem('study_target_hours') || '4';
    targetSubjectsInput.value = localStorage.getItem('study_target_subjects') || '';

    [targetHoursInput, targetSubjectsInput].forEach(input => {
        input.addEventListener('input', () => {
            localStorage.setItem('study_target_hours', targetHoursInput.value);
            localStorage.setItem('study_target_subjects', targetSubjectsInput.value);
        });
    });

    // 저장 버튼 클릭 시 시각적 피드백만 제공 (자동 저장이므로)
    document.querySelectorAll('.secondary-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'save-settings-btn' || e.target.id === 'save-goals-btn') {
                e.target.innerText = '저장됨! ✓';
                setTimeout(() => {
                    e.target.innerText = e.target.id === 'save-settings-btn' ? '설정 저장' : '목표 저장';
                }, 2000);
            }
        });
    });

    // 5. 고정 시간표 로직
    const timetableForm = document.getElementById('timetable-form');
    const eventList = document.getElementById('event-list');
    const submitBtn = timetableForm.querySelector('button[type="submit"]');
    let events = JSON.parse(localStorage.getItem('timetable_events')) || [];
    let editIndex = -1; // -1이면 추가 모드, 0 이상이면 수정 모드

    function renderTimetable() {
        // 대시보드 그리드 초기화 (기존 이벤트 블록 제거)
        document.querySelectorAll('.event-block').forEach(el => el.remove());

        // 캘린더 그리드에 표시 (생략 방지용 전체 표시 로직)
        events.forEach(event => {
            const startHour = parseInt(event.start.split(':')[0]);
            const startMin = parseInt(event.start.split(':')[1]);
            const endHour = parseInt(event.end.split(':')[0]);
            const endMin = parseInt(event.end.split(':')[1]);

            if (startHour >= 8 && startHour < 24) {
                const dayIndex = parseInt(event.day);
                const block = document.createElement('div');
                block.className = 'event-block fixed-event';
                block.innerText = event.name;

                const topOffset = (startMin / 60) * 60;
                const height = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60 * 60;

                block.style.top = `${topOffset}px`;
                block.style.height = `${height}px`;

                const cells = calendarGrid.querySelectorAll('.grid-cell');
                const targetCell = Array.from(cells).find(cell => 
                    parseInt(cell.dataset.day) === dayIndex && 
                    parseInt(cell.dataset.time.split(':')[0]) === startHour
                );

                if (targetCell) targetCell.appendChild(block);
            }
        });

        // 설정 탭의 리스트 표시
        eventList.innerHTML = '';
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        
        events.forEach((event, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="item-info">
                    <h4>${event.name}</h4>
                    <p>${dayNames[event.day]} | ${event.start} ~ ${event.end}</p>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-index="${index}">수정</button>
                    <button class="delete-btn" data-index="${index}">삭제</button>
                </div>
            `;
            eventList.appendChild(item);
        });

        // 수정 이벤트 연결
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const event = events[index];
                
                // 폼에 데이터 채우기
                document.getElementById('event-name').value = event.name;
                document.getElementById('event-day').value = event.day;
                
                // 시간 분해 (24h -> 12h AM/PM)
                const splitTime = (timeStr, hId, mId, apId) => {
                    let [h, m] = timeStr.split(':').map(Number);
                    const ap = h >= 12 ? 'PM' : 'AM';
                    if (h > 12) h -= 12;
                    if (h === 0) h = 12;
                    document.getElementById(hId).value = h;
                    document.getElementById(mId).value = String(m).padStart(2, '0');
                    document.getElementById(apId).value = ap;
                };

                splitTime(event.start, 'start-h', 'start-m', 'start-ap');
                splitTime(event.end, 'end-h', 'end-m', 'end-ap');

                // 수정 모드 상태로 변경
                editIndex = index;
                submitBtn.innerText = '수정 완료';
                submitBtn.classList.add('primary-btn');
                timetableForm.scrollIntoView({ behavior: 'smooth' });
            });
        });

        // 삭제 이벤트 연결
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                events.splice(index, 1);
                localStorage.setItem('timetable_events', JSON.stringify(events));
                renderTimetable();
                // 수정 중이었다면 초기화
                resetForm();
            });
        });
    }

    function resetForm() {
        timetableForm.reset();
        editIndex = -1;
        submitBtn.innerText = '일정 추가';
        submitBtn.classList.remove('primary-btn');
    }

    // 12h -> 24h 변환 함수
    function to24h(h, m, ap) {
        h = parseInt(h);
        m = parseInt(m) || 0;
        if (ap === 'PM' && h < 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    timetableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const start = to24h(
            document.getElementById('start-h').value,
            document.getElementById('start-m').value,
            document.getElementById('start-ap').value
        );
        const end = to24h(
            document.getElementById('end-h').value,
            document.getElementById('end-m').value,
            document.getElementById('end-ap').value
        );

        const eventData = {
            name: document.getElementById('event-name').value,
            day: document.getElementById('event-day').value,
            start: start,
            end: end
        };

        if (editIndex > -1) {
            // 수정 모드
            events[editIndex] = eventData;
            alert('일정이 수정되었습니다!');
        } else {
            // 추가 모드
            events.push(eventData);
            alert('일정이 추가되었습니다!');
        }

        localStorage.setItem('timetable_events', JSON.stringify(events));
        resetForm();
        renderTimetable();
    });

    renderTimetable();
});
