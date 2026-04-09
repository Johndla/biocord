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

    // 3. 설정 저장 기능 (API 키 등)
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiKeyInput = document.getElementById('api-key');

    // 초기 값 로드
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';

    saveSettingsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', key);
        alert('설정이 저장되었습니다!');
    });

    // 4. 학습 목표 저장
    const saveGoalsBtn = document.getElementById('save-goals-btn');
    const targetHoursInput = document.getElementById('target-hours');
    const targetSubjectsInput = document.getElementById('target-subjects');

    // 초기 값 로드
    targetHoursInput.value = localStorage.getItem('study_target_hours') || '4';
    targetSubjectsInput.value = localStorage.getItem('study_target_subjects') || '';

    saveGoalsBtn.addEventListener('click', () => {
        localStorage.setItem('study_target_hours', targetHoursInput.value);
        localStorage.setItem('study_target_subjects', targetSubjectsInput.value);
        alert('학습 목표가 저장되었습니다!');
    });
});
