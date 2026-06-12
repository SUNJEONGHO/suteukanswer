'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminAuth');
      if (stored === 'true') {
        const timer = setTimeout(() => {
          setIsAuthorized(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthorized(true);
      localStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('비밀번호가 틀렸습니다.');
      setPassword('');
    }
  };

  // Only protect /admin routes
  if (isAdminRoute && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 max-w-sm w-full flex flex-col items-center space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full text-blue-500">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">관리자 인증</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              어드민 페이지에 접근하려면<br/>비밀번호를 입력하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full bg-[#F2F4F6] dark:bg-gray-900 border-none rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-[#3182F6] outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium text-[15px]"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 ml-1 font-medium">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#3182F6] hover:bg-[#1b64da] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-sm flex justify-center items-center"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Not an admin route, or already authorized
  return <>{children}</>;
}
