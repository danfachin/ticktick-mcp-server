import { z } from 'zod';
import { ticktickRequest } from '../common/utils.js';
import { TICKTICK_API_URL } from '../common/urls.js';
import {
  TickTickCheckListItemSchema,
  TickTickTaskDeleteSchema,
  TickTickTaskSchema,
  TickTickUserSchema,
} from '../common/types.js';
import { getProjectWithData, getUserProjects } from './projects.js';

export const GetTaskByIdsOptionsSchema = z.object({
  projectId: z.string().describe('Project identifier'),
  taskId: z.string().describe('Task identifier'),
});

export const GetTaskByIdsResponseSchema = TickTickTaskSchema;

export const CreateTaskOptionsSchema = z.object({
  title: z.string().describe('Task title'),
  projectId: z.string().describe('Project id'),
  content: z.string().optional().describe('Task content'),
  desc: z.string().optional().describe('Task description'),
  isAllDay: z.boolean().optional().describe('Is all day task'),
  startDate: z
    .string()
    .optional()
    .describe(`Task start date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  dueDate: z
    .string()
    .optional()
    .describe(`Task due date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  timeZone: z
    .string()
    .optional()
    .describe('Task time zone. Example: "America/Los_Angeles"'),
  reminders: z
    .array(z.string())
    .optional()
    .describe(
      'List of reminder triggers in iCalendar (RFC 5545) format. Example: ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]'
    ),
  repeatFlag: z
    .string()
    .optional()
    .describe(
      'Task repeat flag in iCalendar (RFC 5545) format. Example: RRULE:FREQ=DAILY;INTERVAL=1'
    ),
  priority: z
    .number()
    .optional()
    .describe('Task priority None: 0, Low: 1, Medium: 3, High: 5'),
  sortOrder: z.string().optional().describe('Task sort order. Example: 12345'),
  items: z
    .array(TickTickCheckListItemSchema)
    .optional()
    .describe('The list of subtasks'),
  parentId: z
    .string()
    .optional()
    .describe('Parent task ID to create this task as a subtask'),
});

export const UpdateTaskOptionsSchema = z.object({
  taskId: z.string().describe('Task identifier - Path'),
  id: z.string().describe('Task identifier - Body'),
  projectId: z.string().describe('Project id'),
  title: z.string().optional().describe('Task title'),
  content: z.string().optional().describe('Task content'),
  desc: z.string().optional().describe('Task description'),
  isAllDay: z.boolean().optional().describe('Is all day task'),
  startDate: z
    .string()
    .optional()
    .describe(`Task start date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  dueDate: z
    .string()
    .optional()
    .describe(`Task due date in "yyyy-MM-dd'T'HH:mm:ssZ" format`),
  timeZone: z
    .string()
    .optional()
    .describe('Task time zone. Example: "America/Los_Angeles"'),
  reminders: z
    .array(z.string())
    .optional()
    .describe(
      'List of reminder triggers in iCalendar (RFC 5545) format. Example: ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]'
    ),
  repeatFlag: z
    .string()
    .optional()
    .describe(
      'Task repeat flag in iCalendar (RFC 5545) format. Example: RRULE:FREQ=DAILY;INTERVAL=1'
    ),
  priority: z
    .number()
    .optional()
    .describe('Task priority None: 0, Low: 1, Medium: 3, High: 5'),
  sortOrder: z.string().optional().describe('Task sort order. Example: 12345'),
  items: z
    .array(TickTickCheckListItemSchema)
    .optional()
    .describe('The list of subtasks'),
  parentId: z
    .string()
    .optional()
    .describe('Parent task ID to make this task a subtask'),
});

export const TasksIdsOptionsSchema = z.object({
  taskId: z.string().describe('Task identifier'),
  projectId: z.string().describe('Project identifier'),
});

type GetTaskByIdsParams = z.infer<typeof GetTaskByIdsOptionsSchema>;

type CreateTaskParams = z.infer<typeof CreateTaskOptionsSchema>;

type UpdateTaskParams = z.infer<typeof UpdateTaskOptionsSchema>;

type TasksIdsParams = z.infer<typeof TasksIdsOptionsSchema>;

export async function getTaskByIds(
  params: GetTaskByIdsParams
): Promise<z.infer<typeof GetTaskByIdsResponseSchema>> {
  const { projectId, taskId } = GetTaskByIdsOptionsSchema.parse(params);

  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}`;

  const response = await ticktickRequest(url);

  return GetTaskByIdsResponseSchema.parse(response);
}

export async function createTask(
  params: CreateTaskParams
): Promise<z.infer<typeof TickTickTaskSchema>> {
  const url = `${TICKTICK_API_URL}/task`;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body: {
      ...params,
    },
  });

  return TickTickTaskSchema.parse(response);
}

export async function updateTask(
  params: UpdateTaskParams
): Promise<z.infer<typeof TickTickTaskSchema>> {
  const { taskId, id, ...rest } = params;

  const url = `${TICKTICK_API_URL}/task/${taskId || id}`;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body: {
      id: id || taskId,
      ...rest,
    },
  });

  return TickTickTaskSchema.parse(response);
}

