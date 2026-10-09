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
    <div class="topbar"><div class="wrap">
      <span>✈&nbsp; Free cancellation</span><span>★&nbsp; Best price guarantee</span><span>◈&nbsp; Secure booking</span><span>◷&nbsp; 24/7 Customer support</span>
    </div></div>
    <header class="navbar" [class.transparent]="isHome && !scrolled"><div class="wrap">
      <a class="brand" routerLink="/"><span class="plane">K</span><span><b>Kudzis</b><small>BOOKINGS</small></span></a>
      <nav class="navlinks">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
        <a routerLink="/hotels" routerLinkActive="active">Hotels</a>
        <a routerLink="/activities" routerLinkActive="active">Activities</a>
        <a routerLink="/dining" routerLinkActive="active">Dining</a>
        @if (auth.isLoggedIn) { <a routerLink="/my-bookings" routerLinkActive="active">My Bookings</a> }
        @if (auth.isAdmin) { <a routerLink="/admin" routerLinkActive="active">Admin</a> }
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
        <div><h4>Support</h4><a routerLink="/my-bookings">My Bookings</a><a routerLink="/login">Login</a><a routerLink="/register">Register</a></div>
        <div><h4>Top Destinations</h4><a routerLink="/">Victoria Falls</a><a routerLink="/">Hwange</a><a routerLink="/">Great Zimbabwe</a><a routerLink="/">Mana Pools</a></div>
        <div><h4>Contact Us</h4><p>✆ +263 (242) 123-456</p><p>✉ info&#64;kudzisbookings.co.zw</p><p>123 Samora Machel Ave, Harare, Zimbabwe</p></div>
      </div>
      <div class="bottom"><span>© 2026 Kudzis Bookings. All rights reserved.</span><span>VISA&nbsp;&nbsp;Mastercard&nbsp;&nbsp;PayPal&nbsp;&nbsp;G Pay</span></div>
    </footer>
  `,
})
export class App implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  scrolled = false;
  isHome = true;

  ngOnInit() {
    this.isHome = this.router.url === '/';
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.isHome = (e as NavigationEnd).urlAfterRedirects === '/';
      window.scrollTo(0, 0);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 100;
  }
}
