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

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.generateChartData();
    this.taskCategoryData = this.getTaskCategoryData();
    this.pomodoroData = this.getPomodoroData();
    
    // Only subscribe to task updates if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.subscribeToTaskUpdates();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToTaskUpdates() {
    // Subscribe to task counts for real-time updates
    this.taskService.getTodoTaskCount().pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.activeProjects = count;
    });

    this.taskService.getDoneTaskCount().pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.tasksCompleted = count;
    });

    // Subscribe to all tasks to update charts
    this.taskService.getTasks().pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      this.updateChartsWithRealData(tasks);
    });
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

  generateChartData() {
    // Use the same days array as updateChartsWithRealData
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.weeklyProductivityData = days.map((day) => ({
      name: day,
      value: 0 // Start with 0 tasks completed
    }));
    // Initialize multi-series data with zeros
    this.multiData = [
      {
        name: 'Tasks Completed',
        series: this.weeklyProductivityData
      },
      {
        name: 'Tasks Created',
        series: days.map((day) => ({
          name: day,
          value: 0 // Start with 0 tasks created
        }))
      }
    ];
  }

  // Initialize task categories with zero values
  getTaskCategoryData(): ChartData[] {
    return [
      { name: 'Development', value: 0 },
      { name: 'Testing', value: 0 },
      { name: 'Design', value: 0 },
      { name: 'Planning', value: 0 },
      { name: 'Documentation', value: 0 },
      { name: 'Meetings', value: 0 }
    ];
  }

  // Initialize pomodoro data with zero values
  getPomodoroData(): ChartData[] {
    const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    return hours.map(hour => ({
      name: hour,
      value: 0 // Start with 0 pomodoro sessions
    }));
  }

  // Methods to update data (ready for real implementation)
  updateTaskCompleted(day: string, category: string) {
    // Update weekly data
    const dayIndex = this.weeklyProductivityData.findIndex(d => d.name === day);
    if (dayIndex !== -1) {
      this.weeklyProductivityData[dayIndex].value++;
      this.multiData[0].series[dayIndex].value++;
    }

    // Update category data
    const categoryIndex = this.taskCategoryData.findIndex(c => c.name === category);
    if (categoryIndex !== -1) {
      this.taskCategoryData[categoryIndex].value++;
    }
  }

  updateTaskCreated(day: string) {
    // Update tasks created
    const dayIndex = this.multiData[1].series.findIndex(d => d.name === day);
    if (dayIndex !== -1) {
      this.multiData[1].series[dayIndex].value++;
    }
  }

  updatePomodoroSession(hour: string) {
    // Update pomodoro data
    const hourIndex = this.pomodoroData.findIndex(h => h.name === hour);
    if (hourIndex !== -1) {
      this.pomodoroData[hourIndex].value++;
    }
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

  getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.name : 'Developer';
  }

  getFullGreeting(): string {
    const greeting = this.getTimeBasedGreeting();
    const userName = this.getUserName();
    return `${greeting}, ${userName}! 👋`;
  }

  getGreetingForUser(user: User | null): string {
    const greeting = this.getTimeBasedGreeting();
    const userName = user ? user.name : 'Developer';
    return `${greeting}, ${userName}! 👋`;
  }

  // Chart Event Handlers
  onSelect(data: any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data: any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data: any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
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

  // Demo methods to show how to update stats (remove when implementing real functionality)
  simulateTaskCreation() {
    this.activeProjects = Math.max(1, this.activeProjects + 1);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    this.updateTaskCreated(today);
  }

  simulateTaskCompletion(category: string = 'Development') {
    this.tasksCompleted++;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    this.updateTaskCompleted(today, category);
  }

  simulatePomodoroSession() {
    this.pomodorosToday++;
    const currentHour = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    });
    this.updatePomodoroSession(currentHour);
  }

  simulateJournalEntry() {
    this.journalEntries++;
  }

  // Method to reset all stats (useful for testing)
  resetStats() {
    this.activeProjects = 0;
    this.tasksCompleted = 0;
    this.pomodorosToday = 0;
    this.journalEntries = 0;
    this.generateChartData();
    this.taskCategoryData = this.getTaskCategoryData();
    this.pomodoroData = this.getPomodoroData();
  }
}
