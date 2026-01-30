---
id: namecheap-mcp-server-docs
title: Namecheap MCP Server Documentation
type: reference
status: active
owner: ivan
created: 2026-01-30
updated: 2026-01-30
tags: [mcp, namecheap, dns, documentation]
---

# Namecheap MCP Server Documentation

Model Context Protocol (MCP) server for Namecheap domain and DNS management.

## Contents

| Document | Description |
|----------|-------------|
| [README](../README.md) | Project overview and setup |
| [Integration Guide](../INTEGRATION.md) | How to integrate with Claude |

## Features

- Domain availability checking
- DNS record management (A, AAAA, CNAME, MX, TXT, etc.)
- Nameserver configuration
- Domain information lookup

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Configuration

Create `.env` from `.env.example`:

```bash
cp .env.example .env
# Edit .env with your Namecheap API credentials
```

Required credentials:
- `NAMECHEAP_API_USER`
- `NAMECHEAP_API_KEY`
- `NAMECHEAP_USERNAME`
- `NAMECHEAP_CLIENT_IP`

### Usage with Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "namecheap": {
      "command": "node",
      "args": ["/path/to/namecheap-mcp-server/dist/index.js"]
    }
  }
}
```

## Architecture

- **src/**: TypeScript source code
- **dist/**: Compiled JavaScript (after build)

## API Reference

See [Namecheap API docs](https://www.namecheap.com/support/api/intro/) for underlying API details.
