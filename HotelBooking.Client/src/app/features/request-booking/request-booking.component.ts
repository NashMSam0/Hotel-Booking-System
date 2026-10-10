import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-request-booking',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page"><div class="card narrow" style="max-width:560px">
      <h2>Request a booking</h2>
      <p class="hint">No account needed — tell us what you'd like and our team will arrange it by email.</p>
      <div class="tabs" style="display:flex;gap:8px;margin:12px 0;">
        @for (k of kinds; track k.v) {
          <button [class.ghost]="kind !== k.v" (click)="kind = k.v">{{ k.label }}</button>
        }
      </div>
      @if (kind === 'room') {
        <div class="row">
          <label>Check-in <input type="date" [(ngModel)]="f.checkIn" /></label>
          <label>Check-out <input type="date" [(ngModel)]="f.checkOut" /></label>
          <label>Guests <input type="number" min="1" [(ngModel)]="f.guests" style="width:80px" /></label>
        </div>
        <label>Room preference <input placeholder="e.g. Deluxe, ground floor, Falls view" [(ngModel)]="f.extra" /></label>
      } @else if (kind === 'activity') {
        <div class="row">
          <label>Activity <select [(ngModel)]="f.activity">
            @for (a of activities; track a) { <option [value]="a">{{ a }}</option> }
          </select></label>
          <label>Preferred date <input type="date" [(ngModel)]="f.date" /></label>
          <label>People <input type="number" min="1" [(ngModel)]="f.people" style="width:80px" /></label>
        </div>
      } @else {
        <div class="row">
          <label>Preferred date <input type="date" [(ngModel)]="f.date" /></label>
          <label>Meal <select [(ngModel)]="f.meal"><option>Lunch</option><option>Dinner</option></select></label>
          <label>Party size <input type="number" min="1" [(ngModel)]="f.people" style="width:80px" /></label>
        </div>
        <label>Occasion / requests <input placeholder="e.g. birthday, window seat, dietary needs" [(ngModel)]="f.extra" /></label>
      }
      <div class="row">
        <label>Your name <input [(ngModel)]="f.name" /></label>
        <label>Email <input type="email" [(ngModel)]="f.email" /></label>
        <label>Phone <input [(ngModel)]="f.phone" /></label>
      </div>
      @if (msg) { <p class="ok">{{ msg }}</p> }
      @if (error) { <p class="error">{{ error }}</p> }
      <div class="row"><button class="btn" (click)="submit()">Send booking request</button></div>
    </div></div>
  `,
})
export class RequestBookingComponent {
  api = inject(ApiService);
  kinds = [
    { v: 'room', label: 'Stay' },
    { v: 'activity', label: 'Activity' },
    { v: 'dining', label: 'Dining' },
  ];
  kind = 'room';
  activities = ['Victoria Falls Guided Walk', 'Zambezi Sunset Cruise', 'Hwange Game Drive', 'Bridge Bungee Jump', 'Great Zimbabwe Tour', 'Other'];
  f: any = {
    checkIn: '', checkOut: '', guests: 2, activity: 'Victoria Falls Guided Walk',
    date: '', people: 2, meal: 'Dinner', extra: '', name: '', email: '', phone: '',
  };
  msg = ''; error = '';

  submit() {
    this.msg = ''; this.error = '';
    let prefs = '';
    if (this.kind === 'room') prefs = `Check-in: ${this.f.checkIn || 'flexible'}, Check-out: ${this.f.checkOut || 'flexible'}, Guests: ${this.f.guests}, Preference: ${this.f.extra || 'none'}`;
    else if (this.kind === 'activity') prefs = `Activity: ${this.f.activity}, Date: ${this.f.date || 'flexible'}, People: ${this.f.people}`;
    else prefs = `Date: ${this.f.date || 'flexible'}, Meal: ${this.f.meal}, Party: ${this.f.people}, Requests: ${this.f.extra || 'none'}`;
    this.api.createBookingRequest({ name: this.f.name, email: this.f.email, phone: this.f.phone, kind: this.kind, preferences: prefs })
      .subscribe({
        next: () => { this.msg = 'Request sent! Our team will email you shortly to confirm.'; },
        error: (e) => (this.error = typeof e.error === 'string' ? e.error : 'Could not send request.'),
      });
  }
}
