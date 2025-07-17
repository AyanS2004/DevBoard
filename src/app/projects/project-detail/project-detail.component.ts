import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { TaskModalComponent } from '../task-modal/task-modal.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent {
  project = {
    name: 'DevBoard Development',
    dueDate: 'Dec 31, 2024',
    team: '3 Members',
    tasks: [
      { title: 'Setup Angular project structure', completed: true },
      { title: 'Implement authentication system', completed: false },
      { title: 'Create dashboard components', completed: true },
      { title: 'Add project management features', completed: false },
      { title: 'Implement journal functionality', completed: false }
    ]
  };

  constructor(private dialog: MatDialog) {}

  openAddTaskDialog() {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '400px',
      data: { isEdit: false }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Add the new task to your project detail's task list
      }
    });
  }
}
