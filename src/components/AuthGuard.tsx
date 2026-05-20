'use client';

import { useState, useEffect } from 'react';
import { Lock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

import QUESTIONS_DATA from '@/data/questions.json';

// Type definitions for the JSON data
interface Question {
  chapter: string;
  type: string;
  page_range: string;
  number: number;
  answer: string;
}

const QUESTIONS = QUESTIONS_DATA as Question[];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const pathname = usePathname();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Check local storage on mount
    const authStatus = localStorage.getItem('book_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      pickRandomQuestion();
    }
  }, []);

  const pickRandomQuestion = () => {
    const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrentQuestion(randomQ);
    setInputValue('');
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    if (inputValue === currentQuestion.answer) {
      setSuccess(true);
      setError(false);
      localStorage.setItem('book_authenticated', 'true');
      
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 1000);
    } else {
      setError(true);
      // 오답 시 새로운 문제로 재인증 요구
      setTimeout(() => {
        setError(false);
        pickRandomQuestion();
      }, 1200);
    }
  };

  // 관리자 페이지는 인증 절차 없이 즉시 렌더링
  if (pathname && pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Prevent hydration mismatch by returning nothing until client is ready
  if (isAuthenticated === null) {
    return null; 
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-[#F2F4F6] z-[9999] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
        
        {/* Header Area */}
        <div className="pt-10 pb-6 px-8 text-center border-b border-gray-50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E8F3FF] mb-5">
            {success ? (
              <CheckCircle2 className="w-8 h-8 text-[#3182F6]" />
            ) : (
              <Lock className="w-8 h-8 text-[#3182F6]" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            {success ? '인증 성공!' : '교재 인증이 필요해요'}
          </h2>
          <p className="text-gray-500 font-medium text-[15px]">
            {success ? '이제 문제 풀이를 확인하실 수 있습니다.' : '저작권 보호를 위해 수능특강 교재 소지 여부를 확인합니다.'}
          </p>
        </div>

        {/* Question Area */}
        <div className={`p-8 bg-gray-50/50 transition-all ${success ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center text-[#3182F6] font-semibold text-sm mb-3">
              <BookOpen className="w-4 h-4 mr-1.5" />
              ['{currentQuestion.chapter}' 단원]
            </div>
            <p className="text-lg text-gray-800 font-bold leading-relaxed break-keep">
              본문 <span className="text-[#3182F6]">{currentQuestion.page_range}쪽</span>에 있는{' '}
              <span className="text-gray-900">{currentQuestion.type} {currentQuestion.number}번</span>의 정답을 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleAnswerSubmit} className={`flex space-x-3 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="정답 입력"
              className="flex-1 bg-white border border-gray-300 text-gray-900 font-bold text-lg px-5 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] transition-all shadow-sm placeholder:font-normal placeholder:text-gray-400"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#3182F6] hover:bg-[#1b64da] active:bg-[#1a5bc2] text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-sm flex-shrink-0"
            >
              확인
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-center justify-center text-red-500 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              오답입니다. 새로운 문제로 다시 시도해주세요.
            </div>
          )}
        </div>
      </div>
      
      {/* Required CSS for the shake animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}
