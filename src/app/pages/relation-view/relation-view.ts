import { Component, signal, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RelationService } from '../../services/relation.service'
import { Relation, RelationType } from '../../models/relation.model'

@Component({
  selector: 'app-relation-view',
  imports: [FormsModule],
  templateUrl: './relation-view.html',
  styleUrl: './relation-view.scss',
})
export class RelationViewComponent implements OnInit {
  relations = signal<Relation[]>([])
  relationTypes = signal<RelationType[]>([])
  loading = signal(true)
  selectedType = signal<string | null>(null)

  showForm = signal(false)
  formSource = ''
  formTarget = ''
  formType = ''
  formConfidence = 1.0

  constructor(private service: RelationService) {}

  ngOnInit() {
    this.service.listTypes().subscribe((types) => this.relationTypes.set(types))
    this.load()
  }

  load() {
    this.loading.set(true)
    this.service.list().subscribe({
      next: (data) => this.relations.set(data),
      complete: () => this.loading.set(false),
    })
  }

  filterByType(tag: string | null) {
    this.selectedType.set(tag)
    if (tag) {
      this.service.list(undefined, undefined, tag).subscribe((data) => this.relations.set(data))
    } else {
      this.load()
    }
  }

  startCreate() {
    this.formSource = ''
    this.formTarget = ''
    this.formType = ''
    this.formConfidence = 1.0
    this.showForm.set(true)
  }

  cancelForm() { this.showForm.set(false) }

  create() {
    if (!this.formSource || !this.formTarget || !this.formType) return
    this.service.create({
      source_uuid: this.formSource,
      target_uuid: this.formTarget,
      relation_type: this.formType,
      confidence: this.formConfidence,
    }).subscribe({
      next: () => { this.cancelForm(); this.load(); },
    })
  }

  delete(uuid: string) {
    if (!confirm('¿Eliminar esta relación?')) return
    this.service.delete(uuid).subscribe(() => this.load())
  }

  typeLabel(tag: string): string {
    return this.relationTypes().find((t) => t.tag === tag)?.label ?? tag
  }
}