export async function completeTask({
  taskId,
  projectId,
}: TasksIdsParams): Promise<void> {
  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}/complete`;

  await ticktickRequest(url, {
    method: 'POST',
  });
}

export async function deleteTask({
  taskId,
  projectId,
}: TasksIdsParams): Promise<void> {
  const url = `${TICKTICK_API_URL}/project/${projectId}/task/${taskId}`;

  await ticktickRequest(url, {
    method: 'DELETE',
  });
}

// --- get_completed_tasks ---

export const GetCompletedTasksOptionsSchema = z.object({
  from: z
    .string()
    .describe(
      'Start datetime string, e.g. "2026-02-19T00:00:00.000+0000"'
    ),
  to: z
    .string()
    .optional()
    .describe(
      'End datetime string. Defaults to now if not provided'
    ),
  limit: z
    .number()
    .optional()
    .describe('Max number of results to return (default 100)'),
});

type GetCompletedTasksParams = z.infer<typeof GetCompletedTasksOptionsSchema>;

export async function getCompletedTasks(
  params: GetCompletedTasksParams
): Promise<z.infer<typeof TickTickTaskSchema>[]> {
  const { from, to, limit } = params;
  const fromDate = new Date(from);
  const toDate = to ? new Date(to) : new Date();
  const resultLimit = limit || 100;

  const allProjects = await getUserProjects();
  const completedTasks: z.infer<typeof TickTickTaskSchema>[] = [];

  for (const project of allProjects) {
    if (completedTasks.length >= resultLimit) break;
    try {
      const data = await getProjectWithData(project.id);
      for (const task of data.tasks) {
        if (completedTasks.length >= resultLimit) break;
        if (task.completedTime != null) {
          const completedMs =
            typeof task.completedTime === 'number'
              ? task.completedTime
              : new Date(task.completedTime).getTime();
          if (completedMs >= fromDate.getTime() && completedMs <= toDate.getTime()) {
            completedTasks.push(task);
          }
        }
      }
    } catch {
      continue;
    }
  }

  return completedTasks;
}

// --- batch_update_tasks ---

export const BatchUpdateTasksOptionsSchema = z
  .object({
    add: z
      .array(TickTickTaskSchema.partial().extend({ title: z.string(), projectId: z.string() }))
      .optional()
      .describe('Array of task objects to create'),
    update: z
      .array(TickTickTaskSchema.partial().extend({ id: z.string(), projectId: z.string() }))
      .optional()
      .describe('Array of task objects to update'),
    delete: z
      .array(TickTickTaskDeleteSchema)
      .optional()
      .describe('Array of { taskId, projectId } objects to delete'),
  })
  .refine(
    (data) =>
      (data.add && data.add.length > 0) ||
      (data.update && data.update.length > 0) ||
      (data.delete && data.delete.length > 0),
    { message: 'At least one of add, update, or delete must be provided' }
  );

type BatchUpdateTasksParams = z.infer<typeof BatchUpdateTasksOptionsSchema>;

export async function batchUpdateTasks(
  params: BatchUpdateTasksParams
): Promise<unknown> {
  const url = `${TICKTICK_API_URL}/batch/task`;

  const body: Record<string, unknown> = {};
  if (params.add) body.add = params.add;
  if (params.update) body.update = params.update;
  if (params.delete) body.delete = params.delete;

  const response = await ticktickRequest(url, {
    method: 'POST',
    body,
  });

  return response;
}

// --- get_subtasks ---

export const GetSubtasksOptionsSchema = z.object({
  parentId: z.string().describe('Parent task ID to find subtasks for'),
  projectId: z.string().describe('Project ID containing the parent task'),
});

type GetSubtasksParams = z.infer<typeof GetSubtasksOptionsSchema>;

export async function getSubtasks(
  params: GetSubtasksParams
): Promise<z.infer<typeof TickTickTaskSchema>[]> {
  const { parentId, projectId } = params;

  const url = `${TICKTICK_API_URL}/project/${projectId}/data`;
  const response = await ticktickRequest(url);

  const projectData = z
    .object({
      tasks: z.array(TickTickTaskSchema),
    })
    .passthrough()
    .parse(response);

  return projectData.tasks.filter((task) => task.parentId === parentId);
}

// --- get_current_user ---

export async function getCurrentUser(): Promise<
  z.infer<typeof TickTickUserSchema>
> {
  const url = `${TICKTICK_API_URL}/user`;
  const response = await ticktickRequest(url);
  return TickTickUserSchema.parse(response);
}

// --- get_inbox_tasks ---

export const GetInboxTasksOptionsSchema = z.object({
  includeCompleted: z
    .boolean()
    .optional()
    .describe('Include completed tasks (default false)'),
});

type GetInboxTasksParams = z.infer<typeof GetInboxTasksOptionsSchema>;

export async function getInboxTasks(params: GetInboxTasksParams) {
  const user = await getCurrentUser();
  const userId = String(user.inboxId ?? user.id ?? user.userId);
  const inboxProjectId = userId.startsWith('inbox') ? userId : `inbox${userId}`;
  const data = await getProjectWithData(inboxProjectId);

  if (!params.includeCompleted) {
    data.tasks = data.tasks.filter((task) => task.status !== 2);
  }

  return data;
}
