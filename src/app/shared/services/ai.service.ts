import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'focus' | 'health' | 'recommendation' | 'prediction' | 'mood';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  createdAt: Date;
  icon?: string;
  color?: string;
  confidence?: number;
  trend?: 'up' | 'down' | 'stable';
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
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  performanceForecast: PerformanceForecast;
  personalizedInsights: PersonalizedInsights;
}

export interface PerformanceForecast {
  nextWeekProductivity: number;
  nextWeekBurnoutRisk: number;
  recommendedTaskLoad: number;
  optimalWorkingHours: string;
  predictedMoodTrend: 'improving' | 'declining' | 'stable';
  confidenceScore: number;
}

export interface PersonalizedInsights {
  workingStyle: 'morning-person' | 'night-owl' | 'flexible';
  preferredTaskTypes: string[];
  peakPerformanceHours: string[];
  breakRecommendations: string[];
  motivationTriggers: string[];
  burnoutWarnings: string[];
}

export interface AIAnalysisData {
  insights: ProductivityInsights;
  recommendations: AIInsight[];
  predictions: PredictiveAnalytics;
  moodAnalysis: MoodAnalysis;
}

export interface PredictiveAnalytics {
  taskCompletionPrediction: { [key: string]: number };
  productivityTrends: Array<{ date: string; predicted: number; actual?: number }>;
  burnoutRiskForecast: Array<{ date: string; risk: number }>;
  optimalScheduling: Array<{ time: string; efficiency: number }>;
}

