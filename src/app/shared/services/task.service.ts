import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inProgress' | 'done';
  dueDate?: Date;
  createdAt?: Date;
  completedAt?: Date;
  user?: string;
  project?: string;
  tags?: string[];
  category?: string;
  estimatedTime?: number;
  actualTime?: number;
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private countsSubject = new BehaviorSubject<TaskCounts>({
    todo: 0,
    inProgress: 0,
    done: 0,
    total: 0
  });

  public tasks$ = this.tasksSubject.asObservable();
  public counts$ = this.countsSubject.asObservable();

  private apiUrl = environment.apiUrl || 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only load tasks if we're in a browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
      
      // Listen for login events to reload tasks
      window.addEventListener('userLoggedIn', () => {
        this.loadTasks();
      });
    }
  }

  private getHeaders(): HttpHeaders {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any) {
    console.error('Task service error:', error);
    return throwError(() => error);
  }

  // Load tasks from database
  private loadTasks() {
    // Only make HTTP request if we're in browser and have a token
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // No token means user is not authenticated, don't load tasks
      return;
    }

    this.http.get<Task[]>(`${this.apiUrl}/tasks/user`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      )
      .subscribe({
        next: (tasks) => {
          this.tasksSubject.next(tasks);
          this.updateCounts();
        },
        error: (error) => {
          console.error('Failed to load tasks:', error);
          // Don't show error if user is not authenticated
          if (error.status !== 401) {
            console.error('Task loading error:', error);
          }
        }
      });
  }

  // Update counts based on current tasks
  private updateCounts() {
    const tasks = this.tasksSubject.value;
    const counts: TaskCounts = {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'inProgress').length,
      done: tasks.filter(t => t.status === 'done').length,
      total: tasks.length
    };
    this.countsSubject.next(counts);
  }

  // Get all tasks
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  // Get tasks by status
  getTasksByStatus(status: 'todo' | 'inProgress' | 'done'): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.status === status))
    );
  }

  // Get task counts
  getTaskCount(): Observable<number> {
    return this.counts$.pipe(map(counts => counts.total));
  }

  getTodoTaskCount(): Observable<number> {
    return this.counts$.pipe(map(counts => counts.todo));
  }

  getInProgressTaskCount(): Observable<number> {
    return this.counts$.pipe(map(counts => counts.inProgress));
  }

  getDoneTaskCount(): Observable<number> {
    return this.counts$.pipe(map(counts => counts.done));
  }

  // Add new task
  addTask(task: Omit<Task, '_id' | 'id' | 'createdAt'>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/user`, task, { headers: this.getHeaders() })
      .pipe(
        tap(newTask => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([newTask, ...currentTasks]);
          this.updateCounts();
        }),
        catchError(this.handleError)
      );
  }

  // Update task
  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/user/${id}`, updates, { headers: this.getHeaders() })
      .pipe(
        tap(updatedTask => {
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.map(task => 
            task._id === id || task.id === id ? updatedTask : task
          );
          this.tasksSubject.next(updatedTasks);
          this.updateCounts();
        }),
        catchError(this.handleError)
      );
  }

  // Delete task
  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/user/${id}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          const filteredTasks = currentTasks.filter(task => 
            task._id !== id && task.id !== id
          );
          this.tasksSubject.next(filteredTasks);
          this.updateCounts();
        }),
        catchError(this.handleError)
      );
  }

  // Move task to different status
  moveTask(taskId: string, newStatus: 'todo' | 'inProgress' | 'done'): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/user/${taskId}/move`, 
      { status: newStatus }, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(task => 
          task._id === taskId || task.id === taskId ? updatedTask : task
        );
        this.tasksSubject.next(updatedTasks);
        this.updateCounts();
      }),
      catchError(this.handleError)
    );
  }

  // Get task by ID
  getTaskById(id: string): Task | undefined {
    return this.tasksSubject.value.find(task => task._id === id || task.id === id);
  }

  // Refresh tasks from server
  refreshTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/user`, { headers: this.getHeaders() })
      .pipe(
        tap(tasks => {
          this.tasksSubject.next(tasks);
          this.updateCounts();
        }),
        catchError(this.handleError)
      );
  }

  // Method to manually trigger task loading (useful after login)
  initializeTasks() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTasks();
    }
  }
} 