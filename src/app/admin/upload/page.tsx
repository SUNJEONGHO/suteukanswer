'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Code, Eye, ChevronRight } from 'lucide-react';
import { SUBJECT_CHAPTERS, SUBJECTS } from '@/lib/constants';

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams ? searchParams.get('id') : null;

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [chapter, setChapter] = useState('');
  const [problemNumber, setProblemNumber] = useState('');
  const [description, setDescription] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');



  // 수정 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    if (!id) return;

    const fetchProblem = async () => {
      try {
        const res = await fetch(`/api/problems?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setSubject(data.subject);
          setChapter(data.chapter);
          setProblemNumber(String(data.problemNumber));
          setDescription(data.description || '');
          setContentHtml(data.contentHtml);
        } else {
          setError('해당 문제를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching problem:', err);
        setError('문제 데이터를 불러오는 과정에서 오류가 발생했습니다.');
      }
    };

    const list = SUBJECT_CHAPTERS[subject] || [];
    if (list.length > 0 && !chapter) {
      setChapter(list[0]);
    }

    fetchProblem();
  }, [id]);

  // 과목 선택 변경 시 해당 과목의 첫 단원을 기본값으로 제안
  useEffect(() => {
    if (id) return; // 수정 모드일 때는 덮어쓰지 않음
    const list = SUBJECT_CHAPTERS[subject] || [];
    if (list.length > 0) {
      setChapter(list[0]);
    } else {
      setChapter('');
    }
  }, [subject, id]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !chapter || !problemNumber || !contentHtml) {
      setError('모든 필드를 채워주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          subject,
          chapter,
          problemNumber: Number(problemNumber),
          description,
          contentHtml,
        }),
      });

      if (res.ok) {
        setMessage(id ? '성공적으로 수정되었습니다.' : '성공적으로 저장되었습니다.');
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || '저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const chapters = SUBJECT_CHAPTERS[subject] || [];

  return (
    <div className="font-sans text-gray-900 dark:text-gray-100 pb-16 transition-colors p-6 max-w-7xl mx-auto pt-10">
      <div className="mb-8 pl-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
          {id ? '풀이 수정' : '풀이 등록'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          수능특강 문제의 상세 정보와 해설 HTML 코드를 입력해주세요.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-colors border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Form Section */}
          <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700 flex flex-col h-full">
            <h2 className="text-xl font-bold flex items-center mb-6 text-gray-800 dark:text-gray-100 tracking-tight">
              <Code className="w-6 h-6 mr-2 text-[#3182F6]" />
              에디터
            </h2>



            <form onSubmit={handleSubmit} className="space-y-7 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-5">
                {/* Subject Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">과목</label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium text-gray-900 dark:text-white"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Chapter Autocomplete Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">단원</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="existing-chapters"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="예: 01 지수와 로그"
                      className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                    <datalist id="existing-chapters">
                      {chapters.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Problem Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">문제 번호</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={problemNumber}
                      onChange={(e) => setProblemNumber(e.target.value)}
                      placeholder="숫자 입력"
                      className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">문제 설명 (한 줄 요약)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="예: 지수법칙을 이용한 계산"
                      className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* HTML Editor */}
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">HTML 풀이 코드</label>
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder="<!DOCTYPE html><html>...</html>"
                  className="w-full flex-1 min-h-[300px] font-mono text-[13px] leading-relaxed border border-gray-200 dark:border-gray-600 rounded-2xl p-5 focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] outline-none transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                ></textarea>
              </div>

              {error && <div className="text-red-600 bg-red-50 px-5 py-4 rounded-2xl text-sm font-medium">{error}</div>}
              {message && <div className="text-blue-600 bg-blue-50 px-5 py-4 rounded-2xl text-sm font-medium">{message}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3182F6] hover:bg-[#1b64da] active:bg-[#1a5bc2] text-white font-bold text-[17px] py-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    <span>저장하기</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preview Section */}
          <div className="bg-[#F9FAFB] dark:bg-gray-800 flex flex-col h-[800px] lg:h-auto">
            <div className="p-6 lg:p-10 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center shadow-sm z-10 transition-colors">
              <Eye className="w-6 h-6 mr-2 text-[#3182F6]" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">미리보기</h2>
            </div>
            <div className="flex-1 p-0 relative bg-[#F9FAFB] dark:bg-gray-900 transition-colors">
              {contentHtml ? (
                <iframe
                  srcDoc={contentHtml ? contentHtml.replace(/<img[^>]*>/gi, '') + `
<style>
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (document.body.dataset.layoutInjected) return;
    document.body.dataset.layoutInjected = 'true';
    
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1; overflow-y: auto; padding-right: 24px; font-size: 16px; line-height: 1.7;';
    
    const graphContainer = document.createElement('div');
    graphContainer.style.cssText = 'flex: 1.2; height: 100%; display: flex; flex-direction: column;';
    
    // Move everything into text container
    while(document.body.firstChild) {
      textContainer.appendChild(document.body.firstChild);
    }
    
    // Find graph inside textContainer and pull it out
    const graphEl = textContainer.querySelector('iframe, #calculator, [class*="desmos"]');
    if (graphEl) {
      graphEl.parentNode.removeChild(graphEl);
      graphContainer.appendChild(graphEl);
      graphEl.style.cssText = 'width: 100%; height: 100%; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1;';
    }
    
    // Setup body as flex row
    document.body.style.cssText = 'display: flex; flex-direction: row; height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; overflow: hidden; background: transparent;';
    
    document.body.appendChild(textContainer);
    if (graphEl) {
      document.body.appendChild(graphContainer);
    } else {
      textContainer.style.paddingRight = '0';
    }
  });
</script>` : ''}
                  className="absolute inset-0 w-full h-full border-0 bg-white dark:bg-gray-200"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Code className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="font-medium text-[15px]">HTML 코드를 입력하거나 이미지를 업로드해 보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-medium">로딩 중...</div>}>
      <UploadForm />
    </Suspense>
  );
}
