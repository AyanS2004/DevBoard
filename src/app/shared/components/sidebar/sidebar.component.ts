import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { AuthService, User } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { Observable, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule,
    ThemeToggleComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Task counts
  todoCount = 0;
  inProgressCount = 0;
  doneCount = 0;
  totalCount = 0;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Only subscribe to task counts if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.subscribeToTaskCounts();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToTaskCounts() {
    // Subscribe to individual task counts
    this.taskService.getTodoTaskCount().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error getting todo count:', error);
        // Only show error if it's not an authentication error
        if (error.status !== 401) {
          this.snackBar.open('Failed to load task counts', 'Close', { duration: 3000 });
        }
        return [];
      })
    ).subscribe(count => {
      this.todoCount = count;
    });

    this.taskService.getInProgressTaskCount().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error getting in-progress count:', error);
        return [];
      })
    ).subscribe(count => {
      this.inProgressCount = count;
    });

    this.taskService.getDoneTaskCount().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error getting done count:', error);
        return [];
      })
    ).subscribe(count => {
      this.doneCount = count;
    });

    this.taskService.getTaskCount().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error getting total count:', error);
        return [];
      })
    ).subscribe(count => {
      this.totalCount = count;
    });
  }

  get currentTheme$() {
    return this.themeService.theme$;
  }

  get currentUser$(): Observable<User | null> {
    return this.authService.currentUser$;
  }

  getCurrentTheme(): ThemeMode {
    return this.themeService.getCurrentTheme();
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.name : 'Developer';
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user || !user.name) return 'D';
    
    return user.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUserAvatar(): string {
    // For now, return empty string since User interface doesn't have avatar
    // This can be extended later when avatar functionality is added
    return '';
  }

  logout() {
    this.authService.logout();
  }
} 