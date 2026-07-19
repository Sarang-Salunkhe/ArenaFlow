import { useAssistant } from '../context/AssistantContext';
import { AlertCircle, Megaphone, ShieldAlert, Radio } from 'lucide-react';

export function AnnouncementsBar() {
  const { stadiumState } = useAssistant();
  const activeIncidents = stadiumState?.incidents.filter(i => i.active) || [];
  
  // Generate beautiful real-time operational messages
  const announcements: { text: string; type: 'info' | 'warning' | 'alert' }[] = [];

  // 1. Add active incidents
  activeIncidents.forEach(inc => {
    const severity = inc.severity;
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      announcements.push({
        text: `CRITICAL ALERT: ${inc.title} - ${inc.description}`,
        type: 'alert'
      });
    } else {
      announcements.push({
        text: `OPERATIONS UPDATE: ${inc.title} - ${inc.description}`,
        type: 'warning'
      });
    }
  });

  // 2. Add phase specific announcements
  const phase = stadiumState?.matchPhase || 'PRE_MATCH';
  switch (phase) {
    case 'PRE_MATCH':
      announcements.push(
        { text: "Stadium plazas and security checks are fully open. Kickoff in 15 minutes.", type: 'info' },
        { text: "Transport Metro Station Plaza is stable. Shuttles running on schedule.", type: 'info' }
      );
      break;
    case 'ENTRY_SURGE':
      announcements.push(
        { text: "Peak arrival surge in progress. Fast-track entry available at Gate C (East) and Gate D (West).", type: 'warning' },
        { text: "Ensure digital tickets are ready before approaching reader gates.", type: 'info' }
      );
      break;
    case 'MATCH_ACTIVE':
      announcements.push(
        { text: "Match is active. Cascadia FC vs Metro United. Seating bowls are at maximum capacity.", type: 'info' },
        { text: "All emergency corridors and access lanes must remain completely clear at all times.", type: 'warning' }
      );
      break;
    case 'HALF_TIME':
      announcements.push(
        { text: "Half Time in progress. Food Concession courts A & B are busy. Please pace your orders.", type: 'warning' },
        { text: "Medical posts and volunteer kiosks are fully active on all levels.", type: 'info' }
      );
      break;
    case 'MATCH_END':
      announcements.push(
        { text: "Second half closing stages. Transport authorities notified for post-game egress launch.", type: 'info' },
        { text: "Avoid crowd congestion by planning exit routing with your ArenaFlow companion.", type: 'info' }
      );
      break;
    case 'EXIT_SURGE':
      announcements.push(
        { text: "Egress surge active. Metro Station experiencing high platform queues. Consider shuttle services.", type: 'warning' },
        { text: "Follow all volunteer guides and physical signage toward South and North Plazas.", type: 'info' }
      );
      break;
  }

  // 3. Fallback standard announcement
  if (announcements.length === 0) {
    announcements.push(
      { text: "Welcome to ArenaFlow. Stadium Operations System fully active and online.", type: 'info' },
      { text: "All departments status normal. Secure channels open.", type: 'info' }
    );
  }

  // Double the announcements to make the marquee loop infinitely without visual gap
  const doubledAnnouncements = [...announcements, ...announcements];

  return (
    <div id="announcements-bar" className="relative flex h-8 w-full overflow-hidden border-b border-white/5 bg-slate-950/90 text-xs font-semibold select-none z-50">
      {/* Fixed Static Label on the left to give the command-center context */}
      <div className="absolute left-0 top-0 bottom-0 px-3 bg-red-600 text-white flex items-center gap-1.5 z-10 shadow-lg shadow-black/40">
        <Radio className="h-3 w-3 animate-pulse" />
        <span className="text-[10px] tracking-wider uppercase font-extrabold">LIVE COMM</span>
      </div>

      <div className="flex items-center pl-24 w-full h-full">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-1">
          {doubledAnnouncements.map((ann, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {ann.type === 'alert' && (
                <span className="flex items-center gap-1.5 text-rose-400 font-extrabold uppercase animate-pulse">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  {ann.text}
                </span>
              )}
              {ann.type === 'warning' && (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {ann.text}
                </span>
              )}
              {ann.type === 'info' && (
                <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                  <Megaphone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  {ann.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
