"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

interface MathContentProps {
  content: string;
  className?: string;
}

// 인라인 수식 $...$ 와 블록 수식 $$...$$ 모두 지원
export default function MathContent({ content, className = '' }: MathContentProps) {
  const components: Components = {
    // 단락 간격
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    // 코드 블록
    code: ({ children, className: codeClass }) => {
      const isInline = !codeClass;
      if (isInline) {
        return <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
      }
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto my-2">
          <code className="text-sm font-mono">{children}</code>
        </pre>
      );
    },
    // 강조
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    // 목록
    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    // 제목
    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
    // 인용
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-3 italic text-gray-600 dark:text-gray-400 my-2">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className={`math-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
