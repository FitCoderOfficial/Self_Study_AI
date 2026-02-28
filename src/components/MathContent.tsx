"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

interface MathContentProps {
  content: string;
  className?: string;
}

// ── 세그먼트 단위 bare LaTeX 래핑 패턴 ─────────────────────────
// 이미 $...$안에 있는 텍스트에는 적용되지 않음
const BARE_LATEX_PATTERNS: RegExp[] = [
  // 분수 (중첩 중괄호 2단계 지원)
  /\\frac\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}/g,
  // 제곱근 (선택적 n제곱근 []  포함)
  /\\sqrt(?:\[[^\]]*\])?\{(?:[^{}]|\{[^{}]*\})*\}/g,
  // 벡터·데코레이터
  /\\(?:vec|hat|bar|tilde|overrightarrow|overleftarrow|overline|underline|widehat|widetilde)\{(?:[^{}]|\{[^{}]*\})*\}/g,
  // 이항계수
  /\\(?:binom|dbinom|tbinom)\{(?:[^{}]|\{[^{}]*\})*\}\{(?:[^{}]|\{[^{}]*\})*\}/g,
  // 합·적분·곱 (첨자 포함)
  /\\(?:sum|int|oint|iint|iiint|prod|coprod|bigcup|bigcap)(?:_\{[^}]*\}|\^[^{}\s])?(?:\^\{[^}]*\}|_[^{}\s])?/g,
  // 극한
  /\\lim(?:_\{[^}]*\})?/g,
  // 그리스 소문자
  /\\(?:alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega)(?![a-zA-Z{])/g,
  // 그리스 대문자
  /\\(?:Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?![a-zA-Z{])/g,
  // 관계·연산자
  /\\(?:leq|le|geq|ge|neq|ne|approx|equiv|sim|simeq|cong|subset|supset|subseteq|supseteq|in|notin|ni|cup|cap|wedge|vee|oplus|otimes|cdot|times|div|pm|mp|perp|parallel|mid|nmid|propto)(?![a-zA-Z{])/g,
  // 화살표
  /\\(?:rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|Leftrightarrow|to|gets|mapsto|hookrightarrow|uparrow|downarrow|Uparrow|Downarrow)(?![a-zA-Z{])/g,
  // 기타 기호
  /\\(?:cdots|ldots|vdots|ddots|infty|partial|nabla|forall|exists|nexists|emptyset|varnothing|angle|triangle|square|diamond|star|circ|bullet|dagger|langle|rangle)(?![a-zA-Z{])/g,
  // 수학 함수
  /\\(?:log|ln|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|max|min|sup|inf|det|exp|Pr|gcd|lcm|deg)(?![a-zA-Z{])/g,
  // 서체 변환
  /\\(?:mathbb|mathbf|mathit|mathcal|mathsf|mathrm|mathtt)\{[^}]+\}/g,
  // \text{...} 단독 노출
  /\\text\{[^}]+\}/g,
];

// $...$ 또는 $$...$$ 바깥 텍스트 세그먼트에서만 bare LaTeX 래핑
function wrapBareLaTeX(segment: string): string {
  let result = segment;
  for (const pat of BARE_LATEX_PATTERNS) {
    // 각 패턴마다 플래그를 초기화하여 전역 매칭 보장
    const re = new RegExp(pat.source, pat.flags);
    result = result.replace(re, (match) => `$${match}$`);
  }
  return result;
}

/**
 * AI가 반환하는 다양한 LaTeX 형식을 KaTeX 표준으로 정규화
 * 1. \(...\) / \[...\] → $...$ / $$...$$
 * 2. 기존 $...$/$$ 경계로 분리 후, 바깥 세그먼트만 bare LaTeX 자동 래핑
 * 3. $ 앞뒤 불필요한 공백 제거
 */
function preprocessMath(raw: string): string {
  // Step 1: 델리미터 정규화
  let text = raw
    .replace(/\\\(\s*([\s\S]+?)\s*\\\)/g, (_m, inner) => `$${inner.trim()}$`)
    .replace(/\\\[\s*([\s\S]+?)\s*\\\]/g, (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`);

  // Step 2: 기존 $...$, $$...$$ 세그먼트로 분리
  // split with capturing group → 홀수 인덱스가 수식, 짝수가 일반 텍스트
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/);

  text = parts
    .map((part, i) => (i % 2 === 0 ? wrapBareLaTeX(part) : part))
    .join('');

  // Step 3: $ 앞뒤 공백 정리 (렌더링 오류 방지)
  text = text
    .replace(/\$\s+(?=\S)/g, '$')
    .replace(/(?<=\S)\s+\$/g, '$');

  return text;
}

export default function MathContent({ content, className = '' }: MathContentProps) {
  const processed = preprocessMath(content || '');

  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2.5 last:mb-0 leading-[1.9]">{children}</p>
    ),
    code: ({ children, className: codeClass }) => {
      const isInline = !codeClass?.includes('language-');
      if (isInline) {
        return (
          <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[0.85em] font-mono text-red-700 dark:text-red-300">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-2 text-sm">
          <code className="font-mono">{children}</code>
        </pre>
      );
    },
    strong: ({ children }) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-5 space-y-1 mb-3">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-5 space-y-1 mb-3">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
    h1: ({ children }) => (
      <h1 className="text-lg font-bold mb-2 mt-3 text-gray-900 dark:text-gray-100">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-base font-bold mb-1.5 mt-2.5 text-gray-900 dark:text-gray-100">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold mb-1 mt-2 text-gray-700 dark:text-gray-300">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-3 my-2 text-gray-600 dark:text-gray-400 italic">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="border-collapse w-full text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5">{children}</td>
    ),
    hr: () => <hr className="my-3 border-gray-200 dark:border-gray-600" />,
  };

  return (
    <div className={`math-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, {
            strict: false,
            throwOnError: false,
            errorColor: '#cc4444',
            trust: true,
            macros: {
              '\\RR': '\\mathbb{R}',
              '\\NN': '\\mathbb{N}',
              '\\ZZ': '\\mathbb{Z}',
              '\\QQ': '\\mathbb{Q}',
              '\\CC': '\\mathbb{C}',
              // 수능 자주 사용 매크로
              '\\nCr': '\\binom{n}{r}',
              '\\abs': '\\left|#1\\right|',
            },
          }],
        ]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
