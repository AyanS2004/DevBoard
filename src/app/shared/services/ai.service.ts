import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'focus' | 'health' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  createdAt: Date;
  icon?: string;
  color?: string;
}

export interface ProductivityInsights {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTimePerTask: number;
  mostProductiveTime: string;
  categoryStats: { [key: string]: number };
  weeklyTrend: number;
  focusScore: number;
  burnoutRisk: number;
  recommendations: string[];
}

export interface AIAnalysisData {
  insights: ProductivityInsights;
  recommendations: AIInsight[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private aiDataSubject = new BehaviorSubject<AIAnalysisData | null>(null);
  public aiData$ = this.aiDataSubject.asObservable();

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  refreshAIData(): Observable<AIAnalysisData> {
    // Simulate AI analysis with real data
    return this.taskService.getTasks().pipe(
      map((tasks) => {
        const user = this.authService.getCurrentUser();
        const aiData = this.generateAIAnalysis(tasks, user);
        this.aiDataSubject.next(aiData);
        return aiData;
      }),
      delay(1000), // Simulate API call delay
      catchError(error => {
        console.error('AI analysis failed:', error);
        return of(this.getDefaultAIData());
      })
    );
  }

  private generateAIAnalysis(tasks: any[], user: any): AIAnalysisData {
    const completedTasks = tasks.filter(task => task.completed);
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Generate category statistics
    const categoryStats = tasks.reduce((stats, task) => {
      const category = task.category || 'Uncategorized';
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {} as { [key: string]: number });

    // Calculate productivity metrics
    const averageTimePerTask = this.calculateAverageTimePerTask(tasks);
    const mostProductiveTime = this.findMostProductiveTime(tasks);
    const focusScore = this.calculateFocusScore(tasks);
    const burnoutRisk = this.calculateBurnoutRisk(tasks);
    const weeklyTrend = this.calculateWeeklyTrend(tasks);

    const insights: ProductivityInsights = {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      averageTimePerTask,
      mostProductiveTime,
      categoryStats,
      weeklyTrend,
      focusScore,
      burnoutRisk,
      recommendations: this.generateRecommendations(completionRate, focusScore, burnoutRisk)
    };

    const recommendations = this.generateAIInsights(insights);

    return {
      insights,
      recommendations
    };
  }

  private calculateAverageTimePerTask(tasks: any[]): number {
    const completedTasks = tasks.filter(task => task.completed && task.timeSpent);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    return Math.round(totalTime / completedTasks.length);
  }

  private findMostProductiveTime(tasks: any[]): string {
    const timeSlots = ['Morning', 'Afternoon', 'Evening'];
    const completedByTime = tasks.filter(task => task.completed)
      .reduce((slots, task) => {
        const hour = task.completedAt ? new Date(task.completedAt).getHours() : 12;
        if (hour < 12) slots.Morning++;
        else if (hour < 18) slots.Afternoon++;
        else slots.Evening++;
        return slots;
      }, { Morning: 0, Afternoon: 0, Evening: 0 });

    return Object.entries(completedByTime)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'Morning';
  }

  private calculateFocusScore(tasks: any[]): number {
    // Calculate focus score based on task completion patterns
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return 0;

    const averageCompletionTime = this.calculateAverageTimePerTask(tasks);
    const consistencyScore = this.calculateConsistencyScore(completedTasks);
    
    return Math.min(100, Math.round((consistencyScore * 0.6) + (averageCompletionTime > 0 ? 40 : 0)));
  }

  private calculateBurnoutRisk(tasks: any[]): number {
    const overdueTasks = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date());
    const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed);
    
    const overdueRisk = Math.min(50, overdueTasks.length * 10);
    const priorityRisk = Math.min(30, highPriorityTasks.length * 5);
    const workloadRisk = Math.min(20, Math.max(0, (tasks.length - 10) * 2));
    
    return Math.min(100, overdueRisk + priorityRisk + workloadRisk);
  }

