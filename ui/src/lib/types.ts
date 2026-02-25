export type Role = 'ADMIN' | 'DEVELOPER'

export type AuthUser = {
  email: string
  role: Role
}

export type Environment = {
  id: string
  name: string
  colorCode?: string | null
}

export type Project = {
  id: string
  name: string
  description?: string | null
  team?: string | null
  status?: string | null
}

export type Credential = {
  id: string
  projectId: string
  key: string
  value: string
  type?: string | null
  description?: string | null
  updatedByUserId?: string | null
  updatedAt?: string | null
}

export type User = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
}

export type AuditLog = {
  id: string
  action: string
  credentialKey?: string | null
  ipAddress?: string | null
  createdAt: string
  user?: Partial<User> | null
  project?: Partial<Project> | null
  environment?: Partial<Environment> | null
}

