import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function renderInlineSegments(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`} className="rounded bg-slate-900 px-1 py-0.5 text-[0.9em] text-cyan-300">{part.slice(1, -1)}</code>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={`${part}-${index}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }

    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={`${part}-${index}`} className="italic text-slate-200">{part.slice(1, -1)}</em>;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function parseBlocks(content: string) {
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: Array<{ type: 'heading' | 'bullet' | 'ordered' | 'code' | 'paragraph'; value: string }> = [];

  let currentParagraph: string[] = [];
  let currentBullet: string[] = [];
  let currentOrdered: string[] = [];
  let currentCode: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', value: currentParagraph.join(' ').trim() });
      currentParagraph = [];
    }
  };

  const flushBullet = () => {
    if (currentBullet.length > 0) {
      blocks.push({ type: 'bullet', value: currentBullet.join('\n') });
      currentBullet = [];
    }
  };

  const flushOrdered = () => {
    if (currentOrdered.length > 0) {
      blocks.push({ type: 'ordered', value: currentOrdered.join('\n') });
      currentOrdered = [];
    }
  };

  const flushCode = () => {
    if (currentCode.length > 0) {
      blocks.push({ type: 'code', value: currentCode.join('\n') });
      currentCode = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      currentCode.push(rawLine);
      continue;
    }

    if (!line) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      continue;
    }

    if (/^#{1,3}\s/.test(rawLine)) {
      flushParagraph();
      flushBullet();
      flushOrdered();
      blocks.push({ type: 'heading', value: line.replace(/^#{1,3}\s/, '') });
      continue;
    }

    if (/^[-•]\s/.test(line)) {
      flushParagraph();
      flushOrdered();
      currentBullet.push(line.replace(/^[-•]\s/, ''));
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      flushBullet();
      currentOrdered.push(line.replace(/^\d+\.\s/, ''));
      continue;
    }

    currentParagraph.push(line);
  }

  flushParagraph();
  flushBullet();
  flushOrdered();
  flushCode();

  return blocks;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3 text-sm leading-6 text-slate-200 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return <p key={`${block.type}-${index}`} className="text-sm font-semibold text-white">{renderInlineSegments(block.value)}</p>;
        }

        if (block.type === 'bullet') {
          return (
            <ul key={`${block.type}-${index}`} className="list-disc space-y-1 pl-5 text-slate-200">
              {block.value.split('\n').map(item => (
                <li key={`${item}-${index}`}>{renderInlineSegments(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered') {
          return (
            <ol key={`${block.type}-${index}`} className="list-decimal space-y-1 pl-5 text-slate-200">
              {block.value.split('\n').map(item => (
                <li key={`${item}-${index}`}>{renderInlineSegments(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={`${block.type}-${index}`} className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-cyan-200">
              <code>{block.value}</code>
            </pre>
          );
        }

        return <p key={`${block.type}-${index}`}>{renderInlineSegments(block.value)}</p>;
      })}
    </div>
  );
}
