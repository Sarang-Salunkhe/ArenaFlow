import type { ReactNode } from 'react';

interface ChatBubbleProps {
  role: 'user' | 'copilot';
  children: ReactNode;
  fallback?: boolean;
}

const styleMap = {
  user: 'bg-blue-500/20 text-white',
  copilot: 'border border-slate-800 bg-slate-900/80 text-slate-100',
};

export function ChatBubble({ role, children, fallback }: ChatBubbleProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-3 py-2 leading-6 ${styleMap[role]}`}>
        {children}
        {fallback && role === 'copilot' ? (
          <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-amber-300">Fallback response</p>
        ) : null}
      </div>
    </div>
  );
}
