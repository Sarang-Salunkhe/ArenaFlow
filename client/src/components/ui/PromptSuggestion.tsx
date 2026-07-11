import type { ReactNode } from 'react';

interface PromptSuggestionProps {
  icon?: ReactNode;
  text: string;
  onClick: () => void;
}

export function PromptSuggestion({ icon, text, onClick }: PromptSuggestionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {text}
      </span>
    </button>
  );
}
