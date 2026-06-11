import { sql, initDb } from '@/lib/db';
import Link from 'next/link';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ViewTracker } from '@/components/ViewTracker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { processMathJaxHtml } from '@/lib/math';

export const dynamic = 'force-dynamic';

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const parsedId = Number(id);
  if (isNaN(parsedId)) {
    notFound();
  }

  let problem: any = null;
  let connectionError = '';

  try {
    await initDb();
    const result = await sql`SELECT * FROM problems WHERE id = ${parsedId}`;
    if (result.rows.length > 0) {
      const row = result.rows[0];
      problem = {
        _id: row.id.toString(),
        id: row.id,
        subject: row.subject,
        chapter: row.chapter,
        problemNumber: row.problem_number,
        description: row.description,
        contentHtml: row.content_html,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  } catch (error: any) {
    console.error('Failed to fetch problem in ProblemPage:', error);
    connectionError = error.message || String(error);
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex flex-col font-sans">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span>다른 문제 찾기</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto p-6 md:p-8 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 flex flex-col items-center text-center space-y-4">
            <div className="bg-red-50 p-4 rounded-full text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">데이터베이스 연결 실패</h3>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              풀이를 불러오는 과정에서 Vercel Postgres 데이터베이스에 접속할 수 없었습니다. Vercel 프로젝트의 Storage 탭에서 데이터베이스가 정상적으로 생성 및 연결되어 있는지 확인해 주세요.
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 font-mono text-xs text-gray-600 border border-gray-100 max-w-full overflow-x-auto text-left whitespace-pre-wrap w-full">
              {connectionError}
            </div>
            <Link href="/" className="bg-[#3182F6] hover:bg-[#1b64da] text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all">
              메인으로 돌아가기
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!problem) {
    notFound();
  }

  // Pre-process HTML content to fix MathJax and raw LaTeX backslash rendering issues
  const processedHtml = problem.contentHtml 
    ? processMathJaxHtml(problem.contentHtml).replace(/<img[^>]*>/gi, '') 
    : '';

  return (
    <div className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 flex flex-col font-sans transition-colors">
      <ViewTracker id={id} />
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>다른 문제 찾기</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-[#F2F4F6] dark:bg-gray-800 px-4 py-1.5 rounded-full text-gray-700 dark:text-gray-200 font-semibold text-[15px] transition-colors">
              <span>{problem.subject}</span>
              <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
              <span>{problem.chapter}단원</span>
              <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
              <span className="text-[#3182F6]">{problem.problemNumber}번</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:py-10 flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col min-h-[800px] border border-gray-100 dark:border-gray-700 transition-colors">
          {/* 
            Render the raw HTML directly via iframe srcDoc.
            This ensures that full HTML documents (with html, head, body, script tags)
            execute properly without breaking the Next.js parent application layout.
          */}
          <iframe 
            srcDoc={processedHtml ? processedHtml + `
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
</script>` : ''}
            className="w-full h-full flex-1 border-0"
            title={`Problem ${problem.problemNumber} Solution`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </main>
    </div>
  );
}
