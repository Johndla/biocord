/**
 * Viocord AI Self-Learning Planner - Gemini Core Library
 * 
 * 이 라이브러리는 프로젝트 전체에서 AI 기능을 공통으로 호출할 때 사용하는 코어 모듈입니다.
 */
class GeminiPlanner {
    constructor(config = {}) {
        this.userName = config.userName || "사용자";
        this.basePrompt = "너는 Viocord의 AI 학습 비서야. 학생의 학습 데이터를 기반으로 최적의 조언을 해줘.";
    }

    /**
     * 현재 학습 상황을 바탕으로 AI 추천 학습 문구를 가져옵니다.
     */
    async getRecommendation(currentSubject = "알고리즘 기초") {
        const prompt = `${this.basePrompt} 현재 "${currentSubject}"를 공부 중인 학생에게 오늘 집중해야 할 한 문장 추천 학습을 제안해줘. (반드시 한 문장으로 답변)`;
        return await this._callGemini(prompt);
    }

    /**
     * 특정 목표를 위한 할 일 목록(Todo List)을 생성합니다.
     */
    async generateTodoList(goal) {
        const prompt = `${this.basePrompt} "${goal}" 목표를 달성하기 위해 오늘 해야 할 구체적인 할 일 3가지를 JSON 배열 ["일1", "일2", "일3"] 형태로 알려줘.`;
        const response = await this._callGemini(prompt);
        try {
            return JSON.parse(response);
        } catch {
            return ["강의 시청하기", "실습 문제 풀기", "복습하기"]; // 기본값
        }
    }

    /**
     * 내부적으로 Gemini CLI 또는 API를 호출하는 메서드
     */
    async _callGemini(prompt) {
        // 실제 운영 환경에서는 서버 측 API를 호출하거나, CLI 결과를 fetch합니다.
        console.log(`[Gemini 요청]: ${prompt}`);
        
        // 데모용 응답 (실제 Gemini CLI와 연동 시에는 execSync나 fetch 사용 가능)
        const mockResponses = [
            "오늘은 복잡한 것보다 기초적인 BFS/DFS 개념을 다시 훑어보는 게 어떨까요?",
            "실습 위주로 공부하면 습득 속도가 2배 빨라질 거예요!",
            "잠시 휴식을 취한 뒤에 가장 어려운 문제를 먼저 풀어보세요."
        ];
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }
}

// 브라우저와 Node.js 공통 사용을 위한 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiPlanner;
}
