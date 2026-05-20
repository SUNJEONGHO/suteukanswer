import clientPromise from '@/lib/mongodb';
import Link from 'next/link';
import { FileText, ExternalLink, Plus, Edit } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const client = await clientPromise;
  const db = client.db('math_platform');
  const problems = await db.collection('problems').find().sort({ subject: 1, chapter: 1, problemNumber: 1 }).toArray();

  return (
    <div className="pb-16 font-sans">
      <div className="flex items-end justify-between mb-8 pl-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">등록된 풀이</h1>
          <p className="text-gray-500 font-medium">총 {problems.length}개의 해설이 서비스 중입니다.</p>
        </div>
        <Link href="/admin/upload" className="bg-[#3182F6] hover:bg-[#1b64da] active:bg-[#1a5bc2] text-white px-5 py-3 rounded-2xl font-semibold shadow-sm transition-all flex items-center">
          <Plus className="w-5 h-5 mr-1.5" />
          새 풀이 등록
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">
        {problems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">등록된 풀이가 없어요</h3>
            <p className="text-gray-500">새로운 문제 풀이를 등록해서 학생들에게 도움을 주세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-semibold text-[13px] uppercase tracking-wider">
                  <th className="px-8 py-5 whitespace-nowrap">과목</th>
                  <th className="px-8 py-5 whitespace-nowrap">단원</th>
                  <th className="px-8 py-5 whitespace-nowrap">문제 번호</th>
                  <th className="px-8 py-5 whitespace-nowrap">문제 설명</th>
                  <th className="px-8 py-5 whitespace-nowrap">등록일</th>
                  <th className="px-8 py-5 text-right whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {problems.map((p) => (
                  <tr key={p._id.toString()} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 font-semibold text-gray-900 whitespace-nowrap">{p.subject}</td>
                    <td className="px-8 py-5 text-gray-600 font-medium whitespace-nowrap">{p.chapter}</td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="bg-[#F2F4F6] text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {p.problemNumber}번
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-500 font-medium max-w-[200px] truncate whitespace-nowrap" title={p.description}>
                      {p.description || '-'}
                    </td>
                    <td className="px-8 py-5 text-gray-400 text-sm font-medium whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-2">
                        <Link href={`/problem/${p._id.toString()}`} target="_blank" className="inline-flex items-center justify-center bg-[#E8F3FF] text-[#3182F6] hover:bg-[#d3e8ff] px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors">
                          상세 보기
                          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                        <Link href={`/admin/upload?id=${p._id.toString()}`} className="inline-flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors">
                          수정
                          <Edit className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                        <DeleteButton id={p._id.toString()} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
