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
  processed = processed.replace(/\\+\(/g, () => '\\(');
  processed = processed.replace(/\\+\)/g, () => '\\)');
  processed = processed.replace(/\\+\[/g, () => '\\[');
  processed = processed.replace(/\\+\]/g, () => '\\]');

  // 2-2. 잘못된 이중 디리미터 정리 (\(\( -> \(, \)\) -> \))
  processed = processed.replace(/\\\(\\\(/g, () => '\\(');
  processed = processed.replace(/\\\)\\\)/g, () => '\\)');
  processed = processed.replace(/\\\]\\\]/g, () => '\\]');
  processed = processed.replace(/\\\[\\\[/g, () => '\\[');
  // 공백이 포함된 깨진 닫는 기호 보정 (\ ) -> \))
  processed = processed.replace(/\\\s+\)/g, () => '\\)');
  processed = processed.replace(/\\\s+\]/g, () => '\\]');

  // 2-3. 중첩된 디리미터 제거 (LaTeX 구문 내부에 중첩된 \( \) 기호를 일반 괄호 ( ) 로 치환)
  for (let i = 0; i < 3; i++) {
    const prev = processed;
    processed = processed.replace(/\\\(([^)]*?)\\\((.*?)\\\)([^)]*?)\\\)/g, (match, before, inner, after) => {
      return '\\(' + before + '(' + inner + ')' + after + '\\)';
    });
    processed = processed.replace(/\\\[([^\]]*?)\\\((.*?)\\\)([^\]]*?)\\\]/g, (match, before, inner, after) => {
      return '\\[' + before + '(' + inner + ')' + after + '\\]';
    });
    if (prev === processed) break;
  }

  // 2-4. 일반 괄호 ( ... ) 내에 수식이 포함된 경우 교정 (이미 백슬래시가 붙은 수식 괄호는 제외)
  const inlineMathDeductionRegexPattern = '(?<!\\\\)\\(\\s*([^)]*?(?:₩|\\\\|W|_|\\^|\\{|\\}|\\\\alpha|\\\\beta|\\\\theta|\\\\pi|\\\\sum|\\\\frac|\\\\times|\\\\circ)[^)]*?)\\)';
  processed = processed.replace(new RegExp(inlineMathDeductionRegexPattern, 'g'), (match, content) => {
    // \left( ... \right) 와 같은 특수 괄호 구조는 치환 방지
    if (content.includes('left') || content.includes('right')) {
      return match;
    }
    return '\\(' + content + '\\)';
  });

  // 2-5. 단독 깨진 ₩ 기호 복구
  processed = processed.replace(/₩([a-zA-Z]+)/g, '\\$1');

  // 2-6. W로 깨진 LaTeX 명령어 복구
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
    
    // script 내부에서는 JS 문자열 이스케이프 해제를 대비해 이중 백슬래시(\\\&)로 통일
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

  // MathJax 3 설정 및 MutationObserver 자동 갱신 스크립트 강제 삽입
  const mathJaxConfigScript = 
    '<script>\n' +
    '  window.MathJax = {\n' +
    '    tex: {\n' +
    '      inlineMath: [[\'$\', \'$\'], [\'\\\\(\', \'\\\\)\']],\n' +
    '      displayMath: [[\'\$\$\', \'\$\$\'], [\'\\\\\\[\', \'\\\\\\]\']],\n' +
    '      processEscapes: true\n' +
    '    },\n' +
    '    options: {\n' +
    '      ignoreHtmlClass: \'tex2jax_ignore\',\n' +
    '      processHtmlClass: \'tex2jax_process\'\n' +
    '    }\n' +
    '  };\n' +
    '</script>\n' +
    '<script>\n' +
    '  // 슬라이더 조작 등으로 본문이 동적 변경될 때 MathJax 수식 렌더링을 자동으로 트리거해주는 MutationObserver 주입\n' +
    '  document.addEventListener(\'DOMContentLoaded\', function() {\n' +
    '    if (window.MathJax) {\n' +
    '      var observer = new MutationObserver(function(mutations) {\n' +
    '        var shouldTypeset = false;\n' +
    '        mutations.forEach(function(mutation) {\n' +
    '          if (mutation.type === \'childList\' || mutation.type === \'characterData\') {\n' +
    '            var target = mutation.target;\n' +
    '            if (!target) return;\n' +
    '            var element = target.nodeType === 1 ? target : target.parentElement;\n' +
    '            if (!element) return;\n' +
    '            if (element.closest && (element.closest(\'.mjx-container\') || element.closest(\'script\') || element.closest(\'style\'))) {\n' +
    '              return;\n' +
    '            }\n' +
    '            if (element.closest && (\n' +
    '              element.closest(\'.status-box\') || \n' +
    '              element.closest(\'[id*="status"]\') || \n' +
    '              element.closest(\'[id*="Status"]\') || \n' +
    '              element.closest(\'.grid-info\') || \n' +
    '              element.closest(\'.legend\')\n' +
    '            )) {\n' +
    '              shouldTypeset = true;\n' +
    '            }\n' +
    '          }\n' +
    '        });\n' +
    '        if (shouldTypeset) {\n' +
    '          if (window.mathJaxTimeout) clearTimeout(window.mathJaxTimeout);\n' +
    '          window.mathJaxTimeout = setTimeout(function() {\n' +
    '            var targets = document.querySelectorAll(\'.status-box, [id*="status"], [id*="Status"], .grid-info, .legend\');\n' +
    '            if (targets.length > 0) {\n' +
    '              observer.disconnect();\n' +
    '              var promises = [];\n' +
    '              targets.forEach(function(el) {\n' +
    '                promises.push(MathJax.typesetPromise([el]));\n' +
    '              });\n' +
    '              Promise.all(promises).then(function() {\n' +
    '                observer.observe(document.body, {\n' +
    '                  childList: true,\n' +
    '                  subtree: true,\n' +
    '                  characterData: true\n' +
    '                });\n' +
    '              }).catch(function(err) {\n' +
    '                console.log(\'Dynamic typesetting error:\', err);\n' +
    '                observer.observe(document.body, {\n' +
    '                  childList: true,\n' +
    '                  subtree: true,\n' +
    '                  characterData: true\n' +
    '                });\n' +
    '              });\n' +
    '            }\n' +
    '          }, 60);\n' +
    '        }\n' +
    '      });\n' +
    '      observer.observe(document.body, {\n' +
    '        childList: true,\n' +
    '        subtree: true,\n' +
    '        characterData: true\n' +
    '      });\n' +
    '    }\n' +
    '  });\n' +
    '</script>\n';

  if (processed.includes('<head>')) {
    const partsHead = processed.split('<head>');
    processed = partsHead[0] + '<head>\n' + mathJaxConfigScript + partsHead.slice(1).join('<head>');
  } else if (processed.includes('<HEAD>')) {
    const partsHead = processed.split('<HEAD>');
    processed = partsHead[0] + '<HEAD>\n' + mathJaxConfigScript + partsHead.slice(1).join('<HEAD>');
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
