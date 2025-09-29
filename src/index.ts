#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { NamecheapClient, NamecheapConfig, DNSHost } from './namecheap-client.js';

class NamecheapMCPServer {
  private server: Server;
  private namecheapClient: NamecheapClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'namecheap-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private initializeClient(): NamecheapClient {
    if (this.namecheapClient) {
      return this.namecheapClient;
    }

    const config: NamecheapConfig = {
      apiUser: process.env.NAMECHEAP_API_USER || '',
      apiKey: process.env.NAMECHEAP_API_KEY || '',
      username: process.env.NAMECHEAP_USERNAME || '',
      clientIp: process.env.NAMECHEAP_CLIENT_IP || '',
      sandbox: process.env.NAMECHEAP_SANDBOX === 'true',
    };

    if (!config.apiUser || !config.apiKey || !config.username || !config.clientIp) {
      throw new Error(
        'Missing required environment variables: NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_USERNAME, NAMECHEAP_CLIENT_IP'
      );
    }

    this.namecheapClient = new NamecheapClient(config);
    return this.namecheapClient;
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'namecheap_check_domain',
          description:
            'Check if one or more domain names are available for registration. Returns availability status and premium pricing if applicable.',
          inputSchema: {
            type: 'object',
            properties: {
              domains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of domain names to check (e.g., ["example.com", "example.net"])',
              },
            },
            required: ['domains'],
          },
        },
        {
          name: 'namecheap_list_domains',
          description:
            'List all domains in your Namecheap account. Supports pagination for large domain portfolios.',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Page number for pagination (default: 1)',
                default: 1,
              },
              pageSize: {
                type: 'number',
                description: 'Number of domains per page (default: 100, max: 100)',
                default: 100,
              },
            },
          },
        },
        {
          name: 'namecheap_get_domain_info',
          description:
            'Get detailed information about a specific domain including owner details, DNS settings, expiration date, and modification rights.',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name (e.g., "example.com")',
              },
            },
            required: ['domain'],
          },
        },
        {
          name: 'namecheap_get_dns_hosts',
          description:
            'Get all DNS host records for a domain including A, AAAA, CNAME, MX, TXT, and other record types.',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name (e.g., "example.com")',
              },
            },
            required: ['domain'],
          },
        },
        {
          name: 'namecheap_set_dns_hosts',
          description:
            'Set DNS host records for a domain. Replaces all existing records with the provided configuration. Use carefully as this overwrites existing DNS settings.',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name (e.g., "example.com")',
              },
              hosts: {
                type: 'array',
                description: 'Array of DNS host records to set',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Host name (e.g., "@" for root, "www" for subdomain)',
                    },
                    type: {
                      type: 'string',
                      description: 'Record type (A, AAAA, CNAME, MX, TXT, NS, etc.)',
                      enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'],
                    },
                    address: {
                      type: 'string',
                      description: 'Record value (IP address, hostname, or text)',
                    },
                    mxPref: {
                      type: 'string',
                      description: 'MX priority (required for MX records)',
                    },
                    ttl: {
                      type: 'string',
                      description: 'Time to live in seconds (default: 1800)',
                    },
                  },
                  required: ['name', 'type', 'address'],
                },
              },
            },
            required: ['domain', 'hosts'],
          },
        },
        {
          name: 'namecheap_get_nameservers',
          description:
            'Get the current nameservers configured for a domain. Shows whether using Namecheap DNS or custom nameservers.',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name (e.g., "example.com")',
              },
            },
            required: ['domain'],
          },
        },
        {
          name: 'namecheap_set_nameservers',
          description:
            'Set custom nameservers for a domain. Use this to point your domain to external DNS providers like Cloudflare, AWS Route53, etc.',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name (e.g., "example.com")',
              },
              nameservers: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Array of nameserver hostnames (e.g., ["ns1.cloudflare.com", "ns2.cloudflare.com"])',
              },
            },
            required: ['domain', 'nameservers'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const client = this.initializeClient();
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'namecheap_check_domain': {
            if (!args || !Array.isArray(args.domains)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'domains parameter must be an array of domain names'
              );
            }

            const results = await client.checkDomain(args.domains);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'namecheap_list_domains': {
            const page = (args?.page as number) || 1;
            const pageSize = (args?.pageSize as number) || 100;

            const domains = await client.listDomains(page, pageSize);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      page,
                      pageSize,
                      count: domains.length,
                      domains,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'namecheap_get_domain_info': {
            if (!args?.domain) {
              throw new McpError(ErrorCode.InvalidParams, 'domain parameter is required');
            }

            const info = await client.getDomainInfo(args.domain as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(info, null, 2),
                },
              ],
            };
          }

          case 'namecheap_get_dns_hosts': {
            if (!args?.domain) {
              throw new McpError(ErrorCode.InvalidParams, 'domain parameter is required');
            }

            const hosts = await client.getDNSHosts(args.domain as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(hosts, null, 2),
                },
              ],
            };
          }

          case 'namecheap_set_dns_hosts': {
            if (!args?.domain || !Array.isArray(args.hosts)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'domain and hosts parameters are required'
              );
            }

            const success = await client.setDNSHosts(args.domain as string, args.hosts as DNSHost[]);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success,
                      message: success
                        ? 'DNS hosts updated successfully'
                        : 'Failed to update DNS hosts',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'namecheap_get_nameservers': {
            if (!args?.domain) {
              throw new McpError(ErrorCode.InvalidParams, 'domain parameter is required');
            }

            const nameservers = await client.getNameservers(args.domain as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(nameservers, null, 2),
                },
              ],
            };
          }

          case 'namecheap_set_nameservers': {
            if (!args?.domain || !Array.isArray(args.nameservers)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'domain and nameservers parameters are required'
              );
            }

            const success = await client.setNameservers(args.domain as string, args.nameservers as string[]);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success,
                      message: success
                        ? 'Nameservers updated successfully'
                        : 'Failed to update nameservers',
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${request.params.name}: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Namecheap MCP server running on stdio');
  }
}

const server = new NamecheapMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});