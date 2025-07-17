import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../services/task.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  todoTaskCount$: Observable<number>;
  inProgressTaskCount$: Observable<number>;
  doneTaskCount$: Observable<number>;
  totalTaskCount$: Observable<number>;

  // For template display
  todoTaskCount = 0;
  inProgressTaskCount = 0;
  doneTaskCount = 0;
  totalTaskCount = 0;

  constructor(private taskService: TaskService) {
    this.todoTaskCount$ = this.taskService.getTodoTaskCount();
    this.inProgressTaskCount$ = this.taskService.getInProgressTaskCount();
    this.doneTaskCount$ = this.taskService.getDoneTaskCount();
    this.totalTaskCount$ = this.taskService.getTaskCount();
  }

  ngOnInit() {
    // Subscribe to task counts for real-time updates
    this.todoTaskCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.todoTaskCount = count;
    });

    this.inProgressTaskCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.inProgressTaskCount = count;
    });

    this.doneTaskCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.doneTaskCount = count;
    });

    this.totalTaskCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.totalTaskCount = count;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
