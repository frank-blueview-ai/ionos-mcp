# IONOS MCP Server

<!--
Copyright (c) 2025 Frank Perez - The Blue View Group Inc. (blueview.ai) - The Neutrino AI Labs (neutrinoailabs.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->

This is a Model Context Protocol (MCP) server that provides tools for interacting with IONOS APIs. It allows you to manage DNS zones, domains, and SSL certificates through simple commands.

## Features

The server provides tools for interacting with three main IONOS APIs:

### DNS API
- List all DNS zones
- Get details of a specific zone
- Update a zone with new records

### Domains API
- List all domains
- Get details of a specific domain

### SSL API
- List all SSL certificates
- Get details of a specific certificate
- Create a new SSL certificate
- Unassign a certificate

## Prerequisites

- Node.js (v16 or higher)
- An IONOS account with API access enabled
- An IONOS API key

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Blue-View-Ai/ionos-mcp.git
cd ionos-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

To use this MCP server, you need to add it to your MCP settings configuration file. The location of this file depends on your environment:

- For VSCode: `~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- For Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following configuration to the `mcpServers` object in the settings file:

```json
{
  "mcpServers": {
    "ionos": {
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "IONOS_API_KEY": "your-ionos-api-key"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `your-ionos-api-key` with your IONOS API key.

## Getting an IONOS API Key

To use the IONOS APIs, you need to:

1. Sign up for API access on your IONOS account
2. Create an API key through the IONOS developer portal
3. Store the key securely in your MCP settings configuration

The API key format is `publicprefix.secret` and should be treated as sensitive credentials (like passwords).

## Usage

Once the MCP server is configured, you can use the following tools:

### DNS API Tools

- `list_dns_zones`: List all DNS zones
- `get_dns_zone`: Get details of a specific zone
- `update_dns_zone`: Update a zone with new records

### Domains API Tools

- `list_domains`: List all domains
- `get_domain_details`: Get details of a specific domain

### SSL API Tools

- `list_certificates`: List all SSL certificates
- `get_certificate_details`: Get details of a specific certificate
- `create_certificate`: Create a new SSL certificate
- `delete_certificate`: Unassign a certificate

## Rate Limits

IONOS APIs have a rate limit of 1200 requests per hour per API key. The server handles rate limiting errors and will return appropriate error messages if the rate limit is exceeded.

## License

MIT