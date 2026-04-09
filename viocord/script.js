// 버튼과 텍스트 요소 가져오기
const colorBtn = document.getElementById('color-btn');
const colorCode = document.getElementById('color-code');

// 랜덤 헥사 색상 생성 함수
function getRandomHexColor() {
    const chars = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += chars[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 버튼 클릭 이벤트 리스너
colorBtn.addEventListener('click', () => {
    // 1. 새로운 색상 생성
    const newColor = getRandomHexColor();
    
    // 2. 바디 배경색 변경
    document.body.style.backgroundColor = newColor;
    
    // 3. 텍스트 업데이트
    colorCode.innerText = `현재 배경색: ${newColor}`;
    
    // 4. 버튼 애니메이션 피드백 (선택사항)
    console.log(`Changed background to: ${newColor}`);
});
