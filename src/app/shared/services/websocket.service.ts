import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, fromEvent, merge } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  connectionAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    connectionAttempts: 0
  });
  
  private messages$ = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Real-time event subjects
  private taskUpdates$ = new Subject<any>();
  private projectUpdates$ = new Subject<any>();
  private pomodoroUpdates$ = new Subject<any>();
  private notifications$ = new Subject<any>();
  private achievements$ = new Subject<any>();
  private userActivity$ = new Subject<any>();
  private typingIndicators$ = new Subject<any>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('No user authenticated, skipping WebSocket connection');
      return;
    }

    this.socket = io(environment.apiUrl, {
      auth: {
        token: localStorage.getItem('token')
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000
    });

    this.setupEventListeners();
    this.joinUserRoom(user.id);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus({
        connected: true,
        reconnecting: false,
        lastConnected: new Date(),
        connectionAttempts: this.reconnectAttempts
      });
      
      // Show success notification
      this.notificationService.showSuccess('Real-time connection established');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.updateConnectionStatus({
        connected: false,
        reconnecting: reason === 'io client disconnect' ? false : true,
        connectionAttempts: this.reconnectAttempts
      });
      
      if (reason !== 'io client disconnect') {
        this.notificationService.showWarning('Connection lost. Attempting to reconnect...');
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.updateConnectionStatus({
        connected: false,
        reconnecting: this.reconnectAttempts < this.maxReconnectAttempts,
        connectionAttempts: this.reconnectAttempts
      });
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.notificationService.showError('Failed to establish real-time connection');
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.notificationService.showSuccess('Connection restored');
    });

    // Real-time data events
    this.socket.on('task-update', (data: any) => {
      this.taskUpdates$.next(data);
      this.emitMessage('task-update', data);
    });

    this.socket.on('project-update', (data: any) => {
      this.projectUpdates$.next(data);
      this.emitMessage('project-update', data);
    });

    this.socket.on('comment-added', (data: any) => {
      this.emitMessage('comment-added', data);
      this.notificationService.showInfo(`New comment: ${data.content.substring(0, 50)}...`);
    });

    this.socket.on('user-joined-project', (data: any) => {
      this.userActivity$.next(data);
      this.emitMessage('user-joined-project', data);
    });

    this.socket.on('user-typing', (data: any) => {
      this.typingIndicators$.next({ ...data, typing: true });
    });

    this.socket.on('user-stopped-typing', (data: any) => {
      this.typingIndicators$.next({ ...data, typing: false });
    });

    // Pomodoro events
    this.socket.on('pomodoro-notification', (data) => {
      this.pomodoroUpdates$.next(data);
      this.emitMessage('pomodoro-notification', data);
      
      if (data.type === 'completed') {
        this.notificationService.showSuccess(
          `🍅 Pomodoro completed! Session ${data.sessionNumber}`,
          { duration: 5000 }
        );
      }
    });

    // Notification events
    this.socket.on('notification', (data) => {
      this.notifications$.next(data);
      this.emitMessage('notification', data);
      
      // Show toast notification
      this.notificationService.showNotification(data.title, data.message, data.priority);
    });

    this.socket.on('achievement', (data) => {
      this.achievements$.next(data);
      this.emitMessage('achievement', data);
      
      // Show special achievement notification
      this.notificationService.showAchievement(
        data.notification.title,
        data.notification.message,
        data.celebrate
      );
    });

    this.socket.on('notification-read', (data) => {
      this.emitMessage('notification-read', data);
    });

    this.socket.on('notifications-read-all', () => {
      this.emitMessage('notifications-read-all', {});
    });

    this.socket.on('notification-deleted', (data) => {
      this.emitMessage('notification-deleted', data);
    });
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connectionStatus$.value;
    this.connectionStatus$.next({ ...currentStatus, ...status });
  }

  private emitMessage(type: string, data: any): void {
    this.messages$.next({
      type,
      data,
      timestamp: new Date()
    });
  }

  // Public methods
  
  connect(): void {
    if (!this.socket || !this.socket.connected) {
      this.initializeConnection();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  getMessages(): Observable<WebSocketMessage> {
    return this.messages$.asObservable();
  }

  // Room management
  joinUserRoom(userId: string): void {
    this.emit('join-user-room', userId);
  }

  joinProject(projectId: string): void {
    this.emit('join-project', projectId);
  }

  leaveProject(projectId: string): void {
    this.emit('leave-project', projectId);
  }

  // Real-time data streams
  getTaskUpdates(): Observable<any> {
    return this.taskUpdates$.asObservable();
  }

  getProjectUpdates(): Observable<any> {
    return this.projectUpdates$.asObservable();
  }

  getPomodoroUpdates(): Observable<any> {
    return this.pomodoroUpdates$.asObservable();
  }

  getNotifications(): Observable<any> {
    return this.notifications$.asObservable();
  }

  getAchievements(): Observable<any> {
    return this.achievements$.asObservable();
  }

  getUserActivity(): Observable<any> {
    return this.userActivity$.asObservable();
  }

  getTypingIndicators(): Observable<any> {
    return this.typingIndicators$.asObservable();
  }

  // Emit events
  updateTask(data: any): void {
    this.emit('task-updated', data);
  }

  updateProject(data: any): void {
    this.emit('project-updated', data);
  }

  addComment(data: any): void {
    this.emit('new-comment', data);
  }

  startTyping(projectId: string, userName: string): void {
    this.emit('typing-start', { projectId, userName });
  }

  stopTyping(projectId: string): void {
    this.emit('typing-stop', { projectId });
  }

  startPomodoro(data: any): void {
    this.emit('pomodoro-started', data);
  }

  completePomodoro(data: any): void {
    this.emit('pomodoro-completed', data);
  }

  sendNotification(data: any): void {
    this.emit('send-notification', data);
  }

  // Generic emit method
  emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: WebSocket not connected`);
    }
  }

  // Utility methods
  
  /**
   * Subscribe to specific message types
   */
  onMessage(type: string): Observable<any> {
    return this.messages$.pipe(
      // filter((message) => message.type === type),
      // map((message) => message.data)
    );
  }

  /**
   * Get connection quality indicator
   */
  getConnectionQuality(): Observable<'excellent' | 'good' | 'poor' | 'disconnected'> {
    return this.connectionStatus$.pipe(
      // map((status) => {
      //   if (!status.connected) return 'disconnected';
      //   if (status.connectionAttempts === 0) return 'excellent';
      //   if (status.connectionAttempts < 3) return 'good';
      //   return 'poor';
      // })
    );
  }

  /**
   * Ping server to check connection
   */
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime);
      
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket.once('pong', (timestamp) => {
        clearTimeout(timeout);
        const latency = Date.now() - timestamp;
        resolve(latency);
      });
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.connectionStatus$.complete();
    this.messages$.complete();
    this.taskUpdates$.complete();
    this.projectUpdates$.complete();
    this.pomodoroUpdates$.complete();
    this.notifications$.complete();
    this.achievements$.complete();
    this.userActivity$.complete();
    this.typingIndicators$.complete();
  }
} 