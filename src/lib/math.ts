/**
 * HTML 해설 코드 내의 MathJax 설정을 강제 주입하고 깨진 LaTeX 기호들을 복구합니다.
 * @param html 원본 HTML 해설 문자열
 * @returns 복구 및 설정이 강제 주입된 HTML 문자열
 */
export function processMathJaxHtml(html: string): string {
  if (!html) return '';

  let processed = html;
  
  const scriptBlocks: { attrs: string; code: string }[] = [];
  const mathBlocks: string[] = [];

  // 1. <script> 태그 블록을 추출하여 placeholders로 치환하고 임시 저장
  processed = processed.replace(/<script([\s\S]*?)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
    if (code.includes('MathJax =') || code.includes('window.MathJax =')) {
      return '';
    }
    const placeholder = `<!--__SCRIPT_BLOCK_PLACEHOLDER_${scriptBlocks.length}__-->`;
    scriptBlocks.push({ attrs, code });
    return placeholder;
  });

  // 2-1. 다중 백슬래시 디리미터 교정 (\\\(, \\( -> \()
  processed = processed.replace(/\\+\(/g, () => '\\(');
  processed = processed.replace(/\\+\)/g, () => '\\)');
  processed = processed.replace(/\\+\[/g, () => '\\[');
  processed = processed.replace(/\\+\]/g, () => '\\]');

  // 2-2. 잘못된 이중 디리미터 정리
  processed = processed.replace(/\\\(\\\(/g, () => '\\(');
  processed = processed.replace(/\\\)\\\)/g, () => '\\)');
  processed = processed.replace(/\\\]\\\]/g, () => '\\]');
  processed = processed.replace(/\\\[\\\[/g, () => '\\[');
  processed = processed.replace(/\\\s+\)/g, () => '\\)');
  processed = processed.replace(/\\\s+\]/g, () => '\\]');

  // 2-3. 단독 깨진 ₩ 기호 복구 및 W 명령어 복구
  processed = processed.replace(/₩([a-zA-Z]+)/g, '\\$1');
  const commonLatexCommands = [
    'times', 'le', 'ge', 'ne', 'pm', 'div', 'in', 'notin', 'subseteq', 
    'cap', 'cup', 'cdot', 'alpha', 'beta', 'theta', 'pi', 'sigma', 
    'infty', 'sqrt', 'log', 'sin', 'cos', 'tan', 'triangle', 'left', 'right',
    'frac', 'sum', 'lim', 'to', 'approx', 'equiv', 'overline', 'text'
  ];
  for (const cmd of commonLatexCommands) {
    const regex = new RegExp(`W${cmd}\\b`, 'g');
    processed = processed.replace(regex, `\\${cmd}`);
  }

  // 2-4. 중첩된 디리미터 제거 (LaTeX 구문 내부에 중첩된 \( \) 기호를 일반 괄호 ( ) 로 치환)
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    const cleanFormula = formula.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
    return '\\[' + cleanFormula + '\\]';
  });
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    const cleanFormula = formula.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
    return '\\(' + cleanFormula + '\\)';
  });

  // 2-5. [중요] 이미 잘 형성된 수식 블록은 보호하기 위해 임시 플레이스홀더로 추출합니다.
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
    const placeholder = `###MATHBLOCK${mathBlocks.length}###`;
    mathBlocks.push(match);
    return placeholder;
  });
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
    const placeholder = `###MATHBLOCK${mathBlocks.length}###`;
    mathBlocks.push(match);
    return placeholder;
  });
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const placeholder = `###MATHBLOCK${mathBlocks.length}###`;
    mathBlocks.push(match);
    return placeholder;
  });

  // 2-6. 일반 괄호 ( ... ) 내에 수식이 포함된 경우 교정 (이미 백슬래시가 붙은 수식 괄호는 제외)
  const inlineMathDeductionRegexPattern = '(?<!\\\\)\\(\\s*([^)]*?(?:₩|\\\\|W|_|\\^|\\{|\\}|\\\\alpha|\\\\beta|\\\\theta|\\\\pi|\\\\sum|\\\\frac|\\\\times|\\\\circ|\\\\text)[^)]*?)\\)';
  processed = processed.replace(new RegExp(inlineMathDeductionRegexPattern, 'g'), (match, content) => {
    if (content.includes('left') || content.includes('right')) {
      return match;
    }
    return '\\(' + content + '\\)';
  });

  // 2-7. 수식 블록 원상복구
  mathBlocks.forEach((block, index) => {
    processed = processed.replace(`###MATHBLOCK${index}###`, () => block);
  });

  // 3. [Script 영역 가공 및 복원]
  scriptBlocks.forEach((block, index) => {
    let code = block.code;
    code = code.replace(/\\+\(/g, '\\\\(');
    code = code.replace(/\\+\)/g, '\\\\)');
    code = code.replace(/\\+\[/g, '\\\\[');
    code = code.replace(/\\+\]/g, '\\\\]');
    code = code.replace(/\\+([a-zA-Z]+)/g, '\\\\$1');
    const restoredScript = `<script${block.attrs}>${code}</script>`;
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
    '              element.closest(\'[id*=\"status\"]\') || \n' +
    '              element.closest(\'[id*=\"Status\"]\') || \n' +
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
    '            var targets = document.querySelectorAll(\'.status-box, [id*=\"status\"], [id*=\"Status\"], .grid-info, .legend\');\n' +
    '            if (targets.length > 0) {\n' +
    '              observer.disconnect();\n' +
    '              var promises = [];\n' +
    '              targets.forEach(function(el) {\n' +
    '                promises.push(MathJax.typesetPromise([el]));\n' +
    '              });\n' +
    '              Promise.all(promises).then(function() {\n' +
    '                observer.observe(document.body, { childList: true, subtree: true, characterData: true });\n' +
    '              }).catch(function(err) {\n' +
    '                console.log(\'Dynamic typesetting error:\', err);\n' +
    '                observer.observe(document.body, { childList: true, subtree: true, characterData: true });\n' +
    '              });\n' +
    '            }\n' +
    '          }, 60);\n' +
    '        }\n' +
    '      });\n' +
    '      observer.observe(document.body, { childList: true, subtree: true, characterData: true });\n' +
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
