import Link from 'next/link';
import { Database, PlusCircle, LayoutDashboard, ChevronLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F4F6] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white min-h-screen p-5 flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10 border-r border-gray-100">
        <div className="flex items-center space-x-3 mb-10 mt-2 px-2">
          <div className="bg-[#E8F3FF] p-2 rounded-xl">
            <Database className="w-6 h-6 text-[#3182F6]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">어드민</span>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl hover:bg-[#F2F4F6] transition-colors text-gray-700 hover:text-gray-900 font-medium group">
            <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-[#3182F6] transition-colors" />
            <span>등록된 풀이</span>
          </Link>
          <Link href="/admin/upload" className="flex items-center space-x-3 px-4 py-3.5 rounded-2xl hover:bg-[#F2F4F6] transition-colors text-gray-700 hover:text-gray-900 font-medium group">
            <PlusCircle className="w-5 h-5 text-gray-400 group-hover:text-[#3182F6] transition-colors" />
            <span>새 풀이 등록</span>
          </Link>
        </nav>
        
        <div className="pt-4 border-t border-gray-100">
           <Link href="/" className="flex items-center space-x-2 px-4 py-3.5 rounded-2xl hover:bg-[#F2F4F6] transition-colors text-gray-500 hover:text-gray-700 font-medium text-sm">
             <ChevronLeft className="w-4 h-4" />
             <span>서비스 화면으로</span>
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 lg:p-12 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
