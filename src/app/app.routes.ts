import { Routes } from '@angular/router';
import { WorkspaceListComponent } from './pages/workspace-list/workspace-list';
import { WorkspaceDetailComponent } from './pages/workspace-detail/workspace-detail';
import { DocumentDetailComponent } from './pages/document-detail/document-detail';
import { RelationViewComponent } from './pages/relation-view/relation-view';

export const routes: Routes = [
  { path: '', redirectTo: '/workspaces', pathMatch: 'full' },
  { path: 'workspaces', component: WorkspaceListComponent },
  { path: 'workspaces/:id', component: WorkspaceDetailComponent },
  { path: 'documents/:id', component: DocumentDetailComponent },
  { path: 'relations', component: RelationViewComponent },
];
