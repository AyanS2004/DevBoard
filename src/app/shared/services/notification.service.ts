import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

export interface SmartNotification {
  id: string;
  type: 'task' | 'deadline' | 'reminder' | 'meeting' | 'break';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  dueTime?: Date;
  read: boolean;
  taskId?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  primary?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<ToastNotification[]>([]);
  private smartNotifications$ = new BehaviorSubject<SmartNotification[]>([]);
  private notificationId = 0;
  private smartNotificationId = 0;
  private destroy$ = new BehaviorSubject<void>(undefined!);

  // Time-based notification settings
  private timeCheckInterval = 60000; // Check every minute
  private reminderThresholds = {
    urgent: 15, // 15 minutes
    high: 60,   // 1 hour
    medium: 240, // 4 hours
    low: 1440   // 24 hours
  };

  constructor() {
    this.startTimeBasedNotifications();
  }

  // Toast notifications
  getNotifications(): Observable<ToastNotification[]> {
    return this.notifications$.asObservable();
  }

  // Smart notifications
  getSmartNotifications(): Observable<SmartNotification[]> {
    return this.smartNotifications$.asObservable();
  }

  getUnreadCount(): number {
    return this.smartNotifications$.value.filter(n => !n.read).length;
  }

  // Toast notification methods
  showSuccess(title: string, message: string = '', options?: NotificationOptions): void {
    this.addNotification('success', title, message, options);
  }

  showError(title: string, message: string = '', options?: NotificationOptions): void {
    this.addNotification('error', title, message, { ...options, duration: 0 });
  }

  showWarning(title: string, message: string = '', options?: NotificationOptions): void {
    this.addNotification('warning', title, message, options);
  }

  showInfo(title: string, message: string = '', options?: NotificationOptions): void {
    this.addNotification('info', title, message, options);
  }

  showNotification(title: string, message: string, priority: string = 'medium'): void {
    const type = this.mapPriorityToType(priority);
    this.addNotification(type, title, message);
  }

  showAchievement(title: string, message: string, celebrate: boolean = false): void {
    this.addNotification('success', title, message, { 
      duration: celebrate ? 8000 : 5000,
      sound: celebrate 
    });
  }

  removeNotification(id: string): void {
    const current = this.notifications$.value;
    this.notifications$.next(current.filter(n => n.id !== id));
  }

