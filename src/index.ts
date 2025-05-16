#!/usr/bin/env node
/**
 * @license
 * Copyright (c) 2025 Frank Perez - The Blue View Group Inc. (blueview.ai) - The Neutrino AI Labs (neutrinoailabs.com)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

// API key will be provided through environment variables
const API_KEY = process.env.IONOS_API_KEY;
if (!API_KEY) {
  throw new Error('IONOS_API_KEY environment variable is required');
}

/**
 * IONOS MCP Server
 * 
 * This server provides tools for interacting with IONOS APIs:
 * - DNS API
 * - Domains API
 * - SSL API
 */
class IonosMcpServer {
  private server: Server;
  private dnsApiClient: AxiosInstance;
  private domainsApiClient: AxiosInstance;
  private sslApiClient: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'ionos-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize API clients
    this.dnsApiClient = axios.create({
      baseURL: 'https://api.hosting.ionos.com/dns',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    this.domainsApiClient = axios.create({
      baseURL: 'https://api.hosting.ionos.com/domains',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    this.sslApiClient = axios.create({
      baseURL: 'https://api.hosting.ionos.com/ssl',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    // Set up request handlers
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // DNS API Tools
        {
          name: 'list_dns_zones',
          description: 'List all DNS zones',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get_dns_zone',
          description: 'Get details of a specific DNS zone',
          inputSchema: {
            type: 'object',
            properties: {
              zoneId: {
                type: 'string',
                description: 'ID of the DNS zone',
              },
            },
            required: ['zoneId'],
            additionalProperties: false,
          },
        },
        {
          name: 'update_dns_zone',
          description: 'Update a DNS zone with new records',
          inputSchema: {
            type: 'object',
            properties: {
              zoneId: {
                type: 'string',
                description: 'ID of the DNS zone',
              },
              records: {
                type: 'array',
                description: 'Array of DNS records to update',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    content: { type: 'string' },
                    ttl: { type: 'number' },
                    prio: { type: 'number' },
                    disabled: { type: 'boolean' },
                  },
                  required: ['name', 'type', 'content'],
                },
              },
            },
            required: ['zoneId', 'records'],
            additionalProperties: false,
          },
        },
        
        // Domains API Tools
        {
          name: 'list_domains',
          description: 'List all domains',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get_domain_details',
          description: 'Get details of a specific domain',
          inputSchema: {
            type: 'object',
            properties: {
              domainId: {
                type: 'string',
                description: 'ID of the domain',
              },
            },
            required: ['domainId'],
            additionalProperties: false,
          },
        },
        
        // SSL API Tools
        {
          name: 'list_certificates',
          description: 'List all SSL certificates',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get_certificate_details',
          description: 'Get details of a specific SSL certificate',
          inputSchema: {
            type: 'object',
            properties: {
              certificateId: {
                type: 'string',
                description: 'ID of the SSL certificate',
              },
            },
            required: ['certificateId'],
            additionalProperties: false,
          },
        },
        {
          name: 'create_certificate',
          description: 'Create a new SSL certificate',
          inputSchema: {
            type: 'object',
            properties: {
              domainName: {
                type: 'string',
                description: 'Domain name for the certificate',
              },
              subjectAlternativeNames: {
                type: 'array',
                description: 'Additional domain names for the certificate',
                items: {
                  type: 'string',
                },
              },
            },
            required: ['domainName'],
            additionalProperties: false,
          },
        },
        {
          name: 'delete_certificate',
          description: 'Unassign an SSL certificate',
          inputSchema: {
            type: 'object',
            properties: {
              certificateId: {
                type: 'string',
                description: 'ID of the SSL certificate',
              },
            },
            required: ['certificateId'],
            additionalProperties: false,
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          // DNS API Tools
          case 'list_dns_zones':
            return await this.listDnsZones();
          case 'get_dns_zone':
            return await this.getDnsZone(request.params.arguments as { zoneId: string });
          case 'update_dns_zone':
            return await this.updateDnsZone(request.params.arguments as { zoneId: string, records: any[] });
          
          // Domains API Tools
          case 'list_domains':
            return await this.listDomains();
          case 'get_domain_details':
            return await this.getDomainDetails(request.params.arguments as { domainId: string });
          
          // SSL API Tools
          case 'list_certificates':
            return await this.listCertificates();
          case 'get_certificate_details':
            return await this.getCertificateDetails(request.params.arguments as { certificateId: string });
          case 'create_certificate':
            return await this.createCertificate(request.params.arguments as { domainName: string, subjectAlternativeNames?: string[] });
          case 'delete_certificate':
            return await this.deleteCertificate(request.params.arguments as { certificateId: string });
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `IONOS API error: ${error.response?.data?.message || error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  // DNS API Methods
  private async listDnsZones() {
    const response = await this.dnsApiClient.get('/v1/zones');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getDnsZone(params: { zoneId: string }) {
    const response = await this.dnsApiClient.get(`/v1/zones/${params.zoneId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async updateDnsZone(params: { zoneId: string, records: any[] }) {
    const response = await this.dnsApiClient.patch(`/v1/zones/${params.zoneId}`, {
      records: params.records,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  // Domains API Methods
  private async listDomains() {
    const response = await this.domainsApiClient.get('/v1/domainitems');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getDomainDetails(params: { domainId: string }) {
    const response = await this.domainsApiClient.get(`/v1/domainitems/${params.domainId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  // SSL API Methods
  private async listCertificates() {
    const response = await this.sslApiClient.get('/v1/certificates');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getCertificateDetails(params: { certificateId: string }) {
    const response = await this.sslApiClient.get(`/v1/certificates/${params.certificateId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async createCertificate(params: { domainName: string, subjectAlternativeNames?: string[] }) {
    const response = await this.sslApiClient.post('/v1/certificates', {
      domainName: params.domainName,
      subjectAlternativeNames: params.subjectAlternativeNames || [],
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async deleteCertificate(params: { certificateId: string }) {
    const response = await this.sslApiClient.delete(`/v1/certificates/${params.certificateId}`);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('IONOS MCP server running on stdio');
  }
}

// Start the server
const server = new IonosMcpServer();
server.run().catch(console.error);