#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

import * as tasks from './operations/tasks.js';
import * as projects from './operations/projects.js';

import { formatTickTickError, isTickTickError } from './common/errors.js';
import { VERSION } from './common/version.js';
import z from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import console from 'console';
import { main } from './cli.js';

// If fetch doesn't exist in global scope, add it
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

const server = new Server(
  {
    name: 'ticktick-mcp-server',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_projects',
        description: 'Get all user projects',
        inputSchema: zodToJsonSchema(z.object({})),
      },
      {
        name: 'get_project_by_id',
        description: 'Get a project by ID',
        inputSchema: zodToJsonSchema(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'get_project_with_data',
        description: 'Get a project with its tasks and columns',
        inputSchema: zodToJsonSchema(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'create_project',
        description: 'Create a new project',
        inputSchema: zodToJsonSchema(projects.CreateProjectOptionsSchema),
      },
      {
        name: 'update_project',
        description: 'Update an existing project',
        inputSchema: zodToJsonSchema(projects.UpdateProjectOptionsSchema),
      },
      {
        name: 'delete_project',
        description: 'Delete a project',
        inputSchema: zodToJsonSchema(projects.ProjectIdOptionsSchema),
      },
      {
        name: 'get_task_by_ids',
        description: 'Get a task by ProjectId and TaskId',
        inputSchema: zodToJsonSchema(tasks.GetTaskByIdsOptionsSchema),
      },
      {
        name: 'create_task',
        description: 'Create a new task',
        inputSchema: zodToJsonSchema(tasks.CreateTaskOptionsSchema),
      },
      {
        name: 'update_task',
        description: 'Update an existing task',
        inputSchema: zodToJsonSchema(tasks.UpdateTaskOptionsSchema),
      },
      {
        name: 'complete_task',
        description: 'Complete a task',
        inputSchema: zodToJsonSchema(tasks.TasksIdsOptionsSchema),
      },
      {
        name: 'delete_task',
        description: 'Delete a task',
        inputSchema: zodToJsonSchema(tasks.TasksIdsOptionsSchema),
      },
      {
        name: 'get_completed_tasks',
        description:
          'Get completed tasks across all projects within a date range',
        inputSchema: zodToJsonSchema(tasks.GetCompletedTasksOptionsSchema),
      },
      {
        name: 'get_subtasks',
        description:
          'Get all subtasks of a parent task by fetching project data and filtering by parentId',
        inputSchema: zodToJsonSchema(tasks.GetSubtasksOptionsSchema),
      },
      {
        name: 'get_inbox_tasks',
        description:
          'Get tasks from the inbox. Requires userId or TICKTICK_USER_ID env var.',
        inputSchema: zodToJsonSchema(tasks.GetInboxTasksOptionsSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolsWithoutArguments = ['get_user_projects'];

    if (
      !request.params.arguments &&
      !toolsWithoutArguments.includes(request.params.name)
    ) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'get_user_projects': {
        const result = await projects.getUserProjects();

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_project_by_id': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.getProjectById(args.projectId);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_project_with_data': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.getProjectWithData(args.projectId);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_project': {
        const args = projects.CreateProjectOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.createProject(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_project': {
        const args = projects.UpdateProjectOptionsSchema.parse(
          request.params.arguments
        );

        const result = await projects.updateProject(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'delete_project': {
        const args = projects.ProjectIdOptionsSchema.parse(
          request.params.arguments
        );

        await projects.deleteProject(args.projectId);

        return {
          content: [{ type: 'text', text: 'Project deleted successfully' }],
        };
      }

      case 'get_task_by_ids': {
        const args = tasks.GetTaskByIdsOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getTaskByIds(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'create_task': {
        const args = tasks.CreateTaskOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.createTask(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'update_task': {
        const args = tasks.UpdateTaskOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.updateTask(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'complete_task': {
        const args = tasks.TasksIdsOptionsSchema.parse(
          request.params.arguments
        );

        await tasks.completeTask(args);

        return {
          content: [{ type: 'text', text: 'Task completed successfully' }],
        };
      }

      case 'delete_task': {
        const args = tasks.TasksIdsOptionsSchema.parse(
          request.params.arguments
        );

        await tasks.deleteTask(args);

        return {
          content: [{ type: 'text', text: 'Task deleted successfully' }],
        };
      }

      case 'get_completed_tasks': {
        const args = tasks.GetCompletedTasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getCompletedTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_subtasks': {
        const args = tasks.GetSubtasksOptionsSchema.parse(
          request.params.arguments
        );

        const result = await tasks.getSubtasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_inbox_tasks': {
        const args = tasks.GetInboxTasksOptionsSchema.parse(
          request.params.arguments ?? {}
        );

        const result = await tasks.getInboxTasks(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool name: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isTickTickError(error)) {
      throw new Error(formatTickTickError(error));
    }
    throw error;
  }
});

async function runServer() {
  const initialized = await main();

  if (!initialized.ok) {
    console.error(initialized.message);
  }

  dotenv.config();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TickTick MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
