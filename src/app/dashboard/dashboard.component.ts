import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService, ThemeMode } from '../shared/services/theme.service';
import { AuthService, User } from '../shared/services/auth.service';
import { TaskService } from '../shared/services/task.service';
import { NotificationService } from '../shared/services/notification.service';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { TaskModalComponent } from '../projects/task-modal/task-modal.component';
import { AIInsightsComponent } from '../shared/components/ai-insights/ai-insights.component';

import { Observable, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

// NGX-Charts imports
import { NgxChartsModule } from '@swimlane/ngx-charts';

export interface ChartData {
  name: string;
  value: number;
}

export interface MultiChartData {
  name: string;
  series: ChartData[];
}

// Color scheme interface for ngx-charts
export interface ColorScheme {
  domain: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule,
    ThemeToggleComponent,
    NgxChartsModule,
    AIInsightsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Dashboard Stats
  activeProjects = 0;
  tasksCompleted = 0;
  pomodorosToday = 0;
  journalEntries = 0;
  
  // Chart Configuration
  view: [number, number] = [600, 300];
  
  // Chart Data
  weeklyProductivityData: ChartData[] = [];
  multiData: MultiChartData[] = [];
  taskCategoryData: ChartData[] = [];
  pomodoroData: ChartData[] = [];
  
  // Chart Options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Day';
  showYAxisLabel = true;
  yAxisLabel = 'Tasks Completed';
  timeline = true;
  animations = true;
  
  // Color schemes - using direct domain arrays
  colorScheme: any = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  pomodoroColorScheme: any = {
    domain: ['#ff9800', '#ffc107', '#ffeb3b']
  };

  // User data
  currentUser$: Observable<User | null>;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    this.loadDashboardData();
    this.initializeCharts();
    this.loadTasks();
    this.setupDemoNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    // Load dashboard statistics
    this.activeProjects = 3;
    this.tasksCompleted = 15;
    this.pomodorosToday = 4;
    this.journalEntries = 2;
  }

  private initializeCharts() {
    // Initialize weekly productivity data
    this.weeklyProductivityData = [
      { name: 'Monday', value: 8 },
      { name: 'Tuesday', value: 6 },
      { name: 'Wednesday', value: 10 },
      { name: 'Thursday', value: 7 },
      { name: 'Friday', value: 9 },
      { name: 'Saturday', value: 4 },
      { name: 'Sunday', value: 3 }
    ];

    this.multiData = [
      {
        name: 'Tasks Completed',
        series: [...this.weeklyProductivityData]
      }
    ];

    // Initialize task category data
    this.taskCategoryData = [
      { name: 'Development', value: 12 },
      { name: 'Design', value: 8 },
      { name: 'Testing', value: 6 },
      { name: 'Planning', value: 4 },
      { name: 'Documentation', value: 3 },
      { name: 'Meetings', value: 2 }
    ];

    // Initialize pomodoro data
    this.pomodoroData = [
      { name: '9 AM', value: 1 },
      { name: '10 AM', value: 2 },
      { name: '11 AM', value: 1 },
      { name: '2 PM', value: 2 },
      { name: '3 PM', value: 1 },
      { name: '4 PM', value: 0 }
    ];
  }

  private loadTasks() {
    this.taskService.getTasks().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 });
        return [];
      })
    ).subscribe(tasks => {
      this.updateChartsWithRealData(tasks);
    });
  }

  private setupDemoNotifications() {
    // Add demo notifications to showcase the new system
    setTimeout(() => {
      this.notificationService.addSmartNotification({
        type: 'task',
        title: 'Task Due Soon',
        message: 'Your task "Complete UI Design" is due in 30 minutes',
        priority: 'high',
        dueTime: new Date(Date.now() + 30 * 60 * 1000),
        taskId: 'task-123',
        actions: [
          {
            id: 'view',
            label: 'View Task',
            icon: 'visibility',
            action: 'view-task',
            primary: true
          },
          {
            id: 'extend',
            label: 'Extend',
            icon: 'schedule',
            action: 'extend-deadline'
          }
        ]
      });
    }, 2000);

    setTimeout(() => {
      this.notificationService.addSmartNotification({
        type: 'meeting',
        title: 'Team Meeting',
        message: 'Daily standup meeting starts in 15 minutes',
        priority: 'medium',
        dueTime: new Date(Date.now() + 15 * 60 * 1000),
        actions: [
          {
            id: 'join',
            label: 'Join Meeting',
            icon: 'video_call',
            action: 'join-meeting',
            primary: true
          },
          {
            id: 'reschedule',
            label: 'Reschedule',
            icon: 'schedule',
            action: 'reschedule-meeting'
          }
        ]
      });
    }, 4000);

    setTimeout(() => {
      this.notificationService.addSmartNotification({
        type: 'break',
        title: 'Time for a Break',
        message: 'You\'ve been working for 2 hours. Take a 10-minute break!',
        priority: 'medium',
        actions: [
          {
            id: 'start-break',
            label: 'Start Break',
            icon: 'free_breakfast',
            action: 'start-break',
            primary: true
          },
          {
            id: 'remind-later',
            label: 'Remind Later',
            icon: 'schedule',
            action: 'remind-later'
          }
        ]
      });
    }, 6000);

    setTimeout(() => {
      this.notificationService.addSmartNotification({
        type: 'deadline',
        title: 'Project Deadline Alert',
        message: 'DevBoard project deadline is tomorrow at 5 PM',
        priority: 'urgent',
        dueTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        taskId: 'project-456',
        actions: [
          {
            id: 'review',
            label: 'Review Progress',
            icon: 'assessment',
            action: 'review-progress',
            primary: true
          },
          {
            id: 'request-extension',
            label: 'Request Extension',
            icon: 'schedule',
            action: 'request-extension'
          }
        ]
      });
    }, 8000);

    // Add a success notification
    setTimeout(() => {
      this.notificationService.showSuccess('AI Insights Updated', 'Your productivity analysis has been refreshed with new insights');
    }, 10000);
  }

  private updateChartsWithRealData(tasks: any[]) {
    // --- Update weekly productivity data ---
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: { [day: string]: number } = {};
    days.forEach(day => dayCounts[day] = 0);
    tasks.forEach(task => {
      if (task.status === 'done' && task.completedAt) {
        const date = new Date(task.completedAt);
        const dayName = days[date.getDay()];
        dayCounts[dayName]++;
      }
    });
    // Assign new array reference for change detection
    this.weeklyProductivityData = days.map(day => ({
      name: day,
      value: dayCounts[day]
    }));
    // Assign new reference to multiData and its series
    if (this.multiData.length > 0) {
      this.multiData = [
        {
          ...this.multiData[0],
          series: [...this.weeklyProductivityData]
        },
        ...this.multiData.slice(1)
      ];
    }
    // --- Update task category data as before ---
    const categoryMap = new Map<string, number>();
    tasks.forEach(task => {
      if (task.status === 'done') {
        let category = 'Development';
        if (task.title.toLowerCase().includes('design')) category = 'Design';
        else if (task.title.toLowerCase().includes('test')) category = 'Testing';
        else if (task.title.toLowerCase().includes('plan')) category = 'Planning';
        else if (task.title.toLowerCase().includes('doc')) category = 'Documentation';
        else if (task.title.toLowerCase().includes('meet')) category = 'Meetings';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });
    this.taskCategoryData = this.taskCategoryData.map(item => ({
      ...item,
      value: categoryMap.get(item.name) || 0
    }));
    this.cdr.detectChanges();
  }

  // Chart event handlers
  onSelect(event: any) {
    console.log('Chart selection:', event);
  }

  onActivate(event: any) {
    console.log('Chart activate:', event);
  }

  onDeactivate(event: any) {
    console.log('Chart deactivate:', event);
  }

  // User interaction methods
  getGreetingForUser(user: User | null): string {
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour < 12) {
      greeting = 'Good morning';
    } else if (currentHour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    return user ? `${greeting}, ${user.name}!` : `${greeting}!`;
  }

  getCurrentTheme(): ThemeMode {
    return this.themeService.getCurrentTheme();
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskModalComponent, {
      width: '500px',
      data: {
        isEdit: false,
        task: {}
      }
    });

          dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.taskService.addTask(result).subscribe(
            () => {
              this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
              this.loadTasks(); // Refresh the task list
            },
            (error: any) => {
              console.error('Error creating task:', error);
              this.snackBar.open('Failed to create task', 'Close', { duration: 3000 });
            }
          );
        }
      });
  }
}
