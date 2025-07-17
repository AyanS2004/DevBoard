import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, User } from '../services/auth.service';
import { ThemeService, ThemeMode } from '../services/theme.service';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-navba',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ThemeToggleComponent
  ],
  templateUrl: './navba.component.html',
  styleUrl: './navba.component.scss'
})
export class NavbaComponent {
  constructor(
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  get currentUser$() {
    return this.authService.currentUser$;
  }

  get currentTheme$() {
    return this.themeService.theme$;
  }

  logout(): void {
    this.authService.logout();
  }
}
