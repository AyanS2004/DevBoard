import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number; // in minutes
  completionRate: number; // percentage
  todaySessions: number;
  thisWeekSessions: number;
}

@Component({
  selector: 'app-pomodoro-log',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule, MatDividerModule],
  templateUrl: './pomodoro-log.component.html',
  styleUrl: './pomodoro-log.component.scss'
})
export class PomodoroLogComponent implements OnInit {
  stats: PomodoroStats = {
    totalSessions: 0,
    completedSessions: 0,
    interruptedSessions: 0,
    totalFocusTime: 0,
    averageSessionLength: 0,
    completionRate: 0,
    todaySessions: 0,
    thisWeekSessions: 0
  };

  ngOnInit() {
    this.calculateStats();
  }

  private calculateStats() {
    // TODO: Replace with actual data from service
    // For now, using placeholder data
    this.stats = {
      totalSessions: 12,
      completedSessions: 10,
      interruptedSessions: 2,
      totalFocusTime: 300, // 5 hours
      averageSessionLength: 25,
      completionRate: 83.3,
      todaySessions: 3,
      thisWeekSessions: 8
    };
  }

  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}
