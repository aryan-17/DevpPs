import type { Role } from './types'

type JwtPayload = {
  sub?: string
  role?: Role
  exp?: number
  iat?: number
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  return atob(base64 + pad)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = base64UrlDecode(parts[1] ?? '')
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function getRoleFromAccessToken(accessToken: string | null): Role | null {
  if (!accessToken) return null
  const payload = decodeJwtPayload(accessToken)
  return payload?.role ?? null
}

