# Namecheap MCP Server - Integration Guide

## Quick Start

The Namecheap MCP server has been successfully integrated with your metaMCP-RAG orchestration layer!

## What Was Built

### 1. Namecheap API Client (`src/namecheap-client.ts`)
A fully-featured TypeScript client for the Namecheap API that handles:
- Domain availability checking
- Domain information retrieval
- DNS host record management
- Nameserver configuration
- Domain listing with pagination
- Sandbox and production mode support

### 2. MCP Server (`src/index.ts`)
An MCP-compliant server exposing 7 tools:
- `namecheap_check_domain` - Check domain availability
- `namecheap_list_domains` - List all your domains
- `namecheap_get_domain_info` - Get domain details
- `namecheap_get_dns_hosts` - Get DNS records
- `namecheap_set_dns_hosts` - Update DNS records
- `namecheap_get_nameservers` - Get nameservers
- `namecheap_set_nameservers` - Update nameservers

### 3. MetaMCP-RAG Integration
The server is now configured in your metaMCP-RAG orchestration layer at:
`~/projects/Utility/DEV-TOOLS/custom-mcp-servers/metamcp-rag-server/src/index.ts:353-366`

## Configuration Required

Before the Namecheap MCP server can be used, you need to set up your API credentials.

### Step 1: Get Namecheap API Access

1. Log into your Namecheap account
2. Go to Profile → Tools → Business & Dev Tools → API Access
3. Enable API access (requires one of):
   - 20+ domains in your account
   - $50+ account balance
   - $50+ spent in last 2 years
4. Whitelist your IP address
5. Copy your API key

### Step 2: Configure Environment Variables

Add these to your shell environment (e.g., `~/.bashrc` or `~/.zshrc`):

```bash
export NAMECHEAP_API_USER="your_namecheap_username"
export NAMECHEAP_API_KEY="your_api_key_here"
export NAMECHEAP_USERNAME="your_namecheap_username"
export NAMECHEAP_CLIENT_IP="your_whitelisted_ip"
export NAMECHEAP_SANDBOX="false"  # Set to "true" for testing
```

Or create a `.env` file in the namecheap-mcp-server directory:

```bash
cd ~/projects/Utility/custom-mcp-servers/namecheap-mcp-server
cp .env.example .env
# Edit .env with your credentials
```

### Step 3: Reload Your Shell

```bash
source ~/.bashrc  # or ~/.zshrc
```

## Testing the Integration

Once configured, the Namecheap tools will be automatically available through Claude via the metaMCP-RAG layer.

### Test Commands

You can ask Claude:
- "Check if example.com is available"
- "List all my Namecheap domains"
- "Get DNS records for mysite.com"
- "Set an A record for example.com pointing to 192.0.2.1"
- "What are the nameservers for mydomain.com?"

### Direct Testing (Optional)

Test the server directly without Claude:

```bash
cd ~/projects/Utility/custom-mcp-servers/namecheap-mcp-server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Architecture

```
Claude Code
    ↓
metaMCP-RAG Server (orchestration layer)
    ↓
Namecheap MCP Server (one of many servers)
    ↓
Namecheap API
```

The metaMCP-RAG server automatically:
- Starts the Namecheap MCP server on demand
- Discovers available tools
- Uses RAG to select relevant tools based on your query
- Routes tool calls to the appropriate server
- Aggregates results back to Claude

## Tools Available

### 1. Check Domain Availability
```json
{
  "tool": "namecheap_check_domain",
  "domains": ["example.com", "example.net"]
}
```

### 2. List Your Domains
```json
{
  "tool": "namecheap_list_domains",
  "page": 1,
  "pageSize": 100
}
```

### 3. Get Domain Info
```json
{
  "tool": "namecheap_get_domain_info",
  "domain": "example.com"
}
```

### 4. Get DNS Records
```json
{
  "tool": "namecheap_get_dns_hosts",
  "domain": "example.com"
}
```

### 5. Set DNS Records
```json
{
  "tool": "namecheap_set_dns_hosts",
  "domain": "example.com",
  "hosts": [
    {
      "name": "@",
      "type": "A",
      "address": "192.0.2.1",
      "ttl": "1800"
    }
  ]
}
```

### 6. Get Nameservers
```json
{
  "tool": "namecheap_get_nameservers",
  "domain": "example.com"
}
```

### 7. Set Nameservers
```json
{
  "tool": "namecheap_set_nameservers",
  "domain": "example.com",
  "nameservers": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
}
```

## Rate Limits

Namecheap enforces these rate limits per API key:
- 50 calls/minute
- 700 calls/hour
- 8000 calls/day

The server does not currently implement rate limiting, so be mindful of API usage.

## Troubleshooting

### "Missing required environment variables"
- Ensure all NAMECHEAP_* environment variables are set
- Restart your shell after setting variables
- Check that variables are exported

### "Authentication failed"
- Verify your API key is correct
- Ensure your IP is whitelisted in Namecheap settings
- Check that API access is enabled for your account

### "Domain not found"
- Ensure the domain is registered in your Namecheap account
- Check domain spelling and TLD

### Server not starting
- Check that the build completed: `cd ~/projects/Utility/custom-mcp-servers/namecheap-mcp-server && npm run build`
- Verify the dist/index.js file exists and is executable

## Next Steps

1. **Set up credentials** following Step 2 above
2. **Test with sandbox** first by setting `NAMECHEAP_SANDBOX=true`
3. **Try basic queries** through Claude to verify integration
4. **Switch to production** by setting `NAMECHEAP_SANDBOX=false`

## Security Notes

- Never commit `.env` files to version control
- Keep your API key secure
- Use environment variables for production
- Whitelist only necessary IP addresses
- Consider using sandbox mode for development

## Additional Resources

- Namecheap API Docs: https://www.namecheap.com/support/api/intro/
- MCP Documentation: https://modelcontextprotocol.io/
- Project README: `README.md`