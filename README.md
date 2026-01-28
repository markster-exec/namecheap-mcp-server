# Namecheap MCP Server

A Model Context Protocol (MCP) server for managing Namecheap domains and DNS records through AI assistants like Claude.

## Features

- **Domain Availability Checking**: Check if domains are available for registration
- **Domain Management**: List and get detailed information about your domains
- **DNS Management**: View and modify DNS host records (A, AAAA, CNAME, MX, TXT, etc.)
- **Nameserver Configuration**: Get and set custom nameservers for domains
- **Premium Domain Detection**: Identify premium domains with pricing information

## Prerequisites

### Namecheap Account Requirements

To use this MCP server, your Namecheap account must meet one of the following:
- Have at least 20 domains under your account
- Have at least $50 on your account balance
- Have at least $50 spent within the last 2 years

### API Access

1. Log into your Namecheap account
2. Navigate to Profile → Tools → Business & Dev Tools → API Access
3. Enable API access
4. Whitelist your IP address (this is the IP that will make API calls)
5. Copy your API key

## Installation

```bash
npm install
npm run build
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your Namecheap credentials:

```env
NAMECHEAP_API_USER=your_namecheap_username
NAMECHEAP_API_KEY=your_api_key_here
NAMECHEAP_USERNAME=your_namecheap_username
NAMECHEAP_CLIENT_IP=your_whitelisted_ip_address
NAMECHEAP_SANDBOX=false  # Set to true for testing with sandbox API
```

**Important Notes:**
- `NAMECHEAP_API_USER` and `NAMECHEAP_USERNAME` are typically the same (your Namecheap username)
- `NAMECHEAP_CLIENT_IP` must be whitelisted in your Namecheap account settings
- For testing, set `NAMECHEAP_SANDBOX=true` to use the sandbox environment

## Usage

### Standalone

```bash
npm start
```

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "namecheap": {
      "command": "node",
      "args": ["/path/to/namecheap-mcp-server/dist/index.js"],
      "env": {
        "NAMECHEAP_API_USER": "your_username",
        "NAMECHEAP_API_KEY": "your_api_key",
        "NAMECHEAP_USERNAME": "your_username",
        "NAMECHEAP_CLIENT_IP": "your_ip",
        "NAMECHEAP_SANDBOX": "false"
      }
    }
  }
}
```

### With metaMCP-RAG

This server is designed to integrate with the metaMCP-RAG orchestration layer. See integration instructions below.

## Available Tools

### `namecheap_check_domain`
Check if domain names are available for registration.

**Parameters:**
- `domains` (array of strings): Domain names to check

**Example:**
```json
{
  "domains": ["example.com", "example.net", "example.org"]
}
```

### `namecheap_list_domains`
List all domains in your account with pagination support.

**Parameters:**
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Results per page (default: 100)

### `namecheap_get_domain_info`
Get detailed information about a specific domain.

**Parameters:**
- `domain` (string): Domain name (e.g., "example.com")

### `namecheap_get_dns_hosts`
Get all DNS host records for a domain.

**Parameters:**
- `domain` (string): Domain name

### `namecheap_set_dns_hosts`
Set DNS host records for a domain. **Warning:** This replaces all existing records.

**Parameters:**
- `domain` (string): Domain name
- `hosts` (array): DNS records to set

**Example:**
```json
{
  "domain": "example.com",
  "hosts": [
    {
      "name": "@",
      "type": "A",
      "address": "192.0.2.1",
      "ttl": "1800"
    },
    {
      "name": "www",
      "type": "CNAME",
      "address": "example.com.",
      "ttl": "1800"
    }
  ]
}
```

### `namecheap_get_nameservers`
Get the current nameservers for a domain.

**Parameters:**
- `domain` (string): Domain name

### `namecheap_set_nameservers`
Set custom nameservers for a domain.

**Parameters:**
- `domain` (string): Domain name
- `nameservers` (array of strings): Nameserver hostnames

**Example:**
```json
{
  "domain": "example.com",
  "nameservers": [
    "ns1.cloudflare.com",
    "ns2.cloudflare.com"
  ]
}
```

## API Rate Limits

Namecheap enforces the following rate limits:
- 50 calls per minute
- 700 calls per hour
- 8000 calls per day

The limits apply across all API calls for your API key.

## Testing with Sandbox

Namecheap provides a sandbox environment for testing:

1. Set `NAMECHEAP_SANDBOX=true` in your `.env`
2. The sandbox uses `https://api.sandbox.namecheap.com/xml.response`
3. No real domains are registered or modified in sandbox mode
4. Use test credit card numbers for domain registration tests

## Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Watch mode for development
npm run dev

# Test the server directly
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Integration with metaMCP-RAG

To integrate with the metaMCP-RAG orchestration layer:

1. Build this server: `npm run build`
2. Edit `~/projects/Utility/DEV-TOOLS/custom-mcp-servers/metamcp-rag-server/src/index.ts`
3. Add the server configuration to the `serverConfigs` array
4. Rebuild metaMCP-RAG: `cd ~/projects/Utility/DEV-TOOLS/custom-mcp-servers/metamcp-rag-server && npm run build`

## Troubleshooting

### Authentication Errors
- Verify your API key is correct
- Ensure your IP address is whitelisted in Namecheap settings
- Check that API access is enabled for your account

### API Errors
- Check that you meet the account requirements (20 domains, $50 balance, or $50 spent)
- Verify you're not exceeding rate limits
- For sandbox testing, ensure `NAMECHEAP_SANDBOX=true`

### DNS Changes Not Applying
- DNS changes can take up to 48 hours to propagate globally
- Use a DNS checker tool to verify changes
- Ensure you're not using cached DNS results

## Security Notes

- **Never commit your `.env` file** - it contains sensitive API credentials
- Store API keys securely
- Use environment variables for production deployments
- Whitelist only the IP addresses that need API access
- Consider using the sandbox environment for testing

## Resources

- [Namecheap API Documentation](https://www.namecheap.com/support/api/intro/)
- [Namecheap API Methods](https://www.namecheap.com/support/api/methods/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)

## License

MIT

---

*Last updated: 2026-01-27 by Claude (Opus 4.5)*