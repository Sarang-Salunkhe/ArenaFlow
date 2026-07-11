import { StadiumState, RouteResult, CopilotResponse } from '../types.js';
import { callOpenAI, generateFallbackResponse } from '../services/openaiService.js';
import { env } from '../config/env.js';
import { evaluateDecisions } from './decisionEngine.js';

export function buildContext(
  state: StadiumState,
  role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER',
  routeContext?: RouteResult,
  selectedZoneId?: string
): string {
  let context = `--- SYSTEM CONTEXT ---\n`;
  context += `Match Phase: ${state.matchPhase}\n`;
  context += `Tick Count: ${state.tickCount}\n`;

  // Active Incidents
  const activeIncidents = state.incidents.filter(i => i.active);
  context += `Active Incidents: ${
    activeIncidents.length > 0
      ? activeIncidents.map(i => `[Zone: ${i.zoneId}, Title: ${i.title}, Severity: ${i.severity}, Desc: ${i.description}]`).join('; ')
      : 'None'
  }\n`;

  // Transport details
  context += `Transport: Metro queue is ${Math.round(state.transport.metroQueueSeconds / 60)} minutes (${state.transport.metroStatus}). Bus queue is ${Math.round(state.transport.busQueueSeconds / 60)} minutes (${state.transport.busStatus}).\n\n`;

  // Role-specific additions
  if (role === 'OPERATIONS') {
    context += `STADIUM STATE DETAILED FACTS:\n`;
    state.zones.forEach(zone => {
      context += `- Zone: ${zone.name} (ID: ${zone.id}). Occupancy: ${zone.occupancy}/${zone.capacity} (${Math.round((zone.occupancy/zone.capacity)*100)}%). Crowd level: ${zone.crowdLevel}. Trend: ${zone.trend}. Risk score: ${zone.riskScore}. Attention level: ${zone.attentionLevel}.\n`;
    });
    
    context += `\nGates status:\n`;
    state.gates.forEach(gate => {
      context += `- Gate: ${gate.name} (ID: ${gate.id}). Queue: ${Math.round(gate.avgQueueSeconds / 60)} mins. Status: ${gate.status}. Inflow Trend: ${gate.trend}.\n`;
    });

    const decisions = evaluateDecisions(state);
    context += `\nDECISION ENGINE RECOMMENDATIONS:\n`;
    decisions.forEach(dec => {
      context += `- Alert [${dec.priority}]: ${dec.title}. Source: ${dec.source}. Rationale: ${dec.rationaleFacts.join('; ')}. Recommended actions: ${dec.recommendedActions.join('; ')}.\n`;
    });
  } else if (role === 'FAN') {
    if (routeContext) {
      context += `ROUTE FACTS:\n`;
      context += `- Path: ${routeContext.nodeNames.join(' -> ')}\n`;
      context += `- Distance: ${routeContext.totalDistance}m\n`;
      context += `- Walking Time: ${routeContext.estimatedWalkingTimeMinutes} minutes\n`;
      context += `- Accessibility: ${routeContext.accessibilityStatus}\n`;
      context += `- Congestion: ${routeContext.congestionSummary}\n`;
      context += `- Safety Facts: hasHighCongestion=${routeContext.routeFacts.hasHighCongestion}, hasIncidentNearby=${routeContext.routeFacts.hasIncidentNearby}\n`;
    } else {
      context += `No calculated route details yet. Provide general stadium wayfinding guidance.\n`;
    }
  } else if (role === 'VOLUNTEER') {
    if (selectedZoneId) {
      const zone = state.zones.find(z => z.id === selectedZoneId);
      if (zone) {
        context += `ZONE BRIEF FOR ASSIGNED AREA:\n`;
        context += `- Area: ${zone.name} (ID: ${zone.id})\n`;
        context += `- Attention Level: ${zone.attentionLevel}\n`;
        context += `- Crowd Level: ${zone.crowdLevel}\n`;
        context += `- Risk Score: ${zone.riskScore}\n`;
        
        const zoneIncidents = activeIncidents.filter(inc => inc.zoneId === selectedZoneId);
        context += `- Zone Incidents: ${zoneIncidents.map(i => `${i.title} (${i.severity})`).join(', ') || 'None'}\n`;
      }
    }
    
    // Include relevant operational decisions
    const decisions = evaluateDecisions(state);
    const relevantDecs = decisions.filter(dec => 
      !selectedZoneId || dec.affectedLocations.includes(selectedZoneId)
    );
    context += `\nRELEVANT OPERATIONAL DECISIONS:\n`;
    relevantDecs.forEach(dec => {
      context += `- Task: ${dec.communicationRequired.volunteerInstruction} (Priority: ${dec.priority})\n`;
    });
  }

  return context;
}

export async function askCopilot(
  role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER',
  userPrompt: string | undefined,
  state: StadiumState,
  routeContext?: RouteResult,
  selectedZoneId?: string
): Promise<CopilotResponse> {
  const context = buildContext(state, role, routeContext, selectedZoneId);
  const apiKey = env.OPENAI_API_KEY;
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

  if (!apiKey || apiKey === 'your_openai_api_key_here' || isTest) {
    return generateFallbackResponse(role, context, userPrompt);
  }

  let systemPrompt = '';
  if (role === 'OPERATIONS') {
    systemPrompt = `You are the ArenaFlow Operations Copilot, an AI assistant for stadium commanders in a fictional modern football stadium. You analyze deterministic engine facts (such as zone occupancies, crowd densities, wait times, active safety incidents, and recommended decisions) and provide clear, professional briefings, risk summaries, action plan wordings, or natural-language answers to operations staff queries. Be brief, authoritative, and direct. Base your answers solely on the provided facts.`;
  } else if (role === 'FAN') {
    systemPrompt = `You are the ArenaFlow Wayfinding Assistant. You help fans navigate a fictional football stadium. You receive path distance, estimated walking times, safety incidents, and congestion levels. Explain the routing route clearly and politely, provide safety tips, and assist with general navigation questions (like food courts or lifts). Do not invent locations that are not in the context. If an incident is nearby, warn the fan.`;
  } else if (role === 'VOLUNTEER') {
    systemPrompt = `You are the ArenaFlow Volunteer Coordinator. You support volunteers working in different stadium sectors. Provide task briefs, status updates, and guidelines for crowd support or incident reporting based on the current match phase and active incidents. Encourage volunteers and give clear directions.`;
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `CONTEXT STATE:\n${context}\n\nUSER QUESTION/PROMPT:\n${userPrompt || 'Provide a current brief and action instructions.'}` }
  ];

  try {
    const aiText = await callOpenAI(messages);
    
    // Compile some context-aware quick suggestions
    const suggestions: string[] = [];
    if (role === 'OPERATIONS') {
      suggestions.push('Incidents summary', 'Ingress bottlenecks', 'Metro queue levels');
    } else if (role === 'FAN') {
      suggestions.push('Is there a lift?', 'Closest food point', 'Avoid congestion');
    } else if (role === 'VOLUNTEER') {
      suggestions.push('Tasks list', 'Active alerts', 'Incident reporting');
    }

    return {
      text: aiText,
      aiPowered: true,
      fallbackUsed: false,
      suggestions,
    };
  } catch (error) {
    console.error('OpenAI call failed, reverting to deterministic fallback:', error);
    return generateFallbackResponse(role, context, userPrompt);
  }
}
