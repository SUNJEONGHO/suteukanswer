'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('정말로 이 문제 풀이를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/problems?id=${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          router.refresh();
        } else {
          alert('삭제에 실패했습니다.');
          setIsDeleting(false);
        }
      } catch (error) {
        alert('서버와 통신 중 오류가 발생했습니다.');
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center bg-[#FFF0F0] text-[#E02424] hover:bg-[#FFE0E0] px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
    >
      <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
      {!isDeleting && <Trash2 className="w-3.5 h-3.5 ml-1.5" />}
    </button>
  );
}
