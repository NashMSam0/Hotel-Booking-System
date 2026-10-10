import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string; email: string; fullName: string; roles: string[]; expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(tap(r => this.save(r)));
  }
  register(email: string, password: string, fullName: string, phoneNumber?: string) {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, { email, password, fullName, phoneNumber })
      .pipe(tap(r => this.save(r)));
  }
  private save(r: AuthResponse) {
    localStorage.setItem('hb_token', r.token);
    localStorage.setItem('hb_user', JSON.stringify({ email: r.email, fullName: r.fullName, roles: r.roles }));
  }
  logout() {
    localStorage.removeItem('hb_token');
    localStorage.removeItem('hb_user');
    this.router.navigate(['/login']);
  }
  get token() { return localStorage.getItem('hb_token'); }
  get user(): { email: string; fullName: string; roles: string[] } | null {
    const raw = localStorage.getItem('hb_user');
    return raw ? JSON.parse(raw) : null;
  }
  get isLoggedIn() { return !!this.token; }
  get isAdmin() { return this.user?.roles?.includes('Admin') ?? false; }
}
