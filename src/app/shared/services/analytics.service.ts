import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTaskTime: number;
  productivityScore: number;
  streakDays: number;
  focusTimeHours: number;
  peakProductivityHour: number;
}

export interface TrendData {
  date: string;
  completed: number;
  created: number;
  focusTime: number;
  productivity: number;
}

export interface CategoryDistribution {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface TimeAnalysis {
  hour: number;
  tasks: number;
  pomodoros: number;
  productivity: number;
  label: string;
}

export interface ProjectProgress {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  velocity: number;
  estimatedCompletion?: Date;
}

export interface AIInsight {
  type: 'positive' | 'improvement' | 'suggestion' | 'warning';
  title: string;
  description: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    route: string;
    params?: any;
  };
}

export interface HeatmapData {
  date: string;
  count: number;
  level: number;
}

export interface AnalyticsDashboard {
  overview: ProductivityMetrics;
  trends: {
    weekly: TrendData[];
    categoryDistribution: CategoryDistribution[];
    timeAnalysis: TimeAnalysis[];
    projectProgress: ProjectProgress[];
  };
  insights: AIInsight[];
  predictions: {
    nextWeekProductivity: number;
    burnoutRisk: number;
    optimalWorkingHours: number[];
    recommendedBreaks: number;
  };
  metadata: {
    dateRange: { start: Date; end: Date };
    dataPoints: number;
    lastUpdated: Date;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}/api/analytics`;
  private dashboardData$ = new BehaviorSubject<AnalyticsDashboard | null>(null);
  private isLoading$ = new BehaviorSubject<boolean>(false);
  private lastRefresh: Date | null = null;

  constructor(private http: HttpClient) {}

  // Main dashboard data
  getDashboardData(): Observable<AnalyticsDashboard> {
    this.isLoading$.next(true);
    
    return this.http.get<AnalyticsDashboard>(`${this.apiUrl}/dashboard`).pipe(
      map(data => {
        this.dashboardData$.next(data);
        this.lastRefresh = new Date();
        this.isLoading$.next(false);
        return data;
      }),
      catchError(error => {
        this.isLoading$.next(false);
        console.error('Analytics dashboard error:', error);
        throw error;
      })
    );
  }

  // Cached dashboard data
  getCachedDashboardData(): Observable<AnalyticsDashboard | null> {
    return this.dashboardData$.asObservable();
  }

  // Loading state
  isLoading(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  // Heatmap data for productivity calendar
  getHeatmapData(): Observable<{
    heatmap: HeatmapData[];
    totalDays: number;
    maxTasksPerDay: number;
    averageTasksPerDay: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/heatmap`);
  }

  // Advanced metrics with custom date range
  getAdvancedMetrics(startDate: Date, endDate: Date): Observable<any> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
    
    return this.http.get<any>(`${this.apiUrl}/advanced`, { params });
  }

  // Time-based analysis
  getTimeAnalysis(period: 'day' | 'week' | 'month' | 'year'): Observable<TimeAnalysis[]> {
    return this.http.get<TimeAnalysis[]>(`${this.apiUrl}/time-analysis`, {
      params: { period }
    });
  }

  // Productivity predictions using AI
  getPredictions(): Observable<{
    nextWeekScore: number;
    burnoutRisk: number;
    optimalHours: number[];
    recommendations: string[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/predictions`);
  }

  // Category performance analysis
  getCategoryAnalysis(): Observable<{
    categories: CategoryDistribution[];
    performanceByCategory: any[];
    recommendations: string[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/categories`);
  }

  // Team/collaboration analytics (if available)
  getTeamAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/team`);
  }

  // Export analytics data
  exportData(format: 'json' | 'csv' | 'pdf' = 'json', days: number = 30): Observable<Blob> {
    const params = { format, days: days.toString() };
    
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Generate PDF report
  generateReport(options: {
    period: 'week' | 'month' | 'quarter' | 'year';
    includeCharts: boolean;
    includeInsights: boolean;
    includeRecommendations: boolean;
  }): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/generate-report`, options, {
      responseType: 'blob'
    });
  }

  // Real-time analytics updates
  subscribeToRealTimeUpdates(): Observable<any> {
    // This would typically use WebSocket
    return new Observable(observer => {
      const interval = setInterval(() => {
        this.getDashboardData().subscribe(data => {
          observer.next(data);
        });
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    });
  }

  // AI-powered insights
  getAIInsights(): Observable<AIInsight[]> {
    return this.http.get<AIInsight[]>(`${this.apiUrl}/ai-insights`);
  }

  // Performance comparison
  comparePerformance(
    period1: { start: Date; end: Date },
    period2: { start: Date; end: Date }
  ): Observable<{
    period1: ProductivityMetrics;
    period2: ProductivityMetrics;
    comparison: {
      improvement: number;
      areas: string[];
      recommendations: string[];
    };
  }> {
    const params = {
      period1Start: period1.start.toISOString(),
      period1End: period1.end.toISOString(),
      period2Start: period2.start.toISOString(),
      period2End: period2.end.toISOString()
    };
    
    return this.http.get<any>(`${this.apiUrl}/compare`, { params });
  }

  // Goal tracking
  trackGoals(): Observable<{
    goals: any[];
    progress: any[];
    achievements: any[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/goals`);
  }

  // Productivity recommendations
  getRecommendations(): Observable<{
    immediate: string[];
    weekly: string[];
    monthly: string[];
    priority: 'low' | 'medium' | 'high';
  }> {
    return this.http.get<any>(`${this.apiUrl}/recommendations`);
  }

  // Advanced visualizations data
  getVisualizationData(type: 'sankey' | 'treemap' | 'network' | 'timeline'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/visualization/${type}`);
  }

  // Benchmarking (anonymous comparison)
  getBenchmarkData(): Observable<{
    userScore: number;
    averageScore: number;
    percentile: number;
    insights: string[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/benchmark`);
  }

  // Utility methods
  
  calculateProductivityScore(metrics: ProductivityMetrics): number {
    const weights = {
      completion: 0.3,
      consistency: 0.25,
      focus: 0.2,
      efficiency: 0.25
    };
    
    const completionScore = metrics.completionRate;
    const consistencyScore = Math.min(100, metrics.streakDays * 10);
    const focusScore = Math.min(100, metrics.focusTimeHours * 5);
    const efficiencyScore = Math.min(100, (1 / (metrics.averageTaskTime || 1)) * 100);
    
    return Math.round(
      completionScore * weights.completion +
      consistencyScore * weights.consistency +
      focusScore * weights.focus +
      efficiencyScore * weights.efficiency
    );
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatTrend(current: number, previous: number): {
    percentage: number;
    direction: 'up' | 'down' | 'stable';
    color: string;
  } {
    const change = current - previous;
    const percentage = previous === 0 ? 0 : Math.round((change / previous) * 100);
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let color = '#666';
    
    if (percentage > 5) {
      direction = 'up';
      color = '#4CAF50';
    } else if (percentage < -5) {
      direction = 'down';
      color = '#f44336';
    }
    
    return { percentage: Math.abs(percentage), direction, color };
  }

  // Chart color schemes
  getColorScheme(type: 'productivity' | 'category' | 'time' | 'project'): string[] {
    const schemes = {
      productivity: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
      category: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
      time: ['#FF9800', '#FF7043', '#FF5722', '#F44336', '#E91E63', '#9C27B0'],
      project: ['#2196F3', '#03DAC6', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107']
    };
    
    return schemes[type] || schemes.productivity;
  }

  // Cache management
  clearCache(): void {
    this.dashboardData$.next(null);
    this.lastRefresh = null;
  }

  shouldRefresh(): boolean {
    if (!this.lastRefresh) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastRefresh < fiveMinutesAgo;
  }

  // Data processing utilities
  processChartData(data: any[], xField: string, yField: string): any[] {
    return data.map(item => ({
      name: item[xField],
      value: item[yField],
      extra: item
    }));
  }

  aggregateData(data: any[], groupBy: string, valueField: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, count: 0 };
      }
      acc[key].value += item[valueField];
      acc[key].count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped);
  }

  // Achievement detection
  detectAchievements(metrics: ProductivityMetrics): AIInsight[] {
    const achievements: AIInsight[] = [];
    
    if (metrics.completionRate >= 90) {
      achievements.push({
        type: 'positive',
        title: 'Completion Master',
        description: 'You\'ve maintained a 90%+ completion rate!',
        icon: '🎯',
        priority: 'high',
        actionable: false
      });
    }
    
    if (metrics.streakDays >= 7) {
      achievements.push({
        type: 'positive',
        title: 'Consistency Champion',
        description: `${metrics.streakDays} days streak! Keep it up!`,
        icon: '🔥',
        priority: 'high',
        actionable: false
      });
    }
    
    if (metrics.focusTimeHours >= 6) {
      achievements.push({
        type: 'positive',
        title: 'Focus Master',
        description: `${metrics.focusTimeHours} hours of focused work today!`,
        icon: '🧠',
        priority: 'medium',
        actionable: false
      });
    }
    
    return achievements;
  }
} 