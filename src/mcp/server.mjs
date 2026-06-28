#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getLessonState, listLessons, nextReviewItems, recordAnswer, synthesizeFeedback } from '../store/progress-store.mjs';

const server = new McpServer(
  { name: 'synthro', version: '0.1.0' },
  {
    instructions:
      'Synthro exposes local learning state from interactive GitHub contribution lessons. Use list_lessons, get_lesson_state, next_review_items, and synthesize_feedback before generating follow-up tutoring.'
  }
);

server.registerTool(
  'synthro_list_lessons',
  {
    title: 'List Synthro lessons',
    description: 'List locally generated Synthro lessons.',
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true }
  },
  async () => jsonResult({ lessons: await listLessons() })
);

server.registerTool(
  'synthro_get_lesson_state',
  {
    title: 'Get lesson state',
    description: 'Read a Synthro lesson and recorded learner answers.',
    inputSchema: z.object({ lessonId: z.string() }),
    annotations: { readOnlyHint: true }
  },
  async ({ lessonId }) => {
    const state = await getLessonState(lessonId);
    if (!state) return errorResult(`Unknown lesson: ${lessonId}`);
    return jsonResult(state);
  }
);

server.registerTool(
  'synthro_record_answer',
  {
    title: 'Record answer',
    description: 'Record a learner answer and judge result from any compatible client.',
    inputSchema: z.object({
      lessonId: z.string(),
      exerciseId: z.string(),
      answer: z.unknown(),
      result: z
        .object({
          score: z.number().min(0).max(1),
          status: z.string(),
          feedback: z.string().optional()
        })
        .passthrough()
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  },
  async input => jsonResult({ recorded: await recordAnswer(input) })
);

server.registerTool(
  'synthro_synthesize_feedback',
  {
    title: 'Synthesize feedback',
    description: 'Summarize learner strengths, weak spots, and next teaching action for one lesson.',
    inputSchema: z.object({ lessonId: z.string() }),
    annotations: { readOnlyHint: true }
  },
  async ({ lessonId }) => {
    const feedback = await synthesizeFeedback(lessonId);
    if (!feedback) return errorResult(`Unknown lesson: ${lessonId}`);
    return jsonResult(feedback);
  }
);

server.registerTool(
  'synthro_next_review_items',
  {
    title: 'Next review items',
    description: 'Return weak or due review items for spaced follow-up practice.',
    inputSchema: z.object({ lessonId: z.string() }),
    annotations: { readOnlyHint: true }
  },
  async ({ lessonId }) => jsonResult({ lessonId, items: await nextReviewItems(lessonId) })
);

const transport = new StdioServerTransport();
await server.connect(transport);

function jsonResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value
  };
}

function errorResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}
