// functions/api.js

export async function onRequest(context) {
  // 1. 환경 변수에서 API 키 가져오기
  const API_KEY = context.env.MY_SECRET_API_KEY;

  // 2. 외부 API 호출 (예: 날씨 데이터나 DB 요청)
  const response = await fetch("https://api.external-service.com/data", {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();

  // 3. 프론트엔드로 데이터 반환
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