  // Smart notification methods
  addSmartNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>): void {
    const smartNotification: SmartNotification = {
      id: `smart-${++this.smartNotificationId}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    const current = this.smartNotifications$.value;
    this.smartNotifications$.next([smartNotification, ...current]);

    // Show toast notification for high priority items
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      this.showNotification(notification.title, notification.message, notification.priority);
    }
  }

  markAsRead(id: string): void {
    const current = this.smartNotifications$.value;
    const updated = current.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.smartNotifications$.next(updated);
  }

  markAllAsRead(): void {
    const current = this.smartNotifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.smartNotifications$.next(updated);
  }

  removeSmartNotification(id: string): void {
    const current = this.smartNotifications$.value;
    this.smartNotifications$.next(current.filter(n => n.id !== id));
  }

  // Time-based notification system
  startTimeBasedNotifications(): void {
    interval(this.timeCheckInterval).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkTimeBasedNotifications();
    });
  }

  checkTimeBasedNotifications(): void {
    const now = new Date();
    this.checkTaskDeadlines(now);
    this.checkMeetingReminders(now);
    this.checkBreakReminders(now);
    this.checkCustomReminders(now);
  }

  // Task monitoring methods
  monitorTask(task: any): void {
    if (!task.dueDate) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff <= 0) {
      // Task is overdue
      this.addSmartNotification({
        type: 'deadline',
        title: 'Task Overdue',
        message: `"${task.title}" was due ${this.formatTimeAgo(Math.abs(minutesDiff))} ago`,
        priority: 'urgent',
        dueTime: dueDate,
        taskId: task.id,
        actions: [
          {
            id: 'complete',
            label: 'Mark Complete',
            icon: 'check',
            action: 'complete-task',
            primary: true
          },
          {
            id: 'extend',
            label: 'Extend Deadline',
            icon: 'schedule',
            action: 'extend-deadline'
          }
        ]
      });
    } else if (minutesDiff <= this.reminderThresholds.urgent) {
      // Urgent reminder
      this.addSmartNotification({
        type: 'deadline',
        title: 'Urgent Task Due Soon',
        message: `"${task.title}" is due in ${this.formatTimeRemaining(minutesDiff)}`,
        priority: 'urgent',
        dueTime: dueDate,
        taskId: task.id,
        actions: [
          {
            id: 'start',
            label: 'Start Task',
            icon: 'play_arrow',
            action: 'start-task',
            primary: true
          },
          {
            id: 'reschedule',
            label: 'Reschedule',
            icon: 'schedule',
            action: 'reschedule-task'
          }
        ]
      });
    } else if (minutesDiff <= this.reminderThresholds.high) {
      // High priority reminder
      this.addSmartNotification({
        type: 'reminder',
        title: 'Task Due Soon',
        message: `"${task.title}" is due in ${this.formatTimeRemaining(minutesDiff)}`,
        priority: 'high',
        dueTime: dueDate,
        taskId: task.id,
        actions: [
          {
            id: 'view',
            label: 'View Task',
            icon: 'visibility',
            action: 'view-task',
            primary: true
          }
        ]
      });
    }
  }

  // Parse task description for time mentions
  parseTaskTimeReferences(task: any): void {
    if (!task.description) return;

    const timePatterns = [
      /at (\d{1,2}):(\d{2})\s*(am|pm)/gi,
      /at (\d{1,2})\s*(am|pm)/gi,
      /(\d{1,2}):(\d{2})\s*(am|pm)/gi,
      /meeting at (\d{1,2}):(\d{2})/gi,
      /call at (\d{1,2}):(\d{2})/gi,
      /deadline (\d{1,2}):(\d{2})/gi
    ];

    const description = task.description.toLowerCase();
    
    timePatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          const timeReference = this.extractTimeFromMatch(match);
          if (timeReference) {
            this.scheduleTimeBasedReminder(task, timeReference, match);
          }
        });
      }
    });
  }

  private extractTimeFromMatch(match: string): Date | null {
    const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)/i;
    const result = match.match(timeRegex);
    
    if (!result) return null;

    const hours = parseInt(result[1]);
    const minutes = parseInt(result[2] || '0');
    const isPM = result[3]?.toLowerCase() === 'pm';
    
    const now = new Date();
    const timeReference = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let adjustedHours = hours;
    if (isPM && hours !== 12) adjustedHours += 12;
    if (!isPM && hours === 12) adjustedHours = 0;
    
    timeReference.setHours(adjustedHours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (timeReference < now) {
      timeReference.setDate(timeReference.getDate() + 1);
    }
    
    return timeReference;
  }

  private scheduleTimeBasedReminder(task: any, timeReference: Date, matchedText: string): void {
    const now = new Date();
    const timeDiff = timeReference.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    if (minutesDiff > 0 && minutesDiff <= this.reminderThresholds.high) {
      this.addSmartNotification({
        type: 'reminder',
        title: 'Time-Based Reminder',
        message: `"${task.title}" mentions "${matchedText}" - ${this.formatTimeRemaining(minutesDiff)}`,
        priority: minutesDiff <= 30 ? 'high' : 'medium',
        dueTime: timeReference,
        taskId: task.id,
        actions: [
          {
            id: 'view',
            label: 'View Task',
            icon: 'visibility',
            action: 'view-task',
            primary: true
          },
          {
            id: 'snooze',
            label: 'Snooze 10min',
            icon: 'snooze',
            action: 'snooze-reminder'
          }
        ]
      });
    }
  }

  // Check different types of time-based notifications
  private checkTaskDeadlines(now: Date): void {
    // This would typically get tasks from a service
    // For now, it's a placeholder for integration
  }

  private checkMeetingReminders(now: Date): void {
    // Check for upcoming meetings
  }

  private checkBreakReminders(now: Date): void {
    // Check if user needs a break based on work patterns
    const workSession = this.getWorkSessionDuration();
    if (workSession > 120) { // 2 hours of continuous work
      this.addSmartNotification({
        type: 'break',
        title: 'Time for a Break',
        message: `You've been working for ${Math.floor(workSession / 60)} hours. Take a 10-minute break!`,
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
            label: 'Remind in 30min',
            icon: 'schedule',
            action: 'remind-later'
          }
        ]
      });
    }
  }

  private checkCustomReminders(now: Date): void {
    // Check for custom user-defined reminders
  }

  // Helper methods
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

  private mapPriorityToType(priority: string): ToastNotification['type'] {
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

  private formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  private formatTimeAgo(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  private getWorkSessionDuration(): number {
    // Mock implementation - would track actual work time
    return 150; // 2.5 hours
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 