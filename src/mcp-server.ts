#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import {
  designComponentTool,
  queryComponentTool,
  designBlockTool,
  integrateDesignTool,
} from '@/tools/index.js';
import {
  getDesignRulesResource,
  getComponentTemplatesResource,
} from '@/resources/index.js';

/**
 * GarenCode MCP Design Service
 * MCP service dedicated to component design
 */
class GarenCodeMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'garencode-design-service',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {
            listChanged: true,
          },
          resources: {
            subscribe: true,
            listChanged: true,
          },
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Build tools list
      const tools = [
        {
          name: 'design_component',
          description:
            "Analyze user requirements and develop a block-based design strategy. Use this when users ask to 'design component', 'create component', or 'component design'. For complex needs, it breaks down into multiple blocks with step-by-step guidance.",
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'array',
                description: 'User business requirements or design description',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['text', 'image'] },
                    text: { type: 'string' },
                    image: { type: 'string' },
                  },
                  required: ['type'],
                },
              },
              component: {
                type: 'object',
                description:
                  'Existing component information (optional, for updates)',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'query_component',
          description:
            'Query detailed information of a component including documentation, API, and example code. Provide the component name to get all related information.',
          inputSchema: {
            type: 'object',
            properties: {
              componentName: {
                type: 'string',
                description: "Component name to query, e.g., 'das-action-more'",
              },
            },
            required: ['componentName'],
          },
        },
        {
          name: 'design_block',
          description:
            'Design a specific block. This is the second-stage tool in the block-based design strategy for detailed component design.',
          inputSchema: {
            type: 'object',
            properties: {
              blockId: {
                type: 'string',
                description: 'ID of the design block to design',
              },
              prompt: {
                type: 'array',
                description: 'Specific requirement description for the block',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['text', 'image'] },
                    text: { type: 'string' },
                    image: { type: 'string' },
                  },
                  required: ['type'],
                },
              },
              blockInfo: {
                type: 'object',
                description: 'Detailed information of the block (optional)',
                properties: {
                  blockId: { type: 'string' },
                  blockType: {
                    type: 'string',
                    enum: ['layout', 'component', 'logic'],
                  },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
              },
              integratedContext: {
                type: 'object',
                description:
                  'Integration context (optional): contains the overall strategy and completed block designs to return an updated integrated design snapshot',
                properties: {
                  strategy: { type: 'object' },
                  blockDesigns: { type: 'array' },
                },
              },
            },
            required: ['blockId', 'prompt'],
          },
        },
        {
          name: 'integrate_design',
          description:
            'Combine the overall DesignStrategy with completed blockDesigns and return IntegratedDesign (including props summary, private components used, and composition recommendations).',
          inputSchema: {
            type: 'object',
            properties: {
              strategy: {
                type: 'object',
                description: 'DesignStrategy object',
              },
              blockDesigns: {
                type: 'array',
                description:
                  'Completed block design list: [{ blockId, component }]',
              },
            },
            required: ['strategy', 'blockDesigns'],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'design_component':
          return await designComponentTool(args);

        case 'query_component':
          return await queryComponentTool(args);

        case 'design_block':
          return await designBlockTool(args);

        case 'integrate_design':
          return await integrateDesignTool(args);

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });

    // Resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'garencode://design-rules',
            name: 'Component design rules',
            description: 'Rules and constraints for guiding component design',
            mimeType: 'application/json',
          },
          {
            uri: 'garencode://component-templates',
            name: 'Component templates',
            description: 'Standard component file structure templates',
            mimeType: 'text/plain',
          },
        ],
      };
    });

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        switch (uri) {
          case 'garencode://design-rules':
            return getDesignRulesResource();
          case 'garencode://component-templates':
            return getComponentTemplatesResource();
          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Unknown resource: ${uri}`
            );
        }
      }
    );
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 GarenCode MCP Design Service started');
  }
}

// Start server
const server = new GarenCodeMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
