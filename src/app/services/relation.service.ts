import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Relation, RelationType, RelationCreate, RelationUpdate } from '../models/relation.model'

@Injectable({ providedIn: 'root' })
export class RelationService {
  private base = '/api/relations'

  constructor(private http: HttpClient) {}

  listTypes(): Observable<RelationType[]> {
    return this.http.get<RelationType[]>(`${this.base}/types`)
  }

  list(sourceUuid?: string, targetUuid?: string, relationType?: string): Observable<Relation[]> {
    let params = new HttpParams()
    if (sourceUuid) params = params.set('source_uuid', sourceUuid)
    if (targetUuid) params = params.set('target_uuid', targetUuid)
    if (relationType) params = params.set('relation_type', relationType)
    return this.http.get<Relation[]>(this.base, { params })
  }

  get(uuid: string): Observable<Relation> {
    return this.http.get<Relation>(`${this.base}/${uuid}`)
  }

  create(data: RelationCreate): Observable<Relation> {
    return this.http.post<Relation>(this.base, data)
  }

  update(uuid: string, data: RelationUpdate): Observable<Relation> {
    return this.http.put<Relation>(`${this.base}/${uuid}`, data)
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`)
  }
}
