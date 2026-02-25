export type ApiError = {
  status: number
  message: string
  details?: unknown
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function readJsonSafely(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
    signal: options.signal,
  })

  if (!res.ok) {
    const details = await readJsonSafely(res)
    const message =
      (details as { message?: string } | null)?.message ??
      `${res.status} ${res.statusText}`.trim()
    const err: ApiError = { status: res.status, message, details }
    throw err
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  const data = await readJsonSafely(res)
  return data as T
}

