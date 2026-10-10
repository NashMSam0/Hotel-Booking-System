import { Component, HostListener, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="site-header" [class.scrolled]="scrolled">
    <header class="navbar" [class.transparent]="isHome && !scrolled"><div class="wrap">
      <a class="brand" routerLink="/"><span class="plane">K</span><span><b>Kudzis</b><small>BOOKINGS</small></span></a>
      <button class="burger" (click)="menuOpen = !menuOpen" aria-label="Menu">☰</button>
      <nav class="navlinks" [class.open]="menuOpen">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
        <a routerLink="/hotels" routerLinkActive="active">Hotels</a>
        <a routerLink="/activities" routerLinkActive="active">Activities</a>
        <a routerLink="/dining" routerLinkActive="active">Dining</a>
        <a routerLink="/request-booking" routerLinkActive="active">Request Booking</a>
        @if (auth.isLoggedIn) { <a routerLink="/my-bookings" routerLinkActive="active">My Bookings</a> }
      </nav>
      <div class="nav-right">
        @if (auth.isLoggedIn) {
          <span class="hint">{{ auth.user?.fullName }}</span>
          <button class="btn ghost" (click)="auth.logout()">Logout</button>
        } @else {
          <a routerLink="/login">Login</a>
          <a class="btn" routerLink="/hotels">✈ Book Now</a>
        }
      </div>
    </div></header>
    </div>
    <main><router-outlet /></main>
    <footer class="footer">
      <div class="cols">
        <div>
          <a class="brand" routerLink="/"><span class="plane">K</span><span><b>Kudzis</b><small>BOOKINGS</small></span></a>
          <p>Your trusted travel partner for unforgettable journeys.</p>
        </div>
        <div><h4>Company</h4><a routerLink="/">About Us</a><a routerLink="/hotels">Hotels</a><a routerLink="/activities">Activities</a><a routerLink="/dining">Dining</a></div>
        <div><h4>Support</h4><a routerLink="/request-booking">Request Booking</a><a routerLink="/my-bookings">My Bookings</a><a routerLink="/login">Login</a><a routerLink="/register">Register</a></div>
        <div><h4>Top Destinations</h4><a routerLink="/">Victoria Falls</a><a routerLink="/">Hwange</a><a routerLink="/">Great Zimbabwe</a><a routerLink="/">Mana Pools</a></div>
        <div><h4>Contact Us</h4><p>✆ +263 (242) 123-456</p><p>✉ info&#64;kudzisbookings.co.zw</p><p>123 Samora Machel Ave, Harare, Zimbabwe</p></div>
      </div>
      <div class="bottom"><span>© 2026 Kudzis Bookings. All rights reserved.</span><span>No prepayment · Confirmed by email</span></div>
    </footer>
  `,
})
export class App implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  scrolled = false;
  isHome = true;
  menuOpen = false;

  ngOnInit() {
    this.isHome = this.router.url === '/';
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.isHome = (e as NavigationEnd).urlAfterRedirects === '/';
      this.menuOpen = false;
      window.scrollTo(0, 0);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 100;
  }
}
