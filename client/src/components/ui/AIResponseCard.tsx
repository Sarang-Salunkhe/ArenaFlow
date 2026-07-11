import { Bot, CheckCircle2, Clock3, FileText, ListChecks, MapPinned, ShieldAlert, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface AIResponseCardProps {
  content: string;
  title?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneStyles = {
  default: 'border-slate-700/70 bg-slate-900/80',
  success: 'border-emerald-500/40 bg-emerald-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  danger: 'border-rose-500/40 bg-rose-500/10',
};

function extractSection(content: string, label: string) {
  const pattern = new RegExp(`${label}\\s*[:\-]\\s*([\\s\\S]*?)(?=(?:${label}|Situation Summary|Priority|Affected Areas|Recommended Actions|Reasoning|Helpful Tips|Generated Time)\\s*[:\-]|$)`, 'i');
  const match = content.match(pattern);
  return match?.[1]?.trim() || '';
}

function extractPriority(content: string) {
  const match = content.match(/priority\s*[:\-]\s*(critical|high|medium|low)/i);
  return match?.[1]?.toLowerCase() ?? 'medium';
}

function extractAffectedAreas(content: string) {
  const match = content.match(/affected areas\s*[:\-]\s*([\s\S]*?)(?=(?:recommended actions|reasoning|helpful tips|generated time)\s*[:\-]|$)/i);
  const extracted = match?.[1]?.trim() ?? '';
  return extracted ? extracted.split(/[;,]/).map(item => item.trim()).filter(Boolean) : [];
}

function extractActions(content: string) {
  const match = content.match(/recommended actions\s*[:\-]\s*([\s\S]*?)(?=(?:reasoning|helpful tips|generated time)\s*[:\-]|$)/i);
  const extracted = match?.[1]?.trim() ?? '';
  return extracted ? extracted.split(/\n|\r|•|(?<!\w)-\s/).map(item => item.replace(/^\d+\.\s*/, '').trim()).filter(Boolean) : [];
}

function extractReasoning(content: string) {
  const match = content.match(/reasoning\s*[:\-]\s*([\s\S]*?)(?=(?:helpful tips|generated time)\s*[:\-]|$)/i);
  return match?.[1]?.trim() ?? '';
}

function extractTips(content: string) {
  const match = content.match(/helpful tips\s*[:\-]\s*([\s\S]*?)(?=(?:generated time)\s*[:\-]|$)/i);
  return match?.[1]?.trim() ?? '';
}

function extractGeneratedTime(content: string) {
  const match = content.match(/generated time\s*[:\-]\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function hasStructuredSections(content: string) {
  return /(situation summary|priority|affected areas|recommended actions|reasoning|helpful tips|generated time)\s*[:\-]/i.test(content);
}

export function AIResponseCard({ content, title = 'ArenaFlow AI', tone = 'default' }: AIResponseCardProps) {
  const normalized = content.trim();
  const priority = extractPriority(normalized);
  const affectedAreas = extractAffectedAreas(normalized);
  const recommendedActions = extractActions(normalized);
  const reasoning = extractReasoning(normalized);
  const tips = extractTips(normalized);
  const summary = extractSection(normalized, 'Situation Summary') || extractSection(normalized, 'Summary') || normalized;
  const generatedTime = extractGeneratedTime(normalized);
  const structured = hasStructuredSections(normalized);

  const priorityTone = priority === 'critical' ? 'danger' : priority === 'high' ? 'warning' : 'success';

  return (
    <article className={`rounded-[28px] border p-4 shadow-lg shadow-slate-950/30 backdrop-blur ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-500/15 p-2 text-blue-300">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px] text-slate-300">Structured response generated for rapid triage</p>
          </div>
        </div>
        <StatusBadge label={priority.toUpperCase()} tone={priorityTone} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            Situation Summary
          </div>
          <MarkdownRenderer content={summary} />
        </div>

        {structured ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Priority
            </div>
            <StatusBadge label={priority.toUpperCase()} tone={priorityTone} />
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <MapPinned className="h-3.5 w-3.5" />
              Affected Areas
            </div>
            <div className="flex flex-wrap gap-2">
              {affectedAreas.length > 0 ? affectedAreas.map(area => <StatusBadge key={area} label={area} tone="neutral" />) : <StatusBadge label="General Stadium" tone="neutral" />}
            </div>
          </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <ListChecks className="h-3.5 w-3.5" />
              Recommended Actions
            </div>
            {recommendedActions.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-100">
                {recommendedActions.map(action => (
                  <li key={action} className="flex gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <MarkdownRenderer content={summary} />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              <FileText className="h-3.5 w-3.5" />
              Reasoning
            </div>
            <MarkdownRenderer content={reasoning || 'No additional reasoning was returned.'} />
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Helpful Tips
            </div>
            <MarkdownRenderer content={tips || 'Keep your response channel visible and maintain calm comms flow.'} />
          </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              Generated Time
            </span>
            <span>{generatedTime}</span>
          </div>
        </>
        ) : null}
      </div>
    </article>
  );
}
