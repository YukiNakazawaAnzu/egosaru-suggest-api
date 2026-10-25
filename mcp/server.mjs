#!/usr/bin/env node
// Experimental MCP server for the Egosaru Suggest API (stdio transport).
//
//   EGOSARU_API_KEY=gsk_... node mcp/server.mjs
//
// Tools: egosaru_suggest (one keyword), egosaru_status (queue health).
// Because an agent may call tools in a tight loop, the server enforces two guards on top of the API's own limits:
//   EGOSARU_MAX_CALLS   max egosaru_suggest calls per process (default 60)
//   EGOSARU_MAX_WAIT    max seconds to wait on a 202 before returning "queued" (default 90)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = "https://gstudio1.com/api/v1";
const KEY = process.env.EGOSARU_API_KEY;
const MAX_CALLS = Number(process.env.EGOSARU_MAX_CALLS || 60);
const MAX_WAIT = Number(process.env.EGOSARU_MAX_WAIT || 90);
const SOURCES = ["google", "bing", "youtube", "amazon", "ebay", "shopee", "duckduckgo", "baidu", "yandex", "naver", "daum", "yahoo", "rakuten"];
let calls = 0;

const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 1) }] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function suggest({ q, source, lang, country, flat }) {
  if (!KEY) return { error: "EGOSARU_API_KEY is not set" };
  if (++calls > MAX_CALLS) return { error: `This session reached EGOSARU_MAX_CALLS (${MAX_CALLS}). Start a new session or raise the limit.` };
  const params = new URLSearchParams({ q, lang, ...(country ? { country } : {}), ...(flat ? { flat: "1" } : {}) });
  const url = `${API}/${source}/suggest?${params}`;
  const deadline = Date.now() + MAX_WAIT * 1000;
  let last = null;
  while (true) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
    const body = await res.json().catch(() => ({}));
    last = { status: res.status, body };
    if (res.status === 200) return body;
    if (res.status === 202) {
      const wait = Number(body.retry_after_seconds || 20);
      if (Date.now() + wait * 1000 > deadline) {
        return { ...body, note: `Still queued after ${MAX_WAIT}s. Call again later with the same arguments; the result will be cached.` };
      }
      await sleep(wait);
      continue;
    }
    return { http_status: res.status, ...body };
  }
}

const server = new McpServer({ name: "egosaru-suggest", version: "0.1.0-experimental" });

server.tool(
  "egosaru_suggest",
  "Autocomplete (search suggestion) data for one keyword from a search engine or store, expanded letter by letter, in the given language and country. Uncached keywords take tens of seconds; the tool waits up to EGOSARU_MAX_WAIT seconds.",
  {
    q: z.string().min(1).max(60).describe("Keyword, 1-60 characters"),
    source: z.enum(SOURCES).default("google").describe("Engine or store. Regional ones only for their languages (naver/daum: ko, yandex: ru/tr, baidu: zh/ja/en, rakuten: ja, yahoo: ja/zh-tw)"),
    lang: z.string().min(2).max(5).default("en").describe("Language code: en, ja, es, zh, zh-tw, ko, ru, ar, hi, pt, fr, de, id, vi, th, tr, it, pl, uk, nl"),
    country: z.string().length(2).optional().describe("Market within the language (ISO 3166-1 alpha-2), e.g. gb with en, mx with es, br with pt"),
    flat: z.boolean().default(true).describe("true: one deduplicated suggestions array; false: grouped data"),
  },
  async (args) => text(await suggest(args)),
);

server.tool("egosaru_status", "Queue depth and worker health of the Egosaru API (no key needed)", {}, async () => {
  const res = await fetch(`${API}/status`);
  return text(await res.json().catch(() => ({ http_status: res.status })));
});

await server.connect(new StdioServerTransport());
