import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 환경 변수에 설정되어 있지 않습니다.' },
        { status: 400 }
      );
    }

    const { image } = await request.json(); // base64 encoded image with mime prefix
    if (!image) {
      return NextResponse.json(
        { error: '문제 이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Extract mime type and base64 data
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        { error: '올바르지 않은 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

const prompt = `
당신은 고등학생 대상 '수능/수능특강 인터랙티브 수학 콘텐츠 플랫폼'을 구축하는 수석 수학 교육 콘텐츠 크리에이터이자 프론트엔드 개발자입니다.

제공된 문제 이미지를 철저히 분석하여 다음 정보들을 추출하고 완벽한 풀이 해설을 작성해 주세요.

응답은 반드시 아래 JSON 스키마를 따르는 JSON 객체 하나여야 합니다:
{
  "subject": "과목명 ('수학1', '수학2', '미적분' 중 하나)",
  "chapter": "단원명 (예: '01 지수와 로그', '02 삼각함수' 등 단원 번호와 텍스트 명칭)",
  "problemNumber": 1, // 문제 번호 (정수)
  "description": "문제에 대한 간단한 설명 또는 유형 요약 (한 줄)",
  "contentHtml": "HTML 전체 코드 문자열"
}

HTML 코드(contentHtml) 작성 지침:
1. 반드시 '<!DOCTYPE html><html>'로 시작하고 '</html>'로 끝나는 완전하고 실행 가능한 단일 HTML5 문서여야 합니다.
2. 원본 이미지 유지 및 인터랙티브 연동 (Image Handling):
   - 좌측 패널의 문제 설명 영역(<div class="problem-desc">) 최상단에 문제를 나타내는 이미지를 원본 그대로 출력하기 위해, HTML 이미지 태그의 src 속성에 반드시 문자열 '%%PROBLEM_IMAGE_BASE64%%'를 사용하세요.
     예: <img src="%%PROBLEM_IMAGE_BASE64%%" style="max-width: 100%; height: auto; border-radius: 8px;" alt="문제 원본 이미지" />
   - 우측 패널의 Canvas 인터랙티브 시각화는 반드시 이 원본 이미지에 나타난 기하학적/그래프적 상황을 모델링하여 구현해야 합니다.
3. 완벽한 수식 렌더링 (Strict LaTeX & MathJax):
   - 첨자(아랫첨자 _, 윗첨자/제곱 ^)가 절대 깨지지 않도록, 단 하나의 수학 변수(예: x, a, n)나 숫자라도 예외 없이 MathJax 딜리미터 안에 작성하세요.
   - 인라인 수식은 $ $ 또는 \\( \\) 를 사용하고, 블록 수식은 $$ $$ 또는 <div class="math-box">\\[ \\]</div>를 사용하세요. (달러 기호 $를 인라인 수식 구분자로 적극 지원합니다.)
   - LaTeX 수식 작성 시 백슬래시(\) 기호는 JSON 응답 규격("contentHtml" 문자열 내부)에 맞게 반드시 이중 백슬래시(\\)로 작성해야 최종 파싱 후 HTML 문서에 백슬래시(\)로 온전히 보존됩니다. 예: \\\\times, \\\\le, \\\\ge, \\\\alpha. 절대 Wtimes나 ₩times 처럼 백슬래시가 깨져 출력되지 않도록 주의하세요.
   - MathJax 렌더링을 위해 HTML 문서의 <head> 영역에 다음 설정을 반드시 포함해 주세요. (주의: polyfill.io는 보안 문제가 있으므로 절대 포함하지 마세요):
     <script>
       window.MathJax = {
         tex: {
           inlineMath: [['$', '$'], ['\\\\\\\\(', '\\\\\\\\)']],
           displayMath: [['$$', '$$'], ['\\\\\\\\[', '\\\\\\\\]']],
           processEscapes: true
         }
       };
     </script>
     <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
4. 핵심 기능: 사용자 변수 조작 (Interactive Parameter Control):
   - 문제를 분석하여 그래프의 형태나 위치에 영향을 주는 핵심 매개변수(예: 평행이동 변수, 기울기, 곡률, 교점의 기준선 등)를 최소 1~2개 도출하세요.
   - 우측 패널(그래프 하단 또는 상단)에 HTML <input type="range"> (슬라이더) UI를 생성하여, 사용자가 이 변수들의 값을 직접 변경할 수 있도록 하세요.
   - 변수가 변경될 때마다 JavaScript의 'input' 이벤트를 통해 그래프 캔버스가 즉각적으로(Real-time) 다시 그려져야 합니다.
5. 단계별 텍스트 해설 (Left Panel):
   - 풀이를 3~5개의 논리적 Step으로 완벽하게 분할하세요. 
   - 논리의 비약 없이, 사용된 공식과 개념을 학생 눈높이에서 텍스트로 풀어 설명하세요.
   - 해설 텍스트 내에서 "우측 슬라이더를 움직여 특정 변수가 변할 때 그래프가 어떻게 이동하는지 확인해 보세요"와 같은 상호작용 유도 문구를 반드시 포함하세요.
6. 인터랙티브 그래프 시각화 (Right Panel):
   - 외부 라이브러리 없이 순수 HTML5 Canvas API를 사용하세요.
   - X축과 Y축의 스케일을 문제에 맞게 동적으로 설정하고, 가독성을 위해 옅은 회색의 눈금선(Grid)과 축 숫자를 반드시 그리세요.
   - 슬라이더 조작에 따른 그래프의 변화(실시간 렌더링)와, 좌측 Step 버튼 클릭에 따른 풀이 단계별 시각화(특정 영역 색칠, 교점 표시 등)가 충돌 없이 조화롭게 작동하도록 JavaScript 상태(State) 관리를 정교하게 작성하세요.
7. UI/UX 구조 및 CSS 방어 규칙 (HTML/CSS/JS):
   - 화면은 Flexbox를 사용하여 왼쪽(해설 아코디언 메뉴 또는 단계 카드), 오른쪽(Canvas 그래프 + 변수 조작 슬라이더 패널) 5:5 비율로 분할하세요.
   - 글자가 세로로 한 글자씩 찌그러지는 현상을 방지하기 위해, 모든 텍스트 컨테이너에 반드시 \`word-break: keep-all; line-height: 1.6; min-width: 0;\` 속성을 적용하세요.
   - Flexbox 하위 요소가 텍스트를 압축하지 않도록 텍스트 영역에 \`flex-shrink: 0;\` 혹은 충분한 \`min-width\`를 보장하세요.
   - 디자인은 흰색과 연한 회색 배경, 직관적인 포인트 컬러(예: 토스블루 #3182F6)를 사용하여 모던한 에듀테크 서비스 느낌을 주어야 합니다.
   - 반응형 레이아웃: 화면이 좁아질 때(예: 모바일)는 5:5 flex-direction이 column으로 바뀌어 위아래로 배치되도록 CSS 미디어 쿼리를 작성하세요.
8. 응답에는 마크다운 기호(\`\`\`json 등)를 절대 포함하지 말고, 순수 JSON 문자열만 반환해 주세요.
`;


    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    let response;
    let retries = 3;
    let errText = '';

    while (retries > 0) {
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) break;

      errText = await response.text();
      if (response.status === 503) {
        console.warn(`Gemini API 503 error. Retrying... (${retries} attempts left)`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      } else {
        break;
      }
    }

    if (!response || !response.ok) {
      console.error('Gemini API Error:', errText);
      return NextResponse.json(
        { error: `Gemini API 호출에 실패했습니다: ${errText}` },
        { status: response ? response.status : 500 }
      );
    }

    const resData = await response.json();
    const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return NextResponse.json(
        { error: 'Gemini에서 올바른 풀이 응답을 받지 못했습니다.' },
        { status: 500 }
      );
    }

    // Attempt to parse the JSON returned by Gemini
    let solvedData;
    try {
      let cleanJsonText = resultText.trim();
      // Extract everything from the first '{' to the last '}'
      const firstBrace = cleanJsonText.indexOf('{');
      const lastBrace = cleanJsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJsonText = cleanJsonText.substring(firstBrace, lastBrace + 1);
      }
      
      solvedData = JSON.parse(cleanJsonText);
      if (solvedData && typeof solvedData.contentHtml === 'string') {
        solvedData.contentHtml = solvedData.contentHtml.replace(/%%PROBLEM_IMAGE_BASE64%%/g, image);
      }
    } catch (parseError: unknown) {
      console.error('Failed to parse Gemini output as JSON. Output:', resultText, parseError);
      return NextResponse.json(
        { error: 'Gemini가 JSON 포맷의 결과를 반환하지 않았습니다.', rawOutput: resultText },
        { status: 500 }
      );
    }

    return NextResponse.json(solvedData);
  } catch (err: unknown) {
    console.error('Error in POST /api/ai/solve:', err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || String(err) },
      { status: 500 }
    );
  }
}
