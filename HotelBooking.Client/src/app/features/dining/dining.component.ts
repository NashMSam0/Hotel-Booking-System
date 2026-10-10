import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dining',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h2>Dinner &amp; Lunch booking</h2>
      <p class="hint">Our kitchen serves Zimbabwean classics — sadza with kapenta, sausage, fish and pork, fresh from local markets.</p>
      <div class="grid">
        <div class="tile"><img src="/images/food-sadza-meat.jpg" alt="Sadza and meat" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Lunch favourite:</b> Sadza &amp; slow-cooked beef</div>
        <div class="tile"><img src="/images/food-capenta.jpg" alt="Kapenta and sadza" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Local classic:</b> Stewed kapenta &amp; sadza</div>
        <div class="tile"><img src="/images/food-sadza-fish.jpg" alt="Sadza and fish" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Dinner plate:</b> Sadza &amp; Zambezi fish</div>
        <div class="tile"><img src="/images/food-sadza-sausage.jpg" alt="Sadza and sausage" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>House special:</b> Sadza, sausage &amp; greens</div>
      </div>
      <div class="row">
        <label>Date <input type="date" [(ngModel)]="date" /></label>
        <label>Meal
          <select [(ngModel)]="mealType">
            <option [value]="0">Lunch (12:30)</option>
            <option [value]="1">Dinner (19:30)</option>
          </select>
        </label>
        <label>Party <input type="number" min="1" [(ngModel)]="partySize" style="width:70px" /></label>
        <button (click)="search()">Find tables</button>
      </div>
      <div class="row">
        <input placeholder="Guest name" [(ngModel)]="guestName" />
        <input placeholder="Email" [(ngModel)]="email" />
        <input placeholder="Phone" [(ngModel)]="phone" />
        <input placeholder="Special requests" [(ngModel)]="requests" />
      </div>
      @if (msg) { <p class="ok">{{ msg }}</p> }
      @if (error) { <p class="error">{{ error }}</p> }
      <div class="grid">
        @for (t of tables(); track t.id) {
          <div class="tile">
            <h3>Table {{ t.tableNumber }} ({{ t.seats }} seats)</h3>
            <p>{{ t.location }}</p>
            <button [disabled]="!auth.isLoggedIn" (click)="book(t.id)">Book {{ mealType == 0 ? 'lunch' : 'dinner' }}</button>
          </div>
        }
      </div>
      <button class="ghost" [disabled]="!auth.isLoggedIn" (click)="book(undefined)">Book without table preference</button>
    </div>
  `,
})
export class DiningComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  tables = signal<any[]>([]);
  date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  mealType = 1;
  partySize = 2;
  guestName = ''; email = ''; phone = ''; requests = '';
  msg = ''; error = '';

  search() {
    this.msg = ''; this.error = '';
    this.api.getAvailableTables(this.date, +this.mealType, this.partySize).subscribe({
      next: (d) => { this.tables.set(d); this.msg = `${d.length} tables available`; },
      error: (e) => (this.error = e.error ?? 'Search failed'),
    });
  }
  book(tableId?: number) {
    this.api.bookDining({
      bookingDate: this.date, mealType: +this.mealType, bookingTime: null,
      partySize: +this.partySize, tableId: tableId ?? null,
      guestName: this.guestName, email: this.email, phone: this.phone,
      specialRequests: this.requests || null,
    }).subscribe({
      next: () => (this.msg = 'Table booked! See My bookings.'),
      error: (e) => (this.error = e.error ?? 'Booking failed'),
    });
  }
}
