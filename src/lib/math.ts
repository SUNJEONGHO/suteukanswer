/**
 * HTML 해설 코드 내의 MathJax 설정을 강제 주입하고 깨진 LaTeX 기호들을 복구합니다.
 * @param html 원본 HTML 해설 문자열
 * @returns 복구 및 설정이 강제 주입된 HTML 문자열
 */
export function processMathJaxHtml(html: string): string {
  if (!html) return '';

  let processed = html;

  // 1. ₩ 또는 W로 깨진 LaTeX 특수 명령어 복구
  // 'Wtimes' 또는 '₩times' -> '\times'
  processed = processed.replace(/(?:W|₩)times\b/g, '\\times');

  // 자주 쓰이는 다른 LaTeX 기호들이 한글 윈도우 인코딩 등의 문제로 W/₩로 깨진 것 복구
  const commonLatexCommands = [
    'le', 'ge', 'ne', 'pm', 'div', 'in', 'notin', 'subseteq', 
    'cap', 'cup', 'cdot', 'alpha', 'beta', 'theta', 'pi', 'sigma', 
    'infty', 'sqrt', 'log', 'sin', 'cos', 'tan', 'triangle', 'left', 'right',
    'frac', 'sum', 'lim', 'to', 'approx', 'equiv'
  ];

  for (const cmd of commonLatexCommands) {
    const regex = new RegExp(`(?:W|₩)${cmd}\\b`, 'g');
    processed = processed.replace(regex, `\\${cmd}`);
  }

  // 2. MathJax 3 설정 강제 삽입 스크립트
  // $ 및 $$ 디리미터를 수식 구분자로 허용하도록 설정
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

  // <head> 태그 바로 뒤에 설정을 주입하여 기존 설정을 덮어쓰거나 우선 로드되게 함
  // <head> 태그 바로 뒤에 설정을 주입하여 기존 설정을 덮어쓰거나 우선 로드되게 함
  // replace 대신 split/join을 사용하여 대체 문자열의 $ 기호 매크로 오작동을 원천 예방합니다.
  if (processed.includes('<head>')) {
    const parts = processed.split('<head>');
    processed = parts[0] + '<head>' + mathJaxConfigScript + parts.slice(1).join('<head>');
  } else if (processed.includes('<HEAD>')) {
    const parts = processed.split('<HEAD>');
    processed = parts[0] + '<HEAD>' + mathJaxConfigScript + parts.slice(1).join('<HEAD>');
  } else {
    // head가 없는 불완전한 HTML인 경우 맨 앞에 강제 삽입
    processed = mathJaxConfigScript + processed;
  }

  return processed;
}
