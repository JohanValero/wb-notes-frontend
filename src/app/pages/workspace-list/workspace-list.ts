import { Component, signal, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { WorkspaceService } from '../../services/workspace.service'
import { Workspace } from '../../models/workspace.model'
import { DatePipe } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-workspace-list',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './workspace-list.html',
  styleUrl: './workspace-list.scss',
})
export class WorkspaceListComponent implements OnInit {
  workspaces = signal<Workspace[]>([])
  loading = signal(true)
  showForm = signal(false)
  editingId = signal<string | null>(null)
  formName = ''
  formDescription = ''

  constructor(private service: WorkspaceService) {}

  ngOnInit() {
    this.load()
  }

  load() {
    this.loading.set(true)
    this.service.list().subscribe({
      next: (data) => this.workspaces.set(data),
      complete: () => this.loading.set(false),
    })
  }

  startCreate() {
    this.editingId.set(null)
    this.formName = ''
    this.formDescription = ''
    this.showForm.set(true)
  }

  startEdit(w: Workspace) {
    this.editingId.set(w.uuid)
    this.formName = w.name
    this.formDescription = w.description ?? ''
    this.showForm.set(true)
  }

  cancelForm() {
    this.showForm.set(false)
    this.editingId.set(null)
  }

  save() {
    if (!this.formName.trim()) return
    const id = this.editingId()
    if (id) {
      this.service.update(id, { name: this.formName, description: this.formDescription || null }).subscribe({
        next: () => { this.cancelForm(); this.load(); },
      })
    } else {
      this.service.create({ name: this.formName, description: this.formDescription || null }).subscribe({
        next: () => { this.cancelForm(); this.load(); },
      })
    }
  }

  delete(uuid: string) {
    if (!confirm('¿Eliminar este workspace?')) return
    this.service.delete(uuid).subscribe(() => this.load())
  }
}
