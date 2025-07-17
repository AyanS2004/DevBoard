import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-journal-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatListModule, MatCardModule],
  templateUrl: './journal-calendar.component.html',
  styleUrl: './journal-calendar.component.scss'
})
export class JournalCalendarComponent {
  selectedDate: Date = new Date('2024-06-01');
  journalEntries = [
    { date: '2024-06-01', content: 'Started the DevBoard project. Set up Angular and Material.' },
    { date: '2024-06-02', content: 'Designed the dashboard and project board UI.' },
    { date: '2024-06-03', content: 'Implemented journal timeline view.' }
  ];

  get entriesForSelectedDate() {
    const dateStr = this.selectedDate.toISOString().slice(0, 10);
    return this.journalEntries.filter(e => e.date === dateStr);
  }
}
