import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbaComponent } from './shared/navba/navba.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbaComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'DevBoard';
}
