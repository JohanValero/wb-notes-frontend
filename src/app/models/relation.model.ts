export interface RelationType {
  tag: string
  label: string
  description: string | null
  implies_dependency: boolean
}

export interface Relation {
  uuid: string
  source_uuid: string
  target_uuid: string
  relation_type: string
  confidence: number
  metadata: string | null
  created_t: string
}

export interface RelationCreate {
  source_uuid: string
  target_uuid: string
  relation_type: string
  confidence?: number
  metadata?: string | null
}

export interface RelationUpdate {
  confidence?: number
  metadata?: string | null
}
