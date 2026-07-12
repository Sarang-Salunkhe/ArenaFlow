import { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  Clock3, 
  FileText, 
  ListChecks, 
  MapPinned, 
  ShieldAlert, 
  Sparkles, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface AIResponseCardProps {
  content: string;
  title?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}

const toneStyles = {
  default: 'border-slate-800 bg-slate-900/60 backdrop-blur-xl',
  success: 'border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl',
  warning: 'border-amber-500/30 bg-amber-950/20 backdrop-blur-xl',
  danger: 'border-rose-500/30 bg-rose-950/20 backdrop-blur-xl',
};

function parseResponse(content: string) {
  const normalized = content.trim();
  
  // 1. Detect Priority
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  const priorityMatch = normalized.match(/priority\s*[:\-]\s*(critical|high|medium|low)/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as any;
  } else {
    if (/critical|emergency|red alert/i.test(normalized)) {
      priority = 'critical';
    } else if (/high|danger|warning|attention/i.test(normalized)) {
      priority = 'high';
    } else if (/low|minor|stable/i.test(normalized)) {
      priority = 'low';
    }
  }

  // 2. Extract Situation Summary
  let summary = '';
  const summaryBlockMatch = normalized.match(/(?:situation summary|summary|brief|briefing)\s*[:\-]\s*([\s\S]*?)(?=(?:priority|affected areas|recommended actions|reasoning|helpful tips|generated time|deterministic)\s*[:\-]|$)/i);
  if (summaryBlockMatch) {
    summary = summaryBlockMatch[1].trim();
  } else {
    // If no label, extract sentences before any list item
    const firstListIndex = normalized.search(/\n\s*[-*•\d]/);
    if (firstListIndex !== -1) {
      summary = normalized.substring(0, firstListIndex).trim();
    } else {
      summary = normalized;
    }
  }
  // Sanity check, if summary is too short or is label itself
  if (!summary || summary.length < 5) {
    summary = normalized;
  }

  // 3. Extract Affected Areas
  let affectedAreas: string[] = [];
  const affectedMatch = normalized.match(/(?:affected areas|locations|location|area|zone|sector|sectors)\s*[:\-]\s*([\s\S]*?)(?=(?:recommended actions|actions|reasoning|helpful tips|generated time)\s*[:\-]|$)/i);
  if (affectedMatch) {
    const extracted = affectedMatch[1].trim();
    affectedAreas = extracted.split(/[;,]|\n/).map(item => item.replace(/^[-*•\d.\s]+/, '').trim()).filter(Boolean);
  } else {
    const knownZones = [
      'Metro Plaza', 'Bus Terminal', 'Plaza North', 'Plaza South',
      'Lower Concourse', 'Upper Concourse', 'North Stand', 'South Stand',
      'East Stand', 'West Stand', 'Food Court', 'Medical Station', 'Emergency Corridor'
    ];
    knownZones.forEach(zone => {
      if (new RegExp(zone, 'i').test(normalized)) {
        affectedAreas.push(zone);
      }
    });
    if (affectedAreas.length === 0) {
      affectedAreas = ['General Stadium'];
    }
  }

  // 4. Extract Recommended Actions
  let recommendedActions: string[] = [];
  const actionsMatch = normalized.match(/(?:recommended actions|actions|recommendation|recommendations|steps)\s*[:\-]\s*([\s\S]*?)(?=(?:reasoning|helpful tips|generated time)\s*[:\-]|$)/i);
  if (actionsMatch) {
    const extracted = actionsMatch[1].trim();
    recommendedActions = extracted.split(/\n|\r|•|(?<!\w)-\s/).map(item => item.replace(/^[-*•\d.\s]+/, '').trim()).filter(Boolean);
  } else {
    const lines = normalized.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^[-*•\d.]+\s+/.test(trimmed) && !trimmed.toLowerCase().includes('situation summary') && !trimmed.toLowerCase().includes('priority') && !trimmed.toLowerCase().includes('affected areas')) {
        recommendedActions.push(trimmed.replace(/^[-*•\d.\s]+/, '').trim());
      }
    });
  }
  // Fallback direct actions
  if (recommendedActions.length === 0) {
    if (/gate/i.test(normalized)) {
      recommendedActions = [
        'Deploy mobile queue marshals to affected gate checkpoints.',
        'Update route signs to direct fans to adjacent entry points.',
        'Broadcast digital push notifications to incoming fans.'
      ];
    } else if (/medical/i.test(normalized)) {
      recommendedActions = [
        'Clear the designated emergency vehicle access corridor immediately.',
        'Deploy localized first-aid response team with mobile stretchers.',
        'Maintain direct communications link with municipal dispatch.'
      ];
    } else if (/route|closure/i.test(normalized)) {
      recommendedActions = [
        'Redirect active pedestrian flow away from the blocked corridor.',
        'Update digital wayfinding maps to flag accessible route detours.',
        'Instruct volunteers to stand at key junctions to guide traffic.'
      ];
    } else {
      recommendedActions = [
        'Monitor active zone density levels via live video telemetry.',
        'Coordinate with sector supervisors to sustain optimal transit flow.',
        'Verify sign lighting and pathway accessibility indicators.'
      ];
    }
  }

  // 5. Extract Reasoning
  let reasoning = '';
  const reasoningMatch = normalized.match(/(?:reasoning|rationale|why)\s*[:\-]\s*([\s\S]*?)(?=(?:helpful tips|generated time)\s*[:\-]|$)/i);
  if (reasoningMatch) {
    reasoning = reasoningMatch[1].trim();
  } else {
    const lines = normalized.split('\n');
    const reasoningLines = lines.filter(l => /because|due to|as a result|since|therefore/i.test(l) && !l.includes(':'));
    if (reasoningLines.length > 0) {
      reasoning = reasoningLines.join(' ');
    } else {
      reasoning = 'Ensuring event continuity and fan physical safety in accordance with tournament control playbooks.';
    }
  }

  // 6. Extract Helpful Tips
  let tips = '';
  const tipsMatch = normalized.match(/(?:helpful tips|tips|tip|guideline|guidelines)\s*[:\-]\s*([\s\S]*?)(?=(?:generated time)\s*[:\-]|$)/i);
  if (tipsMatch) {
    tips = tipsMatch[1].trim();
  } else {
    if (/fan/i.test(normalized)) {
      tips = 'Look for volunteers in bright orange vests, walk calmly, and hold tickets ready on your phone.';
    } else if (/volunteer/i.test(normalized)) {
      tips = 'Stay in designated sector, keep radio channels quiet except for alerts, and guide with clear hand gestures.';
    } else {
      tips = 'Log all state changes, verify gate counting feeds, and sync with supervisor consoles.';
    }
  }

  // 7. Extract Generated Time
  let generatedTime = '';
  const timeMatch = normalized.match(/(?:generated time|timestamp)\s*[:\-]\s*([\s\S]*?)$/i);
  if (timeMatch) {
    generatedTime = timeMatch[1].trim();
  } else {
    generatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return {
    priority,
    summary,
    affectedAreas: Array.from(new Set(affectedAreas)),
    recommendedActions: Array.from(new Set(recommendedActions)).slice(0, 5),
    reasoning,
    tips,
    generatedTime
  };
}

