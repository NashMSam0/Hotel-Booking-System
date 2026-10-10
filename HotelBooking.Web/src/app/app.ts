import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="site-header" [class.scrolled]="scrolled">
    <div class="topbar"><div class="wrap">
      <span>Staff console — Kudzis Bookings operations</span>
    </div></div>
    <header class="navbar"><div class="wrap">
      <a class="brand" routerLink="/"><span class="plane">K</span><span><b>Kudzis</b><small>OPS</small></span></a>
      <nav class="navlinks">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Console</a>
        <a routerLink="/hotels" routerLinkActive="active">Hotels</a>
        <a routerLink="/activities" routerLinkActive="active">Activities</a>
        <a routerLink="/dining" routerLinkActive="active">Dining</a>
        @if (auth.isLoggedIn) { <a routerLink="/my-bookings" routerLinkActive="active">My Bookings</a> }
      </nav>
      <div class="nav-right">
        @if (auth.isLoggedIn) {
          <span class="hint">{{ auth.user?.fullName }}</span>
          <button class="btn ghost" (click)="auth.logout()">Logout</button>
        } @else {
          <a routerLink="/login">Login</a>
        }
      </div>
    </div></header>
    </div>
    <main><router-outlet /></main>
    <footer class="footer">
      <div class="bottom"><span>© 2026 Kudzis Bookings — internal operations console.</span><span><a routerLink="/">Console</a></span></div>
    </footer>
  `,
})
export class App {
  auth = inject(AuthService);
  scrolled = false;

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 100;
  }
}
