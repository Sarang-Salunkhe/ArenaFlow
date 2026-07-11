import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageSquareText, Send, Sparkles, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { CopilotResponse, StadiumState } from '../../types';
import { AIResponseCard } from '@/components/ui/AIResponseCard';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface FloatingAssistantProps {
  role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER';
  selectedZoneId: string;
  stadiumState: StadiumState | null;
}

const suggestedPrompts = {
  OPERATIONS: [
    'Summarize live pressure by zone',
    'What should operations respond to first?',
    'Generate a staffing recommendation',
  ],
  FAN: [
    'Explain the safest route available',
    'Where can I find the nearest service?',
    'What should I expect around my destination?',
  ],
  VOLUNTEER: [
    'What should I prioritize near my zone?',
    'How should I respond to a crowd alert?',
    'List the current assignments',
  ],
};

export function FloatingAssistant({ role, selectedZoneId, stadiumState }: FloatingAssistantProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ sender: 'user' | 'copilot'; text: string; aiPowered: boolean }>>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const prompts = useMemo(() => suggestedPrompts[role], [role]);

  const sendPrompt = async (promptOverride?: string) => {
    const trimmed = (promptOverride ?? message).trim();
    if (!trimmed) {
      return;
    }

    const userMessage = { sender: 'user' as const, text: trimmed, aiPowered: true };
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userPrompt: trimmed, selectedZoneId }),
      });
      const data: CopilotResponse = await response.json();

      setHistory(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: data.text,
          aiPowered: data.aiPowered,
        },
      ]);
    } catch {
      setHistory(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: 'The ArenaFlow AI copilot is temporarily unavailable. The deterministic guidance remains visible on screen.',
          aiPowered: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div ref={panelRef} className="w-[min(92vw,380px)] rounded-[28px] border border-slate-700/80 bg-slate-950/95 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-500/15 p-2 text-blue-300">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ArenaFlow AI Copilot</p>
                <p className="text-[11px] text-slate-400">
                  {role} command assistant{stadiumState ? ` · ${stadiumState.matchPhase.replace(/_/g, ' ')}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setHistory([])} aria-label="Clear chat" className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Collapse AI Copilot" className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-800 px-4 py-3">
            <div className="grid gap-2 text-xs">
              {prompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
                >
                  <Sparkles className="mr-2 inline h-3.5 w-3.5 text-blue-300" aria-hidden="true" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
                Ask for an operations summary, route guidance, or a volunteer checklist.
              </div>
            ) : (
              history.map((item, index) => (
                <div key={`${item.sender}-${index}`} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] rounded-2xl px-3 py-2 leading-6 ${item.sender === 'user' ? 'bg-blue-500/20 text-white' : 'border border-slate-800 bg-slate-900 text-slate-100'}`}>
                    {item.sender === 'copilot' ? (
                      /(?:situation summary|priority|recommended actions|reasoning|helpful tips)\s*[:\-]/i.test(item.text) ? (
                        <AIResponseCard content={item.text} />
                      ) : (
                        <MarkdownRenderer content={item.text} />
                      )
                    ) : (
                      item.text
                    )}
                    {!item.aiPowered && item.sender === 'copilot' ? (
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-300">Fallback response</p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {loading ? <div className="text-xs text-slate-400">Copilot is thinking…</div> : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={event => {
              event.preventDefault();
              void sendPrompt();
            }}
            className="flex items-center gap-2 border-t border-slate-800 px-4 py-3"
          >
            <input
              aria-label="Ask the AI copilot"
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Ask ArenaFlow AI Copilot..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
            />
            <button type="submit" className="rounded-xl bg-blue-500 px-3 py-2 text-white transition hover:bg-blue-400" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Open AI Copilot"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-white shadow-2xl shadow-blue-950/60 transition hover:scale-105 hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {open ? <ChevronUp className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
      </button>
    </div>
  );
}
