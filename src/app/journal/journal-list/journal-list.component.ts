import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TaskModalComponent } from '../../projects/task-modal/task-modal.component';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './journal-list.component.html',
  styleUrl: './journal-list.component.scss'
})
export class JournalListComponent {
  journalEntries = [
    { date: '2024-06-01', content: 'Started the DevBoard project. Set up Angular and Material.' },
    { date: '2024-06-02', content: 'Designed the dashboard and project board UI.' },
    { date: '2024-06-03', content: 'Implemented journal timeline view.' }
  ];

  constructor(private dialog: MatDialog) {}

  openAddTaskDialog() {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '400px',
      data: { isEdit: false }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Add the new task to your journal's task list
      }
    });
  }
}
