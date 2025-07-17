import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AIService, AIInsight, ProductivityInsights } from '../../services/ai.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule
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

  constructor(private aiService: AIService) {}

  ngOnInit() {
    this.loadAIInsights();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAIInsights() {
    this.loading = true;
    this.error = false;

    this.aiService.refreshAIData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.insights = data.insights;
          this.recommendations = data.recommendations;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Failed to load AI insights:', error);
          this.error = true;
          this.loading = false;
        }
      });
  }

  refreshInsights() {
    this.loadAIInsights();
  }

  getInsightIcon(type: string): string {
    return this.aiService.getInsightIcon(type);
  }

  getInsightColor(type: string): string {
    return this.aiService.getInsightColor(type);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
  }

  formatTime(minutes: number): string {
    return this.aiService.formatTime(minutes);
  }

  getCompletionRateColor(rate: number): string {
    if (rate >= 80) return '#4caf50';
    if (rate >= 60) return '#ff9800';
    return '#f44336';
  }

  getCategoryEntries(categoryStats: { [key: string]: number }): { key: string; value: number }[] {
    return Object.entries(categoryStats).map(([key, value]) => ({ key, value }));
  }

  getCategoryPercentage(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }
} 