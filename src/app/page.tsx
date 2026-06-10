'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { SUBJECT_CHAPTERS, SUBJECTS } from '@/lib/constants';
import { ThemeToggle } from '@/components/ThemeToggle';

interface ProblemData {
  _id: string;
  problemNumber: number;
  description?: string;
}

export default function Home() {
  const router = useRouter();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [chapter, setChapter] = useState('');
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [problemNumber, setProblemNumber] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<ProblemData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [error, setError] = useState('');

  // 과목이 변경되면 해당 과목의 첫 단원을 기본값으로 설정
  useEffect(() => {
    const list = SUBJECT_CHAPTERS[subject] || [];
    if (list.length > 0) {
      setChapter(list[0]);
    } else {
      setChapter('');
    }
  }, [subject]);

  // 단원이 선택되면 해당 단원에 등록된 문제 목록을 불러옴
  useEffect(() => {
    if (!chapter) {
      setProblems([]);
      setProblemNumber('');
      return;
    }

    const fetchProblems = async () => {
      setProblemsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/problems?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || '문제를 불러오지 못했습니다.');
        }

        if (data.problems && data.problems.length > 0) {
          const sorted = [...data.problems].sort((a, b) => a.problemNumber - b.problemNumber);
          setProblems(sorted);
          setProblemNumber(String(sorted[0].problemNumber));
        } else {
          setProblems([]);
          setProblemNumber('');
        }
      } catch (err: any) {
        console.error('Failed to fetch problems:', err);
        setError(err.message || '문제 목록을 불러오는 중 오류가 발생했습니다. 데이터베이스 연결을 확인해주세요.');
        setProblems([]);
        setProblemNumber('');
      } finally {
        setProblemsLoading(false);
      }
    };
    fetchProblems();
  }, [subject, chapter]);

  const handleDropdownSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !chapter || !problemNumber) {
      setError('과목, 단원, 문제 번호를 모두 선택해주세요.');
      return;
    }
    setError('');
    setLoading(true);

    const matched = problems.find((p) => String(p.problemNumber) === problemNumber);
    if (matched) {
      router.push(`/problem/${matched._id}`);
    } else {
      setError('조건에 맞는 풀이가 아직 등록되지 않았습니다.');
      setLoading(false);
    }
  };

  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    
    setIsSearching(true);
    setError('');
    setSearchResults([]);
    
    try {
      const res = await fetch(`/api/problems?search=${encodeURIComponent(searchKeyword)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.problems && data.problems.length > 0) {
        setSearchResults(data.problems);
      } else {
        setError('검색 결과가 없습니다.');
      }
    } catch (err: any) {
      setError(err.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const chapters = SUBJECT_CHAPTERS[subject] || [];

  return (
    <main className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Header Title */}
        <div className="mb-8 pl-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm mb-5 text-[#3182F6]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            수능특강 풀이검색
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            원하는 문제의 해설을 빠르고 쉽게 찾아보세요.
          </p>
        </div>

        {/* Keyword Search Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6 transition-colors">
          <form onSubmit={handleKeywordSearch}>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1 mb-2 block">키워드로 검색</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="단원, 주제, 번호 등으로 검색"
                className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent text-gray-900 dark:text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium placeholder-gray-400"
              />
              <div className="absolute left-4 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchKeyword.trim()}
                className="absolute right-2 px-4 py-2 bg-[#3182F6] hover:bg-[#1b64da] text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
              >
                {isSearching ? '검색중' : '검색'}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map((p: any) => (
                <Link key={p._id} href={`/problem/${p._id}`}>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-[#3182F6] mb-0.5">{p.subject} &gt; {p.chapter}</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium">{p.problemNumber}번 {p.description ? `- ${p.description}` : ''}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown Search Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
          <form onSubmit={handleDropdownSearch} className="space-y-5">
            {/* Subject Select */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">단원/번호로 찾기</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent text-gray-900 dark:text-white rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Chapter Select */}
              <div className="space-y-2 flex-3 w-[60%]">
                <div className="relative">
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    disabled={chapters.length === 0}
                    className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent text-gray-900 dark:text-white rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium disabled:opacity-60 overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {chapters.length === 0 ? (
                      <option value="">단원 없음</option>
                    ) : (
                      chapters.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Problem Select */}
              <div className="space-y-2 flex-2 w-[40%]">
                <div className="relative">
                  <select
                    value={problemNumber}
                    onChange={(e) => setProblemNumber(e.target.value)}
                    disabled={problemsLoading || problems.length === 0}
                    className="w-full bg-[#F9FAFB] dark:bg-gray-700 border border-transparent text-gray-900 dark:text-white rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-[#3182F6]/20 focus:border-[#3182F6] dark:focus:bg-gray-700 transition-all text-base font-medium disabled:opacity-60 overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {problemsLoading ? (
                      <option value="">로드 중...</option>
                    ) : problems.length === 0 ? (
                      <option value="">풀이 없음</option>
                    ) : (
                      problems.map((p) => (
                        <option key={p.problemNumber} value={String(p.problemNumber)}>
                          {p.problemNumber}번
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-5 py-3.5 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !chapter || !problemNumber}
              className="w-full bg-[#3182F6] hover:bg-[#1b64da] active:bg-[#1a5bc2] text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-[17px]">바로 보기</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/admin" className="inline-flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm transition-colors">
            관리자 전용 <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </main>
  );
}
