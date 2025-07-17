import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, moveItemInArray, transferArrayItem, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { TaskService, Task } from '../../shared/services/task.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Only subscribe to tasks if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.subscribeToTasks();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToTasks() {
    // Subscribe to tasks and filter by status
    this.taskService.getTasks().pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      this.todoTasks = tasks.filter(task => task.status === 'todo');
      this.inProgressTasks = tasks.filter(task => task.status === 'inProgress');
      this.doneTasks = tasks.filter(task => task.status === 'done');
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Get the task that was moved
      const movedTask = event.previousContainer.data[event.previousIndex];
      
      // Determine new status based on container
      let newStatus: 'todo' | 'inProgress' | 'done';
      if (event.container.data === this.todoTasks) {
        newStatus = 'todo';
      } else if (event.container.data === this.inProgressTasks) {
        newStatus = 'inProgress';
      } else {
        newStatus = 'done';
      }

      // Update task status in service
      if (movedTask._id || movedTask.id) {
        const taskId = movedTask._id || movedTask.id;
        this.taskService.moveTask(taskId!, newStatus).pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.snackBar.open('Failed to move task', 'Close', { duration: 3000 });
            return [];
          })
        ).subscribe();
      }
    }
  }

  openAddTaskDialog() {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '500px',
      data: { isEdit: false }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.addTask({
          title: result.title,
          description: result.description,
          priority: result.priority || 'medium',
          status: result.status || 'todo',
          dueDate: result.dueDate
        }).pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
            return [];
          })
        ).subscribe(() => {
          this.snackBar.open('Task created successfully', 'Close', { duration: 2000 });
        });
      }
    });
  }

  editTask(task: Task) {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '500px',
      data: { 
        isEdit: true, 
        task: { ...task } // Pass a copy to avoid direct mutation
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && (task._id || task.id)) {
        const taskId = task._id || task.id;
        this.taskService.updateTask(taskId!, {
          title: result.title,
          description: result.description,
          priority: result.priority,
          status: result.status,
          dueDate: result.dueDate
        }).pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
            return [];
          })
        ).subscribe(() => {
          this.snackBar.open('Task updated successfully', 'Close', { duration: 2000 });
        });
      }
    });
  }

  deleteTask(task: Task) {
    if ((task._id || task.id) && confirm(`Are you sure you want to delete "${task.title}"?`)) {
      const taskId = task._id || task.id;
      this.taskService.deleteTask(taskId!).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 });
          return [];
        })
      ).subscribe(() => {
        this.snackBar.open('Task deleted successfully', 'Close', { duration: 2000 });
      });
    }
  }

  // Prevent drag when clicking action buttons
  onTaskActionClick(event: Event) {
    event.stopPropagation();
  }
}
