import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Fragment, FragmentCreate, FragmentUpdate } from '../models/fragment.model'

export interface SyncResult {
  updated: string[]
  created: string[]
  deleted: string[]
}

export interface SyncItem {
  content: string
  content_hash?: string
  position?: number
}

@Injectable({ providedIn: 'root' })
export class FragmentService {
  private base = '/api/fragments'

  constructor(private http: HttpClient) {}

  list(documentUuid: string): Observable<Fragment[]> {
    const params = new HttpParams().set('document_uuid', documentUuid)
    return this.http.get<Fragment[]>(this.base, { params })
  }

  get(uuid: string): Observable<Fragment> {
    return this.http.get<Fragment>(`${this.base}/${uuid}`)
  }

  create(documentUuid: string, data: FragmentCreate): Observable<Fragment> {
    const params = new HttpParams().set('document_uuid', documentUuid)
    return this.http.post<Fragment>(this.base, data, { params })
  }

  update(uuid: string, data: FragmentUpdate): Observable<Fragment> {
    return this.http.put<Fragment>(`${this.base}/${uuid}`, data)
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`)
  }

  sync(documentUuid: string, items: SyncItem[]): Observable<SyncResult> {
    return this.http.put<SyncResult>(
      `${this.base}/sync/${documentUuid}`,
      items,
    )
  }
}
