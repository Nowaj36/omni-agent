import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './copy-button';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }
  if (
    typeof node === 'object' &&
    node !== null &&
    'props' in node &&
    typeof node.props === 'object' &&
    node.props !== null &&
    'children' in node.props
  ) {
    return extractText(node.props.children as React.ReactNode);
  }
  return '';
}

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const code = extractText(children).replace(/\n$/, '');
  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-white/10 bg-black/50">
      <CopyButton
        text={code}
        className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-200">
        {children}
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-7 text-slate-200 [&>*+*]:mt-4 [&_a]:text-amd-bright [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-amd/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:font-semibold [&_h3]:text-white [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-white [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: CodeBlock,
          code: ({ children, className }) =>
            className === undefined ? (
              <code className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-amd-bright">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
