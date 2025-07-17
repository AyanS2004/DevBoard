import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'amoled';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeMode>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadThemeFromStorage();
  }

  private loadThemeFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        // Check system preference
        this.checkSystemPreference();
      }
    }
  }

  private checkSystemPreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  setTheme(theme: ThemeMode): void {
    this.themeSubject.next(theme);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', theme);
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: ThemeMode): void {
    const body = document.body;
    
    // Remove all theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-amoled');
    
    // Add the new theme class
    body.classList.add(`theme-${theme}`);
    
    // Set CSS custom properties for the theme
    this.setThemeColors(theme);
  }

  private setThemeColors(theme: ThemeMode): void {
    const root = document.documentElement;
    
    switch (theme) {
      case 'light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f5f5f5');
        root.style.setProperty('--bg-tertiary', '#e0e0e0');
        root.style.setProperty('--text-primary', '#212121');
        root.style.setProperty('--text-secondary', '#757575');
        root.style.setProperty('--accent-color', '#1976d2');
        root.style.setProperty('--border-color', '#e0e0e0');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        break;
        
      case 'dark':
        root.style.setProperty('--bg-primary', '#121212');
        root.style.setProperty('--bg-secondary', '#1e1e1e');
        root.style.setProperty('--bg-tertiary', '#2d2d2d');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#b0b0b0');
        root.style.setProperty('--accent-color', '#90caf9');
        root.style.setProperty('--border-color', '#333333');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
        break;
        
      case 'amoled':
        root.style.setProperty('--bg-primary', '#000000');
        root.style.setProperty('--bg-secondary', '#0a0a0a');
        root.style.setProperty('--bg-tertiary', '#1a1a1a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#cccccc');
        root.style.setProperty('--accent-color', '#64b5f6');
        root.style.setProperty('--border-color', '#1a1a1a');
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.5)');
        break;
    }
  }

  getCurrentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const themes: ThemeMode[] = ['light', 'dark', 'amoled'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  isDarkMode(): boolean {
    const theme = this.getCurrentTheme();
    return theme === 'dark' || theme === 'amoled';
  }

  isAmoledMode(): boolean {
    return this.getCurrentTheme() === 'amoled';
  }
} 