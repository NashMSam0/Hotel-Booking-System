import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
  { path: 'hotels', loadComponent: () => import('./features/rooms/rooms.component').then((m) => m.RoomsComponent) },
  { path: 'rooms', redirectTo: 'hotels' },
  { path: 'activities', loadComponent: () => import('./features/activities/activities.component').then((m) => m.ActivitiesComponent) },
  { path: 'dining', loadComponent: () => import('./features/dining/dining.component').then((m) => m.DiningComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'request-booking', loadComponent: () => import('./features/request-booking/request-booking.component').then((m) => m.RequestBookingComponent) },
  { path: 'my-bookings', loadComponent: () => import('./features/my-bookings/my-bookings.component').then((m) => m.MyBookingsComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
