export interface Chunk {
  uuid: string
  document_uuid: string
  content: string
  content_hash: string
  is_dirty: boolean
  created_t: string
  updated_t: string
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[] | null
}
