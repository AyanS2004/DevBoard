import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TaskModalComponent } from '../../projects/task-modal/task-modal.component';

interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  status: 'completed' | 'interrupted';
  taskId?: string;
  taskTitle?: string;
}

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatListModule, MatCardModule],
  templateUrl: './pomodoro-timer.component.html',
  styleUrls: ['./pomodoro-timer.component.scss']
})
export class PomodoroTimerComponent {
  totalSeconds = 25 * 60;
  secondsLeft = this.totalSeconds;
  isRunning = false;
  timerInterval: any;
  sessionCount = 0;
  completedCount = 0;
  sessionLog: PomodoroSession[] = [];
  currentSession: PomodoroSession | null = null;

  constructor(private dialog: MatDialog) {}

  get minutes() {
    return Math.floor(this.secondsLeft / 60);
  }
  get seconds() {
    return (this.secondsLeft % 60).toString().padStart(2, '0');
  }
  get progressOffset() {
    const progress = this.secondsLeft / this.totalSeconds;
    return 339.292 * (1 - progress);
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isRunning = true;
    this.sessionCount++;
    
    // Create new session
    this.currentSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      duration: this.totalSeconds,
      status: 'completed'
    };
    
    this.timerInterval = setInterval(() => {
      if (this.secondsLeft > 0) {
        this.secondsLeft--;
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    
    // Mark session as interrupted if it was running
    if (this.currentSession) {
      this.currentSession.status = 'interrupted';
      this.currentSession.endTime = new Date();
      this.currentSession.duration = this.totalSeconds - this.secondsLeft;
    }
  }

  completeSession() {
    this.pauseTimer();
    this.completedCount++;
    
    // Complete the current session
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.duration = this.totalSeconds;
      this.currentSession.status = 'completed';
      this.sessionLog.unshift(this.currentSession);
      this.currentSession = null;
    }
    
    this.secondsLeft = this.totalSeconds;
  }

  getSessionDisplayText(session: PomodoroSession): string {
    const startTime = session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = Math.floor(session.duration / 60);
    const status = session.status === 'completed' ? '✓ Completed' : '⏸ Interrupted';
    return `${startTime} - ${duration}min ${status}`;
  }

  openAddTaskDialog() {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '400px',
      data: { isEdit: false }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Add the new task to your pomodoro's task list
        console.log('New task created:', result);
      }
    });
  }
}
