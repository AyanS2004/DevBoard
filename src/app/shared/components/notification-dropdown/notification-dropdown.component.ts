import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { NotificationService, SmartNotification } from '../../services/notification.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notifications: SmartNotification[] = [];
  unreadCount = 0;
  currentTime = new Date();
  
  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Subscribe to smart notifications
    this.notificationService.getSmartNotifications().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.read).length;
    });

    // Update current time every second
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getNotificationIcon(notification: SmartNotification): string {
    switch (notification.type) {
      case 'task':
        return 'assignment';
      case 'deadline':
        return 'schedule';
      case 'reminder':
        return 'notification_important';
      case 'meeting':
        return 'event';
      case 'break':
        return 'free_breakfast';
      default:
        return 'notifications';
    }
  }

  getNotificationColor(notification: SmartNotification): string {
    switch (notification.priority) {
      case 'urgent':
        return '#ff6b6b';
      case 'high':
        return '#feca57';
      case 'medium':
        return '#48dbfb';
      case 'low':
        return '#0abde3';
      default:
        return '#48dbfb';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'URGENT';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return 'NORMAL';
    }
  }

  formatTime(time: Date): string {
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  getTimeUntilDue(dueTime: Date): string {
    const now = new Date();
    const diff = dueTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Overdue';
    if (minutes < 1) return 'Due now';
    if (minutes < 60) return `${minutes}m remaining`;
    if (hours < 24) return `${hours}h remaining`;
    return `${days}d remaining`;
  }

  markAsRead(notification: SmartNotification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  handleNotificationAction(notification: SmartNotification, actionId: string): void {
    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;

    switch (action.action) {
      case 'view-task':
        this.viewTask(notification.taskId);
        break;
      case 'complete-task':
        this.completeTask(notification.taskId);
        break;
      case 'start-task':
        this.startTask(notification.taskId);
        break;
      case 'snooze-reminder':
        this.snoozeReminder(notification.id);
        break;
      case 'start-break':
        this.startBreak();
        break;
      case 'extend-deadline':
        this.extendDeadline(notification.taskId);
        break;
      case 'reschedule-task':
        this.rescheduleTask(notification.taskId);
        break;
      case 'remind-later':
        this.remindLater(notification.id);
        break;
      default:
        console.log('Unknown action:', action.action);
    }

    // Mark as read after action
    this.markAsRead(notification);
  }

  removeNotification(notification: SmartNotification): void {
    this.notificationService.removeSmartNotification(notification.id);
  }

  // Action handlers
  private viewTask(taskId: string | undefined): void {
    if (taskId) {
      // Navigate to task details
      console.log('Viewing task:', taskId);
    }
  }

  private completeTask(taskId: string | undefined): void {
    if (taskId) {
      // Mark task as complete
      console.log('Completing task:', taskId);
    }
  }

  private startTask(taskId: string | undefined): void {
    if (taskId) {
      // Start task/timer
      console.log('Starting task:', taskId);
    }
  }

  private snoozeReminder(notificationId: string): void {
    // Snooze reminder for 10 minutes
    console.log('Snoozing reminder:', notificationId);
  }

  private startBreak(): void {
    // Start break timer
    console.log('Starting break');
  }

  private extendDeadline(taskId: string | undefined): void {
    if (taskId) {
      // Open deadline extension dialog
      console.log('Extending deadline for task:', taskId);
    }
  }

  private rescheduleTask(taskId: string | undefined): void {
    if (taskId) {
      // Open task rescheduling dialog
      console.log('Rescheduling task:', taskId);
    }
  }

  private remindLater(notificationId: string): void {
    // Schedule reminder for later
    console.log('Remind later:', notificationId);
  }
} 