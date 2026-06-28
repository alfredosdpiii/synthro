#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: 'synthro-smoke', version: '0.0.0' });
const transport = new StdioClientTransport({
  command: 'node',
  args: ['src/mcp/server.mjs'],
  cwd: process.cwd(),
  stderr: 'pipe'
});

await client.connect(transport);
const tools = await client.listTools();
const names = tools.tools.map(tool => tool.name);
const required = [
  'synthro_list_lessons',
  'synthro_get_lesson_state',
  'synthro_record_answer',
  'synthro_synthesize_feedback',
  'synthro_next_review_items'
];
const missing = required.filter(name => !names.includes(name));
await client.close();

if (missing.length) {
  console.error(`MCP smoke check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`MCP smoke check passed with tools: ${names.join(', ')}`);
