import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card narrow">
      <h2>Register</h2>
      <label>Full name <input [(ngModel)]="fullName" /></label>
      <label>Email <input [(ngModel)]="email" type="email" /></label>
      <label>Phone <input [(ngModel)]="phone" /></label>
      <label>Password (min 6) <input [(ngModel)]="password" type="password" /></label>
      <button (click)="submit()">Create account</button>
      @if (error) { <p class="error">{{ error }}</p> }
      <p>Have an account? <a routerLink="/login">Login</a></p>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  fullName = ''; email = ''; phone = ''; password = '';
  error = '';
  submit() {
    this.auth.register(this.email, this.password, this.fullName, this.phone || undefined).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => (this.error = Array.isArray(e.error) ? e.error.join(', ') : (e.error ?? 'Failed')),
    });
  }
}
