import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const client = await clientPromise;
  const db = client.db('math_platform');
  const problem = await db.collection('problems').findOne({ _id: new ObjectId(id) });

  if (!problem) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>다른 문제 찾기</span>
          </Link>
          
          <div className="flex items-center">
            <div className="flex items-center bg-[#F2F4F6] px-4 py-1.5 rounded-full text-gray-700 font-semibold text-[15px]">
              <span>{problem.subject}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span>{problem.chapter}단원</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-[#3182F6]">{problem.problemNumber}번</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:py-10 flex flex-col">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col min-h-[800px] border border-gray-100">
          {/* 
            Render the raw HTML directly via iframe srcDoc.
            This ensures that full HTML documents (with html, head, body, script tags)
            execute properly without breaking the Next.js parent application layout.
          */}
          <iframe 
            srcDoc={problem.contentHtml}
            className="w-full h-full flex-1 border-0"
            title={`Problem ${problem.problemNumber} Solution`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </main>
    </div>
  );
}
