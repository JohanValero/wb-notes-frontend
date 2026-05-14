export interface Workspace {
  uuid: string
  name: string
  description: string | null
  created_t: string
  updated_t: string
}

export interface WorkspaceCreate {
  name: string
  description?: string | null
}

export interface WorkspaceUpdate {
  name?: string
  description?: string | null
}
