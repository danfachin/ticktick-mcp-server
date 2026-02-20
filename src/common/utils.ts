import { createTickTickError } from './errors.js';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function ticktickRequest(
  url: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (process.env.TICKTICK_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.TICKTICK_ACCESS_TOKEN}`;
  }

  const method = options.method || 'GET';
  console.error(`[ticktick] ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    console.error(`[ticktick] ${response.status} ${response.statusText}`, JSON.stringify(responseBody));
    throw createTickTickError(response.status, responseBody);
  }

  console.error(`[ticktick] ${response.status} OK`);
  return responseBody;
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function getFormattedColor(color?: string): string {
  if (color && isValidHexColor(color)) {
    return color;
  }
  return '#4772FA';
}
