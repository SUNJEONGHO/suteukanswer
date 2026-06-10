# Gemini Developer Guide

이 가이드는 이 프로젝트에서 작업할 때 필요한 주요 명령어와 개발 가이드라인을 제공합니다.

## 개발 명령어
- **개발 서버 실행**: `npm run dev`
- **프로덕션 빌드**: `npm run build`
- **프로덕션 서버 시작**: `npm run start`
- **린트 검사**: `npm run lint`

## 프로젝트 개요
- **목적**: 수능특강 문제 풀이 해설 웹 서비스
- **기술 스택**:
  - **Framework**: Next.js (버전 16.x)
  - **Database**: Vercel Postgres (@vercel/postgres)
  - **Styling**: Tailwind CSS (버전 4)
  - **Language**: TypeScript / JavaScript

## 코드 및 개발 규칙
1. **Next.js 규칙**:
   - `node_modules/next/dist/docs/` 혹은 Next.js 공식 문서의 최신 규칙을 따르고, Deprecation 경고가 발생하는 API는 피합니다.
2. **에이전트 규칙**:
   - 자세한 규칙은 [AGENTS.md](file:///c:/Users/sunj0/OneDrive/바탕 화면/antigravity/AGENTS.md)를 참고하세요.
3. **스타일 및 디자인**:
   - 모던하고 깔끔한 다크 모드, HSL 어울림 색상표, 부드러운 애니메이션을 적극 활용합니다.
   - UI 구성 시 placeholders 대신 실제 이미지나 그래픽 에셋을 사용합니다.

