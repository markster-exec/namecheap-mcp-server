# AGENTS

Repository-specific instructions for namecheap-mcp-server. Global standards in `~/.codex/AGENTS.md`.

## Mission

MCP server for Namecheap domain and DNS management.

**Repo:** https://github.com/markster-exec/namecheap-mcp-server

## Map

| Directory | Purpose |
|-----------|---------|
| `src/` | TypeScript source |
| `dist/` | Compiled output |
| `CURRENT_STATUS.md` | Current reality |
| `ACTIVE_PLAN.md` | What we're executing |

## Workflow

**Before starting:** Read these files in order:
1. `CURRENT_STATUS.md` - Current reality
2. `ACTIVE_PLAN.md` - Active plan (if exists)
3. Then reference other docs for context

## Commands

```bash
npm run build        # Compile TypeScript
npm run dev          # Development mode
npm test             # Run tests
```

## Tech Stack

- TypeScript
- MCP SDK
- Namecheap API

## MCP Tools Provided

- Domain availability check
- DNS record management
- Domain info retrieval
- Nameserver configuration
