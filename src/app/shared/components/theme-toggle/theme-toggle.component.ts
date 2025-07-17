import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatIconButton, MatTooltipModule],
  template: `
    <button 
      mat-icon-button 
      class="theme-toggle-btn"
      (click)="toggleTheme()"
      [matTooltip]="getThemeTooltip()"
      matTooltipPosition="below">
      <mat-icon [class.amoled-icon]="isAmoledMode()">
        {{ getThemeIcon() }}
      </mat-icon>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      padding: 8px;
      border-radius: 8px;
      color: var(--text-secondary);
      transition: all 0.3s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: all 0.3s ease;

        &.amoled-icon {
          color: var(--accent-color);
          filter: drop-shadow(0 0 4px var(--accent-color));
        }
      }

      &:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        transform: scale(1.1);

        mat-icon {
          transform: rotate(180deg);
        }
      }
    }
  `]
})
export class ThemeToggleComponent {
  constructor(private themeService: ThemeService) {}

  getCurrentTheme(): ThemeMode {
    return this.themeService.getCurrentTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isAmoledMode(): boolean {
    return this.themeService.isAmoledMode();
  }

  getThemeIcon(): string {
    const theme = this.getCurrentTheme();
    switch (theme) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'amoled':
        return 'brightness_1';
      default:
        return 'light_mode';
    }
  }

  getThemeTooltip(): string {
    const theme = this.getCurrentTheme();
    switch (theme) {
      case 'light':
        return 'Switch to Dark Mode';
      case 'dark':
        return 'Switch to AMOLED Mode';
      case 'amoled':
        return 'Switch to Light Mode';
      default:
        return 'Toggle Theme';
    }
  }
} 