# Egosaru Suggest MCP server (experimental)

An [MCP](https://modelcontextprotocol.io/) server that lets Claude Desktop, Claude Code, Cursor and other MCP clients
call the Egosaru Suggest API as tools. It is a thin wrapper over the HTTP API; the API itself (curl, Python, Node)
is the supported way to use Egosaru, and this server is **experimental**: its interface may change.

## Tools

| Tool | What it does |
|---|---|
| `egosaru_suggest` | Suggestions for one keyword (`q`, `source`, `lang`, optional `country`, `flat`). Waits on `202` up to `EGOSARU_MAX_WAIT` seconds, then returns `queued` so the agent can try again later. |
| `egosaru_status` | Queue depth and worker health. |

## Setup

```bash
cd mcp
npm install
EGOSARU_API_KEY=gsk_... node server.mjs
```

Claude Desktop (`claude_desktop_config.json`) or Claude Code (`.mcp.json`):

```json
{
  "mcpServers": {
    "egosaru": {
      "command": "node",
      "args": ["/path/to/egosaru-suggest-api/mcp/server.mjs"],
      "env": { "EGOSARU_API_KEY": "gsk_..." }
    }
  }
}
```

## Guards

Agents can call tools in loops, so two limits apply per server process on top of the API's own limits
(30 requests/minute, 1,000/day, 20 new keywords/day on the free plan):

| Variable | Default | Meaning |
|---|---|---|
| `EGOSARU_MAX_CALLS` | 60 | Maximum `egosaru_suggest` calls per process |
| `EGOSARU_MAX_WAIT` | 90 | Seconds to wait on a `202` before answering `queued` |

Keep your key out of prompts and repositories; pass it through the `env` block only.