export interface MoodAnalysis {
  currentMood: 'excellent' | 'good' | 'neutral' | 'poor' | 'critical';
  moodTrend: 'improving' | 'declining' | 'stable';
  emotionalState: {
    happiness: number;
    stress: number;
    energy: number;
    focus: number;
  };
  recommendations: string[];
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
  ) {
    // Initialize with default data
    this.generateInitialInsights();
  }

  refreshAIData(): Observable<AIAnalysisData> {
    // Simulate AI analysis with real data
    return this.taskService.getTasks().pipe(
      map((tasks) => {
        const user = this.authService.getCurrentUser();
        const aiData = this.generateAdvancedAIAnalysis(tasks, user);
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

  private generateInitialInsights(): void {
    // Generate initial insights on service creation
    const initialData = this.getDefaultAIData();
    this.aiDataSubject.next(initialData);
  }

  private generateAdvancedAIAnalysis(tasks: any[], user: any): AIAnalysisData {
    const completedTasks = tasks.filter(task => task.status === 'done');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Generate category statistics
    const categoryStats = tasks.reduce((stats, task) => {
      const category = task.category || 'Uncategorized';
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {} as { [key: string]: number });

    // Calculate advanced metrics
    const averageTimePerTask = this.calculateAverageTimePerTask(tasks);
    const mostProductiveTime = this.findMostProductiveTime(tasks);
    const focusScore = this.calculateFocusScore(tasks);
    const burnoutRisk = this.calculateBurnoutRisk(tasks);
    const weeklyTrend = this.calculateWeeklyTrend(tasks);
    const moodScore = this.calculateMoodScore(tasks, completionRate, burnoutRisk);
    const energyLevel = this.calculateEnergyLevel(tasks);
    const stressLevel = this.calculateStressLevel(tasks, burnoutRisk);

    // Generate performance forecast
    const performanceForecast = this.generatePerformanceForecast(tasks, completionRate, burnoutRisk);
    
    // Generate personalized insights
    const personalizedInsights = this.generatePersonalizedInsights(tasks, user);

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
      moodScore,
      energyLevel,
      stressLevel,
      performanceForecast,
      personalizedInsights,
      recommendations: this.generateRecommendations(completionRate, focusScore, burnoutRisk)
    };

    // Generate AI recommendations
    const recommendations = this.generateAdvancedAIInsights(insights);

    // Generate predictive analytics
    const predictions = this.generatePredictiveAnalytics(tasks, insights);

    // Generate mood analysis
    const moodAnalysis = this.generateMoodAnalysis(insights);

    return {
      insights,
      recommendations,
      predictions,
      moodAnalysis
    };
  }

  private generateAdvancedAIInsights(insights: ProductivityInsights): AIInsight[] {
    const recommendations: AIInsight[] = [];

    // Productivity insights
    if (insights.completionRate > 85) {
      recommendations.push({
        id: 'high-performance',
        type: 'productivity',
        title: 'Outstanding Performance',
        description: 'Your completion rate is exceptional! Consider taking on more challenging projects.',
        priority: 'medium',
        category: 'Performance',
        actionable: true,
        createdAt: new Date(),
        icon: 'trending_up',
        color: '#10b981',
        confidence: 95,
        trend: 'up'
      });
    }

    // Focus insights
    if (insights.focusScore < 60) {
      recommendations.push({
        id: 'focus-improvement',
        type: 'focus',
        title: 'Focus Enhancement Needed',
        description: 'Your focus score suggests room for improvement. Try the Pomodoro technique or time-blocking.',
        priority: 'high',
        category: 'Focus',
        actionable: true,
        createdAt: new Date(),
        icon: 'center_focus_strong',
        color: '#3b82f6',
        confidence: 88,
        trend: 'down'
      });
    }

    // Burnout risk insights
    if (insights.burnoutRisk > 70) {
      recommendations.push({
        id: 'burnout-prevention',
        type: 'health',
        title: 'High Burnout Risk Detected',
        description: 'Your burnout risk is elevated. Schedule breaks and consider reducing workload.',
        priority: 'high',
        category: 'Health',
        actionable: true,
        createdAt: new Date(),
        icon: 'health_and_safety',
        color: '#ef4444',
        confidence: 92,
        trend: 'up'
      });
    }

    // Mood insights
    if (insights.moodScore < 60) {
      recommendations.push({
        id: 'mood-improvement',
        type: 'mood',
        title: 'Mood Support Needed',
        description: 'Your mood indicators suggest you might benefit from wellness activities or social connection.',
        priority: 'medium',
        category: 'Wellness',
        actionable: true,
        createdAt: new Date(),
        icon: 'sentiment_satisfied',
        color: '#8b5cf6',
        confidence: 75,
        trend: 'down'
      });
    }

    // Predictive insights
    if (insights.performanceForecast.nextWeekProductivity < 70) {
      recommendations.push({
        id: 'performance-forecast',
        type: 'prediction',
        title: 'Performance Decline Predicted',
        description: 'Our AI predicts a potential productivity drop next week. Plan lighter workload.',
        priority: 'medium',
        category: 'Prediction',
        actionable: true,
        createdAt: new Date(),
        icon: 'insights',
        color: '#f59e0b',
        confidence: 82,
        trend: 'down'
      });
    }

    // Personalized recommendations
    if (insights.personalizedInsights.workingStyle === 'morning-person') {
      recommendations.push({
        id: 'schedule-optimization',
        type: 'recommendation',
        title: 'Optimize Your Schedule',
        description: 'You\'re a morning person! Schedule your most important tasks before 11 AM.',
        priority: 'medium',
        category: 'Optimization',
        actionable: true,
        createdAt: new Date(),
        icon: 'schedule',
        color: '#06b6d4',
        confidence: 90,
        trend: 'stable'
      });
    }

    return recommendations;
  }

  private generatePerformanceForecast(tasks: any[], completionRate: number, burnoutRisk: number): PerformanceForecast {
    // AI-powered performance forecasting
    const nextWeekProductivity = Math.max(20, completionRate - (burnoutRisk * 0.3) + (Math.random() * 20 - 10));
    const nextWeekBurnoutRisk = Math.min(100, burnoutRisk + (Math.random() * 20 - 10));
    const recommendedTaskLoad = Math.floor(tasks.length * (nextWeekProductivity / 100));
    
    // Determine optimal working hours based on current performance
    const optimalWorkingHours = burnoutRisk > 60 ? '6-7 hours' : burnoutRisk > 40 ? '7-8 hours' : '8-9 hours';
    
    const predictedMoodTrend: 'improving' | 'declining' | 'stable' = 
      nextWeekProductivity > completionRate ? 'improving' : 
      nextWeekProductivity < completionRate - 10 ? 'declining' : 'stable';

    return {
      nextWeekProductivity,
      nextWeekBurnoutRisk,
      recommendedTaskLoad,
      optimalWorkingHours,
      predictedMoodTrend,
      confidenceScore: 85
    };
  }

  private generatePersonalizedInsights(tasks: any[], user: any): PersonalizedInsights {
    // Analyze user's working patterns
    const workingStyle = this.analyzeWorkingStyle(tasks);
    const preferredTaskTypes = this.analyzePreferredTaskTypes(tasks);
    const peakPerformanceHours = this.analyzePeakPerformanceHours(tasks);
    
    return {
      workingStyle,
      preferredTaskTypes,
      peakPerformanceHours,
      breakRecommendations: [
        'Take a 5-minute break every 25 minutes',
        'Go for a short walk during lunch',
        'Practice deep breathing exercises'
      ],
      motivationTriggers: [
        'Set small, achievable goals',
        'Reward yourself after completing tasks',
        'Work in a well-lit environment'
      ],
      burnoutWarnings: [
        'You tend to overcommit on Mondays',
        'Your productivity drops after 3 PM',
        'Consider shorter work sessions'
      ]
    };
  }

  private generatePredictiveAnalytics(tasks: any[], insights: ProductivityInsights): PredictiveAnalytics {
    // Generate task completion predictions
    const taskCompletionPrediction = insights.categoryStats;
    
    // Generate productivity trends
    const productivityTrends = this.generateProductivityTrends();
    
    // Generate burnout risk forecast
    const burnoutRiskForecast = this.generateBurnoutRiskForecast(insights.burnoutRisk);
    
    // Generate optimal scheduling
    const optimalScheduling = this.generateOptimalScheduling();

    return {
      taskCompletionPrediction,
      productivityTrends,
      burnoutRiskForecast,
      optimalScheduling
    };
  }

  private generateMoodAnalysis(insights: ProductivityInsights): MoodAnalysis {
    const moodScore = insights.moodScore;
    let currentMood: MoodAnalysis['currentMood'];
    
    if (moodScore >= 90) currentMood = 'excellent';
    else if (moodScore >= 70) currentMood = 'good';
    else if (moodScore >= 50) currentMood = 'neutral';
    else if (moodScore >= 30) currentMood = 'poor';
    else currentMood = 'critical';

    const moodTrend = insights.weeklyTrend > 5 ? 'improving' : 
                     insights.weeklyTrend < -5 ? 'declining' : 'stable';

    return {
      currentMood,
      moodTrend,
      emotionalState: {
        happiness: moodScore,
        stress: insights.stressLevel,
        energy: insights.energyLevel,
        focus: insights.focusScore
      },
      recommendations: this.generateMoodRecommendations(currentMood)
    };
  }

  // Enhanced calculation methods
  private calculateMoodScore(tasks: any[], completionRate: number, burnoutRisk: number): number {
    const baseScore = completionRate * 0.5;
    const burnoutPenalty = burnoutRisk * 0.3;
    const taskVariety = Object.keys(tasks.reduce((cats, task) => {
      cats[task.category || 'default'] = true;
      return cats;
    }, {})).length * 5;
    
    return Math.max(0, Math.min(100, baseScore - burnoutPenalty + taskVariety));
  }

  private calculateEnergyLevel(tasks: any[]): number {
    const recentTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt || Date.now());
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return taskDate >= threeDaysAgo;
    });

    const energyScore = recentTasks.length > 0 ? 
      (recentTasks.filter(task => task.status === 'done').length / recentTasks.length) * 100 : 50;
    
    return Math.round(energyScore);
  }

  private calculateStressLevel(tasks: any[], burnoutRisk: number): number {
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
    );
    
    const stressFromOverdue = Math.min(50, overdueTasks.length * 10);
    const stressFromBurnout = burnoutRisk * 0.5;
    
    return Math.round(Math.min(100, stressFromOverdue + stressFromBurnout));
  }

  private analyzeWorkingStyle(tasks: any[]): 'morning-person' | 'night-owl' | 'flexible' {
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completedAt);
    
    if (completedTasks.length === 0) return 'flexible';
    
    const morningTasks = completedTasks.filter(task => {
      const hour = new Date(task.completedAt).getHours();
      return hour >= 6 && hour <= 11;
    });
    
    const eveningTasks = completedTasks.filter(task => {
      const hour = new Date(task.completedAt).getHours();
      return hour >= 18 && hour <= 23;
    });
    
    if (morningTasks.length > eveningTasks.length * 1.5) return 'morning-person';
    if (eveningTasks.length > morningTasks.length * 1.5) return 'night-owl';
    return 'flexible';
  }

  private analyzePreferredTaskTypes(tasks: any[]): string[] {
    const categoryCount = tasks.reduce((acc, task) => {
      if (task.status === 'done') {
        const category = task.category || 'General';
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([category]) => category);
  }

  private analyzePeakPerformanceHours(tasks: any[]): string[] {
    const hourlyCompletion = tasks.filter(task => task.status === 'done' && task.completedAt)
      .reduce((acc, task) => {
        const hour = new Date(task.completedAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as { [key: number]: number });

    return Object.entries(hourlyCompletion)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  private generateProductivityTrends(): Array<{ date: string; predicted: number; actual?: number }> {
    const trends = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        predicted: 70 + Math.random() * 30,
        actual: i < 3 ? 65 + Math.random() * 35 : undefined
      });
    }
    
    return trends;
  }

  private generateBurnoutRiskForecast(currentRisk: number): Array<{ date: string; risk: number }> {
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const risk = Math.max(0, Math.min(100, currentRisk + (Math.random() * 20 - 10)));
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        risk: Math.round(risk)
      });
    }
    
    return forecast;
  }

  private generateOptimalScheduling(): Array<{ time: string; efficiency: number }> {
    return [
      { time: '09:00', efficiency: 85 },
      { time: '10:00', efficiency: 92 },
      { time: '11:00', efficiency: 88 },
      { time: '14:00', efficiency: 75 },
      { time: '15:00', efficiency: 82 },
      { time: '16:00', efficiency: 78 }
    ];
  }

  private generateMoodRecommendations(mood: MoodAnalysis['currentMood']): string[] {
    const recommendations = {
      'excellent': [
        'Keep up the great work!',
        'Consider helping a colleague',
        'Take on a challenging project'
      ],
      'good': [
        'Maintain your current routine',
        'Set slightly higher goals',
        'Practice gratitude'
      ],
      'neutral': [
        'Try a new productivity technique',
        'Take a short walk',
        'Connect with a friend'
      ],
      'poor': [
        'Take frequent breaks',
        'Practice mindfulness',
        'Consider lighter workload'
      ],
      'critical': [
        'Consider taking time off',
        'Seek support from others',
        'Focus on self-care'
      ]
    };

    return recommendations[mood] || recommendations['neutral'];
  }

  // Keep existing methods but enhance them
  private calculateAverageTimePerTask(tasks: any[]): number {
    const completedTasks = tasks.filter(task => task.status === 'done' && task.actualTime);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
    return Math.round(totalTime / completedTasks.length);
  }

  private findMostProductiveTime(tasks: any[]): string {
    const timeSlots = ['Morning', 'Afternoon', 'Evening'];
    const completedByTime = tasks.filter(task => task.status === 'done')
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
    const completedTasks = tasks.filter(task => task.status === 'done');
    if (completedTasks.length === 0) return 0;

    const averageCompletionTime = this.calculateAverageTimePerTask(tasks);
    const consistencyScore = this.calculateConsistencyScore(completedTasks);
    
    return Math.min(100, Math.round((consistencyScore * 0.6) + (averageCompletionTime > 0 ? 40 : 0)));
  }

  private calculateBurnoutRisk(tasks: any[]): number {
    const overdueTasks = tasks.filter(task => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date());
    const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'done');
    
    const overdueRisk = Math.min(50, overdueTasks.length * 10);
    const priorityRisk = Math.min(30, highPriorityTasks.length * 5);
    const workloadRisk = Math.min(20, Math.max(0, (tasks.length - 10) * 2));
    
    return Math.min(100, overdueRisk + priorityRisk + workloadRisk);
  }

  private calculateWeeklyTrend(tasks: any[]): number {
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
        focusScore: 70,
        burnoutRisk: 25,
        moodScore: 75,
        energyLevel: 70,
        stressLevel: 30,
        performanceForecast: {
          nextWeekProductivity: 75,
          nextWeekBurnoutRisk: 30,
          recommendedTaskLoad: 8,
          optimalWorkingHours: '7-8 hours',
          predictedMoodTrend: 'stable',
          confidenceScore: 80
        },
        personalizedInsights: {
          workingStyle: 'flexible',
          preferredTaskTypes: ['Development', 'Design'],
          peakPerformanceHours: ['10:00', '14:00'],
          breakRecommendations: ['Take regular breaks', 'Go for walks'],
          motivationTriggers: ['Set achievable goals', 'Reward progress'],
          burnoutWarnings: ['Monitor workload', 'Watch for stress signs']
        },
        recommendations: ['Stay focused', 'Take breaks', 'Plan ahead']
      },
      recommendations: [],
      predictions: {
        taskCompletionPrediction: {},
        productivityTrends: [],
        burnoutRiskForecast: [],
        optimalScheduling: []
      },
      moodAnalysis: {
        currentMood: 'good',
        moodTrend: 'stable',
        emotionalState: {
          happiness: 75,
          stress: 30,
          energy: 70,
          focus: 70
        },
        recommendations: ['Maintain current routine', 'Set slightly higher goals']
      }
    };
  }

  getInsightIcon(type: string): string {
    const icons = {
      productivity: 'trending_up',
      focus: 'psychology',
      health: 'favorite',
      recommendation: 'lightbulb',
      prediction: 'insights',
      mood: 'sentiment_satisfied'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getInsightColor(type: string): string {
    const colors = {
      productivity: '#2196f3',
      focus: '#9c27b0',
      health: '#f44336',
      recommendation: '#4caf50',
      prediction: '#f59e0b',
      mood: '#8b5cf6'
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