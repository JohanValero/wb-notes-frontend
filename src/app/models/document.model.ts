export interface DocType {
  tag: string
  label: string
  description: string | null
  is_primary: boolean
}

export interface Document {
  uuid: string
  workspace_uuid: string
  doc_type: string
  title: string
  doc_status: string
  source: string
  is_dirty: boolean
  metadata: string | null
  created_t: string
  updated_t: string
}

export interface DocumentCreate {
  doc_type: string
  title?: string
  doc_status?: string
  source?: string
  metadata?: string | null
}

export interface DocumentUpdate {
  title?: string
  doc_status?: string
  source?: string
  metadata?: string | null
}
