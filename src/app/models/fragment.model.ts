export interface Fragment {
  uuid: string
  document_uuid: string
  workspace_uuid: string
  content: string | null
  content_hash: string
  position: number
  is_dirty: boolean
  created_t: string
  updated_t: string
}

export interface FragmentCreate {
  content: string
  position: number
}

export interface FragmentUpdate {
  content?: string
  position?: number
}