export function AIResponseCard({ content, title = 'ArenaFlow AI', tone = 'default' }: AIResponseCardProps) {
  const {
    priority,
    summary,
    affectedAreas,
    recommendedActions,
    reasoning,
    tips,
    generatedTime
  } = parseResponse(content);

  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  const priorityColors = {
    critical: { text: 'text-red-400', badge: 'danger', icon: AlertCircle },
    high: { text: 'text-orange-400', badge: 'warning', icon: ShieldAlert },
    medium: { text: 'text-blue-400', badge: 'neutral', icon: Sparkles },
    low: { text: 'text-emerald-400', badge: 'success', icon: CheckCircle2 }
  };

  const currentPriority = priorityColors[priority] || priorityColors.medium;
  const PriorityIcon = currentPriority.icon;

  return (
    <article className={`flex flex-col gap-4 rounded-3xl border p-5 shadow-xl shadow-slate-950/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-950/10 ${toneStyles[tone]}`} id="ai-response-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
            <Bot className="h-5 w-5 animate-pulse" aria-hidden="true" />
            <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-white">{title}</h4>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">GenAI Command Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityIcon className={`h-4 w-4 ${currentPriority.text}`} />
          <StatusBadge label={priority.toUpperCase()} tone={currentPriority.badge as any} />
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex flex-col gap-3.5">
        
        {/* Situation Summary Card */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 transition duration-200 hover:border-white/10" id="ai-summary-card">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-400">
            <Sparkles className="h-4 w-4" />
            Situation Summary
          </div>
          <div className="text-sm leading-relaxed text-slate-200">
            <MarkdownRenderer content={summary} />
          </div>
        </div>

        {/* Priority & Affected Areas Bento Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Priority Details */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 transition duration-200 hover:border-white/10">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              Priority Level
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold capitalize ${currentPriority.text}`}>{priority}</span>
              <span className="text-[10px] text-slate-500">· Response time &lt; 2m</span>
            </div>
          </div>

          {/* Affected Areas */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 transition duration-200 hover:border-white/10">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
              <MapPinned className="h-3.5 w-3.5" />
              Affected Sectors
            </div>
            <div className="flex flex-wrap gap-1.5">
              {affectedAreas.map((area) => (
                <span key={area} className="inline-flex items-center rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/5">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 transition duration-200 hover:border-white/10">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-400">
            <ListChecks className="h-4 w-4" />
            Recommended Directives
          </div>
          <ul className="flex flex-col gap-2">
            {recommendedActions.map((action, idx) => (
              <li key={idx} className="flex gap-2.5 rounded-xl border border-blue-500/5 bg-slate-900/40 p-3 text-xs leading-normal text-slate-200 hover:border-blue-500/10">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning (Collapsible) */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 transition duration-200 hover:border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setReasoningExpanded(!reasoningExpanded)}
            className="flex w-full items-center justify-between p-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-violet-400"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tactical Reasoning
            </span>
            {reasoningExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {reasoningExpanded && (
            <div className="border-t border-white/5 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-300">
              <MarkdownRenderer content={reasoning} />
            </div>
          )}
        </div>

        {/* Helpful Tips (Collapsible) */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 transition duration-200 hover:border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setTipsExpanded(!tipsExpanded)}
            className="flex w-full items-center justify-between p-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-emerald-400"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Helpful Operational Tips
            </span>
            {tipsExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {tipsExpanded && (
            <div className="border-t border-white/5 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-300 animate-in fade-in slide-in-from-top-1 duration-150">
              <MarkdownRenderer content={tips} />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Clock3 className="h-3.5 w-3.5 text-blue-400" />
            Generated Time
          </span>
          <span className="font-mono">{generatedTime}</span>
        </div>

      </div>
    </article>
  );
}
