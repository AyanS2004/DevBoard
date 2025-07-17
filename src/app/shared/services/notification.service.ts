import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationOptions {
  duration?: number;
  action?: string;
  actionLabel?: string;
  closable?: boolean;
  progressBar?: boolean;
  sound?: boolean;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  options?: NotificationOptions;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<ToastNotification[]>([]);
  private notificationId = 0;

  constructor() {}

  getNotifications(): Observable<ToastNotification[]> {
    return this.notifications$.asObservable();
  }

  showSuccess(message: string, options?: NotificationOptions): void {
    this.addNotification('success', 'Success', message, options);
  }

  showError(message: string, options?: NotificationOptions): void {
    this.addNotification('error', 'Error', message, options);
  }

  showWarning(message: string, options?: NotificationOptions): void {
    this.addNotification('warning', 'Warning', message, options);
  }

  showInfo(message: string, options?: NotificationOptions): void {
    this.addNotification('info', 'Info', message, options);
  }

  showNotification(title: string, message: string, priority: string): void {
    const type = this.priorityToType(priority);
    this.addNotification(type, title, message);
  }

  showAchievement(title: string, message: string, celebrate: boolean = false): void {
    this.addNotification('success', title, message, { duration: 8000, sound: true });
    
    if (celebrate) {
      this.triggerCelebration();
    }
  }

  private addNotification(type: ToastNotification['type'], title: string, message: string, options?: NotificationOptions): void {
    const notification: ToastNotification = {
      id: `notification-${++this.notificationId}`,
      type,
      title,
      message,
      timestamp: new Date(),
      options: {
        duration: 5000,
        closable: true,
        progressBar: true,
        sound: false,
        ...options
      }
    };

    const current = this.notifications$.value;
    this.notifications$.next([...current, notification]);

    // Auto-remove after duration
    if (notification.options?.duration) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.options.duration);
    }
  }

  removeNotification(id: string): void {
    const current = this.notifications$.value;
    const filtered = current.filter(n => n.id !== id);
    this.notifications$.next(filtered);
  }

  clearAll(): void {
    this.notifications$.next([]);
  }

  private priorityToType(priority: string): ToastNotification['type'] {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  private triggerCelebration(): void {
    // Trigger confetti or celebration animation
    // This would be implemented with a celebration library
    console.log('🎉 Celebration triggered!');
  }
} 