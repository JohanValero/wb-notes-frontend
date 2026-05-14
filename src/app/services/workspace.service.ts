import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Workspace, WorkspaceCreate, WorkspaceUpdate } from '../models/workspace.model'

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private base = '/api/workspaces'

  constructor(private http: HttpClient) {}

  list(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(this.base)
  }

  get(uuid: string): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/${uuid}`)
  }

  create(data: WorkspaceCreate): Observable<Workspace> {
    return this.http.post<Workspace>(this.base, data)
  }

  update(uuid: string, data: WorkspaceUpdate): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/${uuid}`, data)
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`)
  }
}