  private calculateWeeklyTrend(tasks: any[]): number {
    // Simplified weekly trend calculation
    const thisWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt || Date.now());
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo;
    });

    const lastWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt || Date.now());
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= twoWeeksAgo && taskDate < weekAgo;
    });

    if (lastWeekTasks.length === 0) return 0;
    return Math.round(((thisWeekTasks.length - lastWeekTasks.length) / lastWeekTasks.length) * 100);
  }

  private calculateConsistencyScore(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    // Calculate consistency based on completion patterns
    const completionTimes = tasks.map(task => new Date(task.completedAt || Date.now()).getHours());
    const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const variance = completionTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / completionTimes.length;
    
    return Math.max(0, 100 - variance * 5);
  }

  private generateRecommendations(completionRate: number, focusScore: number, burnoutRisk: number): string[] {
    const recommendations: string[] = [];

    if (completionRate < 70) {
      recommendations.push('Consider breaking down large tasks into smaller, manageable chunks');
    }
    if (focusScore < 60) {
      recommendations.push('Try the Pomodoro Technique to improve focus');
    }
    if (burnoutRisk > 70) {
      recommendations.push('Take regular breaks to prevent burnout');
    }
    if (completionRate > 90) {
      recommendations.push('Great job! Consider taking on more challenging tasks');
    }

    return recommendations;
  }

  private generateAIInsights(insights: ProductivityInsights): AIInsight[] {
    const recommendations: AIInsight[] = [];

    // Productivity insights
    if (insights.completionRate < 60) {
      recommendations.push({
        id: 'low-completion',
        type: 'productivity',
        title: 'Low Task Completion Rate',
        description: `Your completion rate is ${insights.completionRate.toFixed(1)}%. Consider prioritizing tasks better.`,
        priority: 'high',
        category: 'Productivity',
        actionable: true,
        createdAt: new Date(),
        icon: 'trending_down',
        color: '#f44336'
      });
    }

    // Focus insights
    if (insights.focusScore < 50) {
      recommendations.push({
        id: 'low-focus',
        type: 'focus',
        title: 'Focus Improvement Needed',
        description: 'Your focus score suggests room for improvement. Try time-blocking techniques.',
        priority: 'medium',
        category: 'Focus',
        actionable: true,
        createdAt: new Date(),
        icon: 'psychology',
        color: '#ff9800'
      });
    }

    // Health insights
    if (insights.burnoutRisk > 70) {
      recommendations.push({
        id: 'burnout-risk',
        type: 'health',
        title: 'High Burnout Risk',
        description: 'You\'re showing signs of potential burnout. Consider taking breaks.',
        priority: 'high',
        category: 'Health',
        actionable: true,
        createdAt: new Date(),
        icon: 'warning',
        color: '#f44336'
      });
    }

    // Positive reinforcement
    if (insights.completionRate > 80) {
      recommendations.push({
        id: 'great-performance',
        type: 'recommendation',
        title: 'Excellent Performance!',
        description: 'You\'re maintaining a high completion rate. Keep up the great work!',
        priority: 'low',
        category: 'Achievement',
        actionable: false,
        createdAt: new Date(),
        icon: 'celebration',
        color: '#4caf50'
      });
    }

    return recommendations;
  }

  private getDefaultAIData(): AIAnalysisData {
    return {
      insights: {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        averageTimePerTask: 0,
        mostProductiveTime: 'Morning',
        categoryStats: {},
        weeklyTrend: 0,
        focusScore: 0,
        burnoutRisk: 0,
        recommendations: ['Start by adding some tasks to get personalized insights']
      },
      recommendations: []
    };
  }

  getInsightIcon(type: string): string {
    const icons = {
      productivity: 'trending_up',
      focus: 'psychology',
      health: 'favorite',
      recommendation: 'lightbulb'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getInsightColor(type: string): string {
    const colors = {
      productivity: '#2196f3',
      focus: '#9c27b0',
      health: '#f44336',
      recommendation: '#4caf50'
    };
    return colors[type as keyof typeof colors] || '#2196f3';
  }

  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
} 