import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { processMathJaxHtml } from '@/lib/math';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return new Response('Invalid ID format', { status: 400 });
    }

    const result = await sql`
      SELECT content_html 
      FROM problems 
      WHERE id = ${id}
    `;

    if (result.rowCount === 0) {
      return new Response('Problem not found', { status: 404 });
    }

    const originalHtml = result.rows[0].content_html || '';
    
    // 1. MathJax 및 깨진 수식 교정 수행
    // 이미지 태그 제거는 기존 page.tsx의 규칙을 따름
    let processedHtml = processMathJaxHtml(originalHtml).replace(/<img[^>]*>/gi, '');

    // 2. iframe 전용 스타일 및 레이아웃 스크립트 덧붙이기
    const additionalAssets = `
<style>
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  /* Desktop: Force side-by-side (override AI's 1024px limit) */
  @media (min-width: 768px) {
    .container, .main-container, body.fallback-injected {
      flex-direction: row !important;
      display: flex !important;
    }
    .left-panel, .right-panel, .fallback-text, .fallback-graph {
      height: 100vh !important;
      overflow-y: auto !important;
      box-sizing: border-box;
    }
    body, html {
      overflow: hidden !important;
      height: 100vh !important;
    }
  }

  /* Mobile: Stack vertically with proper scrolling */
  @media (max-width: 767px) {
    .container, .main-container, body.fallback-injected {
      flex-direction: column !important;
      display: flex !important;
      height: auto !important;
    }
    .left-panel, .fallback-text {
      flex: none !important;
      height: auto !important;
      overflow-y: visible !important;
      padding-bottom: 20px !important;
    }
    .right-panel, .fallback-graph {
      flex: none !important;
      height: 500px !important;
      min-height: 500px !important;
      width: 100% !important;
    }
    body, html {
      overflow-y: auto !important;
      height: auto !important;
    }
  }
</style>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.layoutInjected) return;
    document.body.dataset.layoutInjected = 'true';
    
    if (document.querySelector('.left-panel') || document.querySelector('.right-panel') || document.querySelector('.main-container') || document.querySelector('.container')) {
      return; 
    }
    
    document.body.classList.add('fallback-injected');
    
    const textContainer = document.createElement('div');
    textContainer.className = 'fallback-text';
    textContainer.style.cssText = 'flex: 1; padding-right: 24px; font-size: 16px; line-height: 1.7;';
    
    const graphContainer = document.createElement('div');
    graphContainer.className = 'fallback-graph';
    graphContainer.style.cssText = 'flex: 1.2; display: flex; flex-direction: column;';
    
    while(document.body.firstChild) {
      textContainer.appendChild(document.body.firstChild);
    }
    
    const graphEl = textContainer.querySelector('iframe, #calculator, [class*="desmos"], canvas');
    if (graphEl) {
      let targetToMove = graphEl;
      if (graphEl.parentElement !== textContainer && graphEl.parentElement.tagName === 'DIV') {
         targetToMove = graphEl.parentElement;
      }
      targetToMove.parentNode.removeChild(targetToMove);
      graphContainer.appendChild(targetToMove);
      
      if (graphEl.tagName !== 'CANVAS') {
        graphEl.style.cssText = 'width: 100%; height: 100%; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; min-height: 400px;';
      }
    }
    
    document.body.style.cssText = 'margin: 0; padding: 24px; box-sizing: border-box; background: transparent;';
    
    document.body.appendChild(textContainer);
    if (graphEl) {
      document.body.appendChild(graphContainer);
    } else {
      textContainer.style.paddingRight = '0';
    }
  });
</script>
`;

    // 3. HTML 문서의 마지막 </body> 직전에 스타일 및 스크립트 주입
    if (processedHtml.includes('</body>')) {
      processedHtml = processedHtml.replace('</body>', `${additionalAssets}</body>`);
    } else if (processedHtml.includes('</BODY>')) {
      processedHtml = processedHtml.replace('</BODY>', `${additionalAssets}</BODY>`);
    } else {
      processedHtml += additionalAssets;
    }

    // 4. text/html 컨텐트 타입으로 HTML 응답을 직접 내려줍니다. (React/Next.js 직렬화 거치지 않음)
    return new Response(processedHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error rendering dynamic HTML problem view:', error);
    return new Response(`Error rendering problem HTML: ${error.message || error}`, { status: 500 });
  }
}
