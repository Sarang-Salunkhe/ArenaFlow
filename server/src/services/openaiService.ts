import { env } from '../config/env.js';
import { CopilotResponse } from '../types.js';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callOpenAI(messages: Message[]): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || 'gpt-5-mini';

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API Key is missing or default placeholder');
  }

  const response = await fetch(
    'https://api.openai.com/v1/responses',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: messages.map((m) => ({
          role: m.role,
          content: [
            {
              type: "input_text",
              text: m.content,
            },
          ],
        })),
        max_output_tokens: 800,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error('OpenAI API Error', {
      status: response.status,
      body: errorText,
    });

    throw new Error(
      `OpenAI API error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as any;

  // Responses API returns output_text when available.
  // Fallbacks handle other valid response shapes.
  const content =
  typeof data.output_text === 'string'
    ? data.output_text
    : data.output
        ?.flatMap((item: any) => item.content ?? [])
        ?.find((part: any) => part.type === 'output_text')
        ?.text ??
      '';

  if (!content) {
    console.error('Unexpected OpenAI response:', data);
    throw new Error('Invalid response format from OpenAI Responses API');
  }

  return content.trim();
}

// Generate a deterministic fallback when OpenAI is not available
export function generateFallbackResponse(role: 'OPERATIONS' | 'FAN' | 'VOLUNTEER', context: string, userPrompt?: string): CopilotResponse {
  let text = '';
  const suggestions: string[] = [];

  // Parse key facts from the context block using regex/string searches
  const phaseMatch = context.match(/Match Phase:\s*(\w+)/i);
  const phase = phaseMatch ? phaseMatch[1] : 'PRE_MATCH';

  const incidentsMatch = context.match(/Active Incidents:\s*(.*)/i);
  const incidentsText = incidentsMatch ? incidentsMatch[1] : '';
  const hasIncidents = incidentsText && !incidentsText.includes('None');

  const routeMatch = context.match(/ROUTE FACTS:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
  const routeText = routeMatch ? routeMatch[1] : '';

  if (role === 'OPERATIONS') {
    suggestions.push('Show active incidents', 'List recommended actions', 'Metro status brief');

    if (userPrompt && userPrompt.toLowerCase().includes('incident')) {
      text = hasIncidents 
        ? `Deterministic System Brief: There are active safety incidents. Details: ${incidentsText}. Recommended action: clear emergency lanes and deploy volunteers for detours.`
        : `Deterministic System Brief: Currently, there are no active incidents reported in the stadium.`;
    } else if (userPrompt && (userPrompt.toLowerCase().includes('metro') || userPrompt.toLowerCase().includes('transport') || userPrompt.toLowerCase().includes('bus'))) {
      text = `Deterministic System Brief: Transport connections update. Under the current match phase (${phase}), transport queues are active. Refer to the dashboard for live waiting times at the Metro Entrance and Bus Terminal. Pacing restrictions apply during egress.`;
    } else if (userPrompt && (userPrompt.toLowerCase().includes('action') || userPrompt.toLowerCase().includes('decision'))) {
      text = `Deterministic System Brief: Active recommendations include redirecting ingress flows to open gates if queue times exceed 10 minutes. If a medical emergency is active, keep emergency lanes clear and deploy support teams.`;
    } else {
      // General operations brief
      text = `Deterministic System Brief:\n`;
      text += `- Current Stadium Phase: ${phase}\n`;
      text += `- Active Incidents: ${hasIncidents ? incidentsText : 'None reported.'}\n`;
      text += `- System Recommendation: Ensure all entry gates are monitored. If a gate's queue exceeds 10 minutes, redirect incoming fans to alternate open gates. Volunteers should remain at their assigned concourse points.`;
    }
  } else if (role === 'FAN') {
    suggestions.push('How long is the wait?', 'Is there an accessible route?', 'Where is the food court?');

    if (routeText) {
      const distMatch = routeText.match(/Distance:\s*(\d+)m/i);
      const timeMatch = routeText.match(/Walking Time:\s*(\d+)\s*minutes/i);
      const accMatch = routeText.match(/Accessibility:\s*(.*)/i);
      const congMatch = routeText.match(/Congestion:\s*(.*)/i);
      const pathMatch = routeText.match(/Path:\s*(.*)/i);

      text = `Deterministic Wayfinding Assistance:\n`;
      text += `Your calculated path goes from ${pathMatch ? pathMatch[1] : 'start'} to your destination.\n`;
      text += `- Distance: ${distMatch ? distMatch[1] : '0'} meters.\n`;
      text += `- Estimated time: ${timeMatch ? timeMatch[1] : '0'} minutes.\n`;
      text += `- Route congestion: ${congMatch ? congMatch[1] : 'Low'}.\n`;
      text += `- Accessibility: ${accMatch ? accMatch[1] : 'Standard'}.\n\n`;
      text += `Path Details: ${pathMatch ? pathMatch[1] : 'N/A'}.\n`;
      text += `Please follow color-coded signage and cooperate with volunteers along the way.`;
    } else {
      text = `Deterministic Wayfinding Assistance: Welcome! To get step-by-step directions, estimated walking times, and congestion updates, please select a start location and destination above and click "Calculate Route".`;
    }
  } else if (role === 'VOLUNTEER') {
    suggestions.push('Check active alerts', 'View my tasks', 'How to report an incident?');

    text = `Deterministic Volunteer Briefing:\n`;
    text += `- Match Phase: ${phase}\n`;
    text += `- Active Incidents in Stadium: ${hasIncidents ? incidentsText : 'None active.'}\n\n`;
    text += `Priority Tasks by Phase:\n`;
    
    if (phase === 'ENTRY_SURGE') {
      text += `1. Ingress support: direct fans arriving from plazas to gates with low queues.\n2. Ticket scanning guidance: assist fans experiencing device read failures.`;
    } else if (phase === 'HALF_TIME') {
      text += `1. Concourse crowd management: keep corridors flowing near food courts.\n2. Service guidance: direct fans to accessible restrooms and exits.`;
    } else if (phase === 'EXIT_SURGE') {
      text += `1. Egress guidance: direct fans toward Bus Terminal and Metro connections.\n2. Line pacing: assist transport staff with passenger queuing.`;
    } else {
      text += `1. General assistance: remain visible in your assigned stand/concourse.\n2. Support safety teams: report any safety hazard or medical issue via the form.`;
    }
  }

  return {
    text,
    aiPowered: false,
    fallbackUsed: true,
    suggestions,
  };
}
