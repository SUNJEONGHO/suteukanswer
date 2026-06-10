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
  return <>{children}</>;
}
