import { sql, initDb } from '@/lib/db';
import Link from 'next/link';
import { FileText, ExternalLink, Plus, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let problems: any[] = [];
  let connectionError = '';

  try {
    await initDb();
    const result = await sql`
      SELECT * FROM problems 
      ORDER BY subject ASC, chapter ASC, problem_number ASC
    `;
    problems = result.rows.map(row => ({
      _id: row.id.toString(),
      id: row.id,
      subject: row.subject,
      chapter: row.chapter,
      problemNumber: row.problem_number,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error: any) {
    console.error('Failed to fetch problems in AdminDashboard:', error);
    connectionError = error.message || String(error);
  }

  if (connectionError) {
    return (
      <div className="pb-16 font-sans">
        <div className="mb-8 pl-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">등록된 풀이</h1>
          <p className="text-gray-500 font-medium">관리자 대시보드</p>
        </div>

        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 max-w-3xl">
          <div className="flex items-start space-x-5">
            <div className="bg-red-50 p-4 rounded-2xl text-red-500 shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">데이터베이스 연결 실패</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Vercel Postgres 데이터베이스에 접속할 수 없습니다. Vercel 프로젝트 대시보드에서 Postgres 데이터베이스를 생성하고 링크하셨는지 확인해 주세요.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-blue-900">💡 Vercel Postgres 생성 및 연결 방법</h4>
                <ol className="list-decimal list-inside text-xs text-blue-800 space-y-2 leading-relaxed">
                  <li><strong><a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900">Vercel 프로젝트 대시보드</a></strong>에 로그인합니다.</li>
                  <li>프로젝트의 상단 메뉴 탭 중에서 <strong>Storage</strong>를 클릭합니다.</li>
                  <li><strong>Create Database</strong> 버튼을 누르고 <strong>Postgres</strong>를 선택하여 생성합니다.</li>
                  <li>생성이 완료되면 <strong>Connect</strong> 버튼을 눌러 프로젝트와 연결(Link)해 줍니다.</li>
                  <li>연결이 완료되면 이 어드민 페이지가 즉시 활성화됩니다!</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 font-mono text-xs text-gray-600 border border-gray-100 overflow-x-auto whitespace-pre-wrap max-w-full">
                <strong>상세 에러 내용:</strong>{"\n"}{connectionError}
              </div>

              <div className="flex space-x-3 pt-2">
                <Link 
                  href="/admin"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  다시 연결 시도 (새로고침)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
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
                        <Link href={`/problem/${p._id}`} target="_blank" className="inline-flex items-center justify-center bg-[#E8F3FF] text-[#3182F6] hover:bg-[#d3e8ff] px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors">
                          상세 보기
                          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                        <Link href={`/admin/upload?id=${p._id}`} className="inline-flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors">
                          수정
                          <Edit className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                        <DeleteButton id={p._id} />
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
