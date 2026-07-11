import { Router } from 'express';
import { z } from 'zod';
import { askCopilot } from '../engines/orchestrator.js';
import { getCurrentState } from '../engines/simulator.js';
import { evaluateDecisions } from '../engines/decisionEngine.js';

export const aiRouter = Router();

// Zod schemas for AI queries
const assistSchema = z.object({
  role: z.enum(['OPERATIONS', 'FAN', 'VOLUNTEER']),
  userPrompt: z.string().max(1000, 'Prompt cannot exceed 1000 characters').optional(),
  routeContext: z.any().optional(), // RouteResult shape validated downstream
  selectedZoneId: z.string().max(50).optional(),
});

// POST /api/ai/assist
aiRouter.post('/assist', async (req, res) => {
  const result = assistSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid assist parameters.', details: result.error.flatten() });
    return;
  }

  try {
    const state = getCurrentState();
    const response = await askCopilot(
      result.data.role,
      result.data.userPrompt,
      state,
      result.data.routeContext,
      result.data.selectedZoneId
    );
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI service failure' });
  }
});

const briefSchema = z.object({
  role: z.enum(['OPERATIONS', 'VOLUNTEER']),
  selectedZoneId: z.string().max(50).optional(),
});

// POST /api/ai/brief
aiRouter.post('/brief', async (req, res) => {
  const result = briefSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid brief parameters.', details: result.error.flatten() });
    return;
  }

  try {
    const state = getCurrentState();
    const promptText = result.data.role === 'OPERATIONS'
      ? 'Generate a comprehensive situation briefing and current high-priority items based on active conditions.'
      : `Provide a sector tasks briefing and volunteer instructions for zone ${result.data.selectedZoneId || 'general area'}.`;

    const response = await askCopilot(
      result.data.role,
      promptText,
      state,
      undefined,
      result.data.selectedZoneId
    );
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI service failure' });
  }
});

const broadcastSchema = z.object({
  decisionId: z.string().max(100).optional(),
  customTopic: z.string().max(500).optional(),
});

// POST /api/ai/broadcast
aiRouter.post('/broadcast', async (req, res) => {
  const result = broadcastSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid broadcast parameters.', details: result.error.flatten() });
    return;
  }

  try {
    const state = getCurrentState();
    let topic = 'general stadium crowd pacing guidance';
    
    if (result.data.decisionId) {
      const decisions = evaluateDecisions(state);
      const decision = decisions.find(d => d.id === result.data.decisionId);
      if (decision) {
        topic = `decision "${decision.title}". Facts: ${decision.rationaleFacts.join(' ')}. Actions: ${decision.recommendedActions.join(' ')}`;
      }
    } else if (result.data.customTopic) {
      topic = result.data.customTopic;
    }

    const response = await askCopilot(
      'OPERATIONS',
      `Generate a public address (PA) announcement or fan alert text to address: ${topic}. Format the response as a clear, loud public announcement suitable for broadcast.`,
      state
    );
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI service failure' });
  }
});
