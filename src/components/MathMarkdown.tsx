import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface Props {
  children: string;
  className?: string;
}

export function MathMarkdown({ children, className }: Props) {
  return (
    <div className={cn("math-md leading-relaxed text-sm", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, output: "html" }]]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-2">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-muted/60 border rounded-lg p-3 my-3 overflow-x-auto text-xs">
                  <code {...props}>{children}</code>
                </pre>
              );
            }
            return <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[0.85em] font-mono">{children}</code>;
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-3 my-3 italic text-muted-foreground">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
