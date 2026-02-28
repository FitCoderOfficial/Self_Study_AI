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

/**
 * AI가 반환하는 다양한 LaTeX 형식을 KaTeX 표준으로 정규화
 */
function preprocessMath(raw: string): string {
  return raw
    // \( ... \) → $ ... $  (인라인 LaTeX 변환, 줄바꿈 포함)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${inner}$`)
    // \[ ... \] → $$ ... $$  (블록 LaTeX 변환, 줄바꿈 포함)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner) => `\n$$${inner}$$\n`)
    // 달러 기호 앞뒤 공백 정리 (렌더링 오류 방지)
    .replace(/\$\s+/g, '$')
    .replace(/\s+\$/g, '$')
    // LaTeX 명령어가 $ 없이 노출된 경우 처리 (흔한 패턴)
    .replace(/(?<!\$)(\\frac\{[^}]+\}\{[^}]+\})/g, '$$$1$$')
    .replace(/(?<!\$)(\\sqrt\{[^}]+\})/g, '$$$1$$')
    .replace(/(?<!\$)(\\sum_\{[^}]+\})/g, '$$$1$$')
    .replace(/(?<!\$)(\\lim_\{[^}]+\})/g, '$$$1$$');
}

export default function MathContent({ content, className = '' }: MathContentProps) {
  const processed = preprocessMath(content || '');

  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2.5 last:mb-0 leading-[1.9]">{children}</p>
    ),
    // 수식 블록 ($$...$$) — rehype-katex가 .math-display로 감싸줌
    // 인라인 수식 ($...$) — .math-inline으로 감싸줌
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
            // 추가 매크로 지원
            macros: {
              '\\RR': '\\mathbb{R}',
              '\\NN': '\\mathbb{N}',
              '\\ZZ': '\\mathbb{Z}',
              '\\QQ': '\\mathbb{Q}',
              '\\le': '\\leq',
              '\\ge': '\\geq',
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
