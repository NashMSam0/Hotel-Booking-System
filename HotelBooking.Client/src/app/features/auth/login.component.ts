import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card narrow">
      <h2>Login</h2>
      <label>Email <input [(ngModel)]="email" type="email" /></label>
      <label>Password <input [(ngModel)]="password" type="password" /></label>
      <button class="btn" (click)="submit()">Login</button>
      @if (error) { <p class="error">{{ error }}</p> }
      <p>No account? <a routerLink="/register">Register</a> · or <a routerLink="/request-booking">request a booking</a> without one.</p>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  error = '';
  submit() {
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => (this.error = e.error ?? 'Login failed'),
    });
  }
}
