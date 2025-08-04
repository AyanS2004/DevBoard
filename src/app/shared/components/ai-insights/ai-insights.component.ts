import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';
import { AIService, AIInsight, ProductivityInsights, AIAnalysisData } from '../../services/ai.service';
import { TaskService } from '../../services/task.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SmartSuggestion {
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChartData {
  name: string;
  value: number;
}

interface TrendData {
  name: string;
  series: ChartData[];
}

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    MatButtonToggleModule,
    NgxChartsModule
  ],
  templateUrl: './ai-insights.component.html',
  styleUrls: ['./ai-insights.component.scss']
})
export class AIInsightsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  insights: ProductivityInsights | null = null;
  recommendations: AIInsight[] = [];
  loading = true;
  error = false;
  selectedTrendPeriod = 'week';
  selectedActivityPeriod = 'today';

  // Focus session tracking
  currentFocusSession: any = null;
  focusSessionsToday = 2;
  totalFocusTimeToday = 145; // minutes

  // Color schemes for charts
  burnoutColorScheme: any = {
    domain: ['#ff6b6b', '#feca57', '#48dbfb', '#0abde3']
  };

  trendColorScheme: any = {
    domain: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
  };

  categoryColorScheme: any = {
    domain: ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f']
  };

  sentimentColorScheme: any = {
    domain: ['#a8edea', '#fed6e3', '#ffeaa7', '#74b9ff', '#fd79a8']
  };

  constructor(
    private aiService: AIService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.loadInsights();
    
    // Refresh insights every 5 minutes
    interval(300000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadInsights();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsights() {
    this.loading = true;
    this.error = false;
    
    console.log('Loading AI insights...');
    
    this.aiService.aiData$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: AIAnalysisData | null) => {
        console.log('Received AI data:', data);
        if (data) {
          this.insights = data.insights;
          this.recommendations = data.recommendations;
          this.loading = false;
          console.log('Insights loaded:', this.insights);
          console.log('Recommendations loaded:', this.recommendations);
        } else {
          console.log('No data received, triggering refresh...');
          // If no data, trigger refresh
          this.refreshInsights();
        }
      },
      error: (error: any) => {
        console.error('Failed to load AI insights:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  refreshInsights() {
    this.loading = true;
    this.error = false;
    
    this.aiService.refreshAIData().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: AIAnalysisData) => {
        this.insights = data.insights;
        this.recommendations = data.recommendations;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to refresh AI insights:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // Helper methods for the template
  getCompletionRateColor(rate: number): string {
    if (rate >= 80) return 'primary';
    if (rate >= 60) return 'accent';
    return 'warn';
  }

  getBurnoutColor(risk: number): string {
    if (risk >= 70) return '#ff6b6b';
    if (risk >= 50) return '#feca57';
    if (risk >= 30) return '#48dbfb';
    return '#0abde3';
  }

  getBurnoutStatus(risk: number): string {
    if (risk >= 70) return 'High Risk - Take Action';
    if (risk >= 50) return 'Medium Risk - Monitor';
    if (risk >= 30) return 'Low Risk - Maintain';
    return 'Optimal - Great Job!';
  }

  getWorkloadPressure(): number {
    if (!this.insights) return 0;
    // Calculate workload pressure based on task count and completion rate
    const taskLoad = Math.min(100, (this.insights.totalTasks / 20) * 100);
    const completionFactor = (100 - this.insights.completionRate) / 2;
    return Math.min(100, taskLoad + completionFactor);
  }

  getDeadlineStress(): number {
    if (!this.insights) return 0;
    // Mock calculation for deadline stress
    return Math.min(100, this.insights.burnoutRisk * 0.8);
  }

  getWorkLifeBalance(): number {
    if (!this.insights) return 80;
    // Mock calculation for work-life balance
    return Math.max(20, 100 - this.insights.burnoutRisk);
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getCategoryEntries(stats: { [key: string]: number }): Array<{ key: string; value: number }> {
    return Object.entries(stats).map(([key, value]) => ({ key, value }));
  }

  getCategoryPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  getInsightColor(type: string): string {
    const colors = {
      'productivity': '#4facfe',
      'focus': '#43e97b',
      'health': '#ff6b6b',
      'recommendation': '#feca57'
    };
    return colors[type as keyof typeof colors] || '#4facfe';
  }

  getInsightIcon(type: string): string {
    const icons = {
      'productivity': 'trending_up',
      'focus': 'center_focus_strong',
      'health': 'favorite',
      'recommendation': 'lightbulb'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getPriorityColor(priority: string): string {
    const colors = {
      'high': '#ff6b6b',
      'medium': '#feca57',
      'low': '#48dbfb'
    };
    return colors[priority as keyof typeof colors] || '#48dbfb';
  }

  getTrendData(): TrendData[] {
    // Mock trend data based on selected period
    const weekData = [
      { name: 'Mon', value: 85 },
      { name: 'Tue', value: 78 },
      { name: 'Wed', value: 92 },
      { name: 'Thu', value: 88 },
      { name: 'Fri', value: 95 },
      { name: 'Sat', value: 70 },
      { name: 'Sun', value: 65 }
    ];

    const monthData = [
      { name: 'Week 1', value: 82 },
      { name: 'Week 2', value: 87 },
      { name: 'Week 3', value: 91 },
      { name: 'Week 4', value: 85 }
    ];

    const yearData = [
      { name: 'Jan', value: 78 },
      { name: 'Feb', value: 82 },
      { name: 'Mar', value: 85 },
      { name: 'Apr', value: 88 },
      { name: 'May', value: 92 },
      { name: 'Jun', value: 89 }
    ];

    const dataMap = {
      'week': weekData,
      'month': monthData,
      'year': yearData
    };

    return [{
      name: 'Productivity',
      series: dataMap[this.selectedTrendPeriod as keyof typeof dataMap]
    }];
  }

  getCategoryData(): ChartData[] {
    if (!this.insights || !this.insights.categoryStats || Object.keys(this.insights.categoryStats).length === 0) {
      // Return default category data when no real data is available
      return [
        { name: 'Development', value: 12 },
        { name: 'Design', value: 8 },
        { name: 'Testing', value: 6 },
        { name: 'Planning', value: 4 },
        { name: 'Documentation', value: 3 },
        { name: 'Meetings', value: 2 }
      ];
    }
    
    return Object.entries(this.insights.categoryStats).map(([key, value]) => ({
      name: key,
      value: value
    }));
  }

  getCurrentMoodIcon(): string {
    const moodScore = this.getMoodScore();
    if (moodScore >= 80) return 'sentiment_very_satisfied';
    if (moodScore >= 60) return 'sentiment_satisfied';
    if (moodScore >= 40) return 'sentiment_neutral';
    if (moodScore >= 20) return 'sentiment_dissatisfied';
    return 'sentiment_very_dissatisfied';
  }

  getCurrentMoodText(): string {
    const moodScore = this.getMoodScore();
    if (moodScore >= 80) return 'Excellent';
    if (moodScore >= 60) return 'Good';
    if (moodScore >= 40) return 'Neutral';
    if (moodScore >= 20) return 'Needs Attention';
    return 'Critical';
  }

  getMoodScore(): number {
    if (!this.insights) return 70;
    // Calculate mood score based on productivity metrics
    const completionFactor = this.insights.completionRate * 0.4;
    const focusFactor = this.insights.focusScore * 0.3;
    const burnoutFactor = (100 - this.insights.burnoutRisk) * 0.3;
    
    return Math.round(completionFactor + focusFactor + burnoutFactor);
  }

  getSentimentData(): ChartData[] {
    return [
      { name: 'Positive', value: 60 },
      { name: 'Neutral', value: 25 },
      { name: 'Negative', value: 10 },
      { name: 'Mixed', value: 5 }
    ];
  }

  getSmartSuggestions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    console.log('Getting smart suggestions, insights:', this.insights);
    
    if (!this.insights) {
      // Return default suggestions when no insights are available
      return [
        {
          title: 'Start Your Day Right',
          description: 'Begin with your most important task to set a productive tone for the day.',
          icon: 'wb_sunny',
          priority: 'medium'
        },
        {
          title: 'Use Time Blocking',
          description: 'Allocate specific time slots for different types of work to improve focus.',
          icon: 'schedule',
          priority: 'medium'
        },
        {
          title: 'Take Regular Breaks',
          description: 'Short breaks every hour can boost your overall productivity and creativity.',
          icon: 'free_breakfast',
          priority: 'low'
        }
      ];
    }

    if (this.insights.completionRate < 70) {
      suggestions.push({
        title: 'Break Down Large Tasks',
        description: 'Split complex tasks into smaller, manageable chunks to improve completion rates.',
        icon: 'content_cut',
        priority: 'high'
      });
    }

    if (this.insights.focusScore < 60) {
      suggestions.push({
        title: 'Try Pomodoro Technique',
        description: 'Use 25-minute focused work sessions to boost concentration and productivity.',
        icon: 'timer',
        priority: 'medium'
      });
    }

    if (this.insights.burnoutRisk > 70) {
      suggestions.push({
        title: 'Schedule Breaks',
        description: 'Take regular breaks to prevent burnout and maintain sustainable productivity.',
        icon: 'free_breakfast',
        priority: 'high'
      });
    }

    if (this.insights.mostProductiveTime) {
      suggestions.push({
        title: 'Optimize Schedule',
        description: `Schedule important tasks during your peak time: ${this.insights.mostProductiveTime}`,
        icon: 'schedule',
        priority: 'medium'
      });
    }

    // Always add some motivational suggestions
    if (this.insights.completionRate > 80) {
      suggestions.push({
        title: 'Outstanding Performance!',
        description: 'You\'re doing great! Consider taking on more challenging projects.',
        icon: 'star',
        priority: 'low'
      });
    }

    // Add default suggestions if none are generated
    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Maintain Current Pace',
        description: 'Your productivity is on track. Keep up the great work!',
        icon: 'thumb_up',
        priority: 'low'
      });
    }

    return suggestions;
  }

  // Focus Session Methods
  startFocusSession(): void {
    console.log('Starting focus session');
    this.currentFocusSession = {
      task: 'Current Task',
      startTime: new Date(),
      duration: 25, // minutes
      progress: 0
    };
  }

  getFocusSessionsToday(): number {
    return this.focusSessionsToday;
  }

  getTotalFocusTime(): string {
    const hours = Math.floor(this.totalFocusTimeToday / 60);
    const minutes = this.totalFocusTimeToday % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  getAverageFocusLength(): string {
    if (this.focusSessionsToday === 0) return '0m';
    const avgMinutes = Math.round(this.totalFocusTimeToday / this.focusSessionsToday);
    return `${avgMinutes}m`;
  }

  isCurrentlyFocusing(): boolean {
    return this.currentFocusSession !== null;
  }

  getCurrentFocusTask(): string {
    return this.currentFocusSession?.task || 'No active session';
  }

  getCurrentSessionProgress(): number {
    if (!this.currentFocusSession) return 0;
    const elapsed = Date.now() - this.currentFocusSession.startTime.getTime();
    const elapsedMinutes = elapsed / (1000 * 60);
    return Math.min(100, (elapsedMinutes / this.currentFocusSession.duration) * 100);
  }

  getCurrentSessionTimeRemaining(): string {
    if (!this.currentFocusSession) return '0m';
    const elapsed = Date.now() - this.currentFocusSession.startTime.getTime();
    const elapsedMinutes = elapsed / (1000 * 60);
    const remaining = Math.max(0, this.currentFocusSession.duration - elapsedMinutes);
    return `${Math.round(remaining)}m`;
  }

  // Recent Activity Methods
  getRecentActivities(): any[] {
    const activities = [
      {
        type: 'task_completed',
        title: 'Task Completed',
        description: 'Finished "Update AI insights component"',
        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        type: 'focus_session',
        title: 'Focus Session Started',
        description: 'Started 25-minute Pomodoro session',
        timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
      },
      {
        type: 'task_created',
        title: 'New Task Created',
        description: 'Added "Fix notification dropdown"',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'break_taken',
        title: 'Break Taken',
        description: 'Took a 10-minute break',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        type: 'milestone',
        title: 'Milestone Reached',
        description: 'Completed 5 tasks today',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    if (this.selectedActivityPeriod === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return activities.filter(activity => activity.timestamp >= today);
    } else {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return activities.filter(activity => activity.timestamp >= weekAgo);
    }
  }

  getActivityIcon(type: string): string {
    const icons = {
      'task_completed': 'check_circle',
      'focus_session': 'center_focus_strong',
      'task_created': 'add_circle',
      'break_taken': 'free_breakfast',
      'milestone': 'star'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getActivityColor(type: string): string {
    const colors = {
      'task_completed': '#10b981',
      'focus_session': '#3b82f6',
      'task_created': '#8b5cf6',
      'break_taken': '#f59e0b',
      'milestone': '#ef4444'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  // Missing methods for the template
  getTodaysFocusSessions(): any[] {
    return [
      { task: 'Code Review', duration: 25, score: 85, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
      { task: 'Bug Fixing', duration: 45, score: 92, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { task: 'Documentation', duration: 30, score: 78, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) }
    ];
  }

  getTotalFocusTimeToday(): number {
    return this.totalFocusTimeToday;
  }

  getAverageFocusScore(): number {
    const sessions = this.getTodaysFocusSessions();
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, session) => sum + session.score, 0);
    return Math.round(total / sessions.length);
  }

  loadRecentActivities(): void {
    // This would normally load from a service
    console.log('Loading recent activities...');
  }

  recentActivities: any[] = this.getRecentActivities();

  trackActivity(index: number, item: any): any {
    return item.timestamp;
  }

  getTimeAgo(timestamp: Date): string {
    return this.getRelativeTime(timestamp);
  }

  colorScheme: any = this.categoryColorScheme;

  legendPosition: LegendPosition = LegendPosition.Right;

  getCategoryColor(index: number): string {
    const colors = ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f'];
    return colors[index % colors.length];
  }

  getEnergyLevel(): number {
    if (!this.insights) return 70;
    return Math.max(0, Math.min(100, 100 - this.insights.burnoutRisk));
  }

  getStressLevel(): number {
    if (!this.insights) return 30;
    return Math.max(0, Math.min(100, this.insights.burnoutRisk * 0.8));
  }

  getFocusLevel(): number {
    if (!this.insights) return 70;
    return this.insights.focusScore;
  }

  gaugeColorScheme: any = {
    domain: ['#4facfe', '#00f2fe']
  };
} 