import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Document, DocType, DocumentCreate, DocumentUpdate } from '../models/document.model'

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private base = '/api/documents'

  constructor(private http: HttpClient) {}

  listTypes(): Observable<DocType[]> {
    return this.http.get<DocType[]>(`${this.base}/types`)
  }

  list(workspaceUuid?: string, docType?: string): Observable<Document[]> {
    let params = new HttpParams()
    if (workspaceUuid) params = params.set('workspace_uuid', workspaceUuid)
    if (docType) params = params.set('doc_type', docType)
    return this.http.get<Document[]>(this.base, { params })
  }

  get(uuid: string): Observable<Document> {
    return this.http.get<Document>(`${this.base}/${uuid}`)
  }

  create(workspaceUuid: string, data: DocumentCreate): Observable<Document> {
    const params = new HttpParams().set('workspace_uuid', workspaceUuid)
    return this.http.post<Document>(this.base, data, { params })
  }

  update(uuid: string, data: DocumentUpdate): Observable<Document> {
    return this.http.put<Document>(`${this.base}/${uuid}`, data)
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`)
  }
}
