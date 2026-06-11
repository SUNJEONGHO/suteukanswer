process.env.POSTGRES_URL = "postgresql://neondb_owner:npg_6WcQo4kRpPtq@ep-proud-tooth-aphik1iu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const { sql } = require('@vercel/postgres');
const fs = require('fs');

function processMathJaxHtml(html) {
  if (!html) return '';

  let processed = html;
  const scriptBlocks = [];

  // 1. <script> 태그 블록을 추출하여 placeholders로 치환하고 임시 저장
  // 충돌 방지를 위해 기존 MathJax 설정 스크립트 블록은 저장하지 않고 HTML에서 영구 제거(drop)합니다.
  processed = processed.replace(/<script([\s\S]*?)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
    if (code.includes('MathJax =') || code.includes('window.MathJax =')) {
      return '';
    }
    const placeholder = `<!--__SCRIPT_BLOCK_PLACEHOLDER_${scriptBlocks.length}__-->`;
    scriptBlocks.push({ attrs, code });
    return placeholder;
  });

  // 2. [HTML Body 영역 가공]
  // 2-1. 다중 백슬래시 디리미터 교정 (\\\(, \\( -> \()
  processed = processed.replace(/\\+\(/g, '\\(');
  processed = processed.replace(/\\+\)/g, '\\)');
  processed = processed.replace(/\\+\[/g, '\\[');
  processed = processed.replace(/\\+\]/g, '\\]');

  // 2-2. 일반 괄호 ( ... ) 내에 수식이 포함된 경우 교정 (이미 백슬래시가 붙은 수식 괄호는 제외)
  processed = processed.replace(/(?<!\\)\(\s*([^)]*?(?:₩|\\|W|_|\^|\{|\}|\\alpha|\\beta|\\theta|\\pi|\\sum|\\frac|\\times|\\circ)[^)]*?)\)/g, (match, content) => {
    // \left( ... \right) 와 같은 특수 괄호 구조는 치환 방지
    if (content.includes('left') || content.includes('right')) {
      return match;
    }
    return '\\(' + content + '\\)';
  });

  // 2-3. 단독 깨진 ₩ 기호 복구
  processed = processed.replace(/₩([a-zA-Z]+)/g, '\\$1');

  // 2-4. W로 깨진 LaTeX 명령어 복구
  const commonLatexCommands = [
    'times', 'le', 'ge', 'ne', 'pm', 'div', 'in', 'notin', 'subseteq', 
    'cap', 'cup', 'cdot', 'alpha', 'beta', 'theta', 'pi', 'sigma', 
    'infty', 'sqrt', 'log', 'sin', 'cos', 'tan', 'triangle', 'left', 'right',
    'frac', 'sum', 'lim', 'to', 'approx', 'equiv', 'overline'
  ];

  for (const cmd of commonLatexCommands) {
    const regex = new RegExp(`W${cmd}\\b`, 'g');
    processed = processed.replace(regex, `\\${cmd}`);
  }

  // 3. [Script 영역 가공 및 복원]
  scriptBlocks.forEach((block, index) => {
    let code = block.code;
    
    // script 내부에서는 JS 문자열 이스케이프 해제를 대비해 이중 백슬래시(\\\\)로 통일
    code = code.replace(/\\+\(/g, '\\\\(');
    code = code.replace(/\\+\)/g, '\\\\)');
    code = code.replace(/\\+\[/g, '\\\\[');
    code = code.replace(/\\+\]/g, '\\\\]');
    // \frac, \alpha 등 LaTeX 명령어 앞의 백슬래시도 2개로 통일
    code = code.replace(/\\+([a-zA-Z]+)/g, '\\\\$1');
    
    const restoredScript = `<script${block.attrs}>${code}</script>`;
    // replace 두 번째 인자에 콜백 함수를 주어 백슬래시 이스케이프 유실을 방지합니다.
    processed = processed.replace(`<!--__SCRIPT_BLOCK_PLACEHOLDER_${index}__-->`, () => restoredScript);
  });

  // MathJax 3 설정 강제 삽입 스크립트
  const mathJaxConfigScript = `
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\\\\\\\(', '\\\\\\\\)']],
      displayMath: [['$$', '$$'], ['\\\\\\\\[', '\\\\\\\\]']],
      processEscapes: true
    },
    options: {
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    }
  };
</script>
`;

  if (processed.includes('<head>')) {
    const partsHead = processed.split('<head>');
    processed = partsHead[0] + '<head>' + mathJaxConfigScript + partsHead.slice(1).join('<head>');
  } else if (processed.includes('<HEAD>')) {
    const partsHead = processed.split('<HEAD>');
    processed = partsHead[0] + '<HEAD>' + mathJaxConfigScript + partsHead.slice(1).join('<HEAD>');
  } else {
    processed = mathJaxConfigScript + processed;
  }

  return processed;
}

async function run() {
  const res = await sql`SELECT id, content_html FROM problems WHERE id = 19`;
  if (res.rows.length > 0) {
    const original = res.rows[0].content_html;
    fs.writeFileSync('original_19.html', original);
    const processed = processMathJaxHtml(original);
    fs.writeFileSync('processed_19.html', processed);
    console.log("Wrote original_19.html and processed_19.html successfully!");
  }
}
run().catch(console.error);
