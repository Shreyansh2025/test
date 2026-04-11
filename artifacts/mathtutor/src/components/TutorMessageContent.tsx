import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export function TutorMessageContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-foreground",
        "[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden",
        "[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-sm",
        "[&_code]:text-sm [&_code]:before:content-none [&_code]:after:content-none",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              strict: false,
              throwOnError: false,
              errorColor: "hsl(var(--muted-foreground))",
            },
          ],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
