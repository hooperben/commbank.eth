import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownProps {
  children: string;
}

/**
 * Markdown component that renders markdown content with proper styling
 * Supports:
 * - Headings (h1-h6)
 * - Lists (ordered and unordered)
 * - Links
 * - Bold, italic, strikethrough
 * - Code blocks and inline code
 * - Tables (via remark-gfm)
 * - Blockquotes
 * - HTML (via rehype-raw)
 */
export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      // className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-8 mb-4 first:mt-0 break-words">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-8 mb-4 first:mt-0 break-words">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mt-6 mb-3 first:mt-0 break-words">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg sm:text-xl font-semibold tracking-tight mt-6 mb-3 first:mt-0 break-words">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-base sm:text-lg font-semibold tracking-tight mt-4 mb-2 first:mt-0 break-words">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-base font-semibold tracking-tight mt-4 mb-2 first:mt-0">
            {children}
          </h6>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 leading-7 break-words">{children}</p>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline font-medium break-words"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-7">{children}</li>,
        // Code
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono break-all">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-muted p-2 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono mb-4 break-all">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-4">{children}</pre>,
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-3 sm:pl-4 italic my-4 text-muted-foreground break-words text-sm sm:text-base">
            {children}
          </blockquote>
        ),
        // Horizontal rule
        hr: () => <hr className="my-8 border-border" />,
        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Emphasis/Italic
        em: ({ children }) => <em className="italic">{children}</em>,
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="px-4 py-2 text-sm">{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
