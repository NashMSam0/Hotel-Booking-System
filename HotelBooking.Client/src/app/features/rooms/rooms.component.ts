import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page"><div class="card">
      <h2>Our Hotels</h2>
      <p class="hint">Handpicked stays across Zimbabwe — pick one to send a booking request, no account needed.</p>
      <div class="grid">
        @for (h of hotels; track h.name) {
          <div class="tile"><img [src]="h.img" [alt]="h.name" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>{{ h.name }}</b><br /><small class="hint">{{ h.place }}</small>
          <div class="row"><button class="btn" (click)="selectHotel(h.name)">Select this hotel</button></div></div>
        }
      </div>
    </div><div class="card">
      <h2>Hotels — Find Your Stay</h2>
      <p class="hint">Browse availability, then select a room to send a booking request — no account needed.</p>
      <h3>Availability calendar <small class="hint">(green = rooms free)</small></h3>
      <div class="row">
        <button class="ghost" (click)="shiftMonth(-1)">‹ Prev</button>
        <b>{{ calYear }}-{{ calMonth < 10 ? '0' + calMonth : calMonth }}</b>
        <button class="ghost" (click)="shiftMonth(1)">Next ›</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;max-width:640px;">
        @for (d of ['Mo','Tu','We','Th','Fr','Sa','Su']; track d) { <small class="hint" style="text-align:center">{{ d }}</small> }
        @for (pad of pads(); track $index) { <span></span> }
        @for (d of cal(); track d.date) {
          <button [disabled]="d.free === 0 || d.date < today" (click)="pickDay(d.date)"
            title="{{ d.date }}: {{ d.free }}/{{ d.total }} free{{ d.fromPrice ? ', from $' + d.fromPrice : '' }}"
            style="border:1px solid #e4eaf6;border-radius:8px;padding:8px 4px;cursor:pointer;color:#111;"
            [style.background]="d.free === 0 ? '#fecaca' : d.free <= 1 ? '#fef3c7' : '#bbf7d0'">{{ d.date.slice(8) }}</button>
        }
      </div>
      <div class="row">
        <label>Check-in <input type="date" [(ngModel)]="checkIn" /></label>
        <label>Check-out <input type="date" [(ngModel)]="checkOut" /></label>
        <label>Guests <input type="number" min="1" [(ngModel)]="guests" style="width:70px" /></label>
        <button (click)="search()">Search available</button>
        <button class="ghost" (click)="loadAll()">Show all</button>
      </div>
      @if (msg) { <p class="ok">{{ msg }}</p> }
      @if (error) { <p class="error">{{ error }}</p> }
      <div class="grid">
        @for (r of rooms(); track r.id) {
          <div class="tile">
            @if (r.roomTypeImage) { <img [src]="r.roomTypeImage" [alt]="r.roomType" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" /> }
            <h3>Room {{ r.roomNumber }} — {{ r.roomType }}</h3>
            <p>\${{ r.pricePerNight }}/night · max {{ r.maxGuests }} guests · floor {{ r.floor }}</p>
            <div class="row">
              <button class="btn" (click)="select(r)">Select this room</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class RoomsComponent implements OnInit {
  api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  rooms = signal<any[]>([]);
  hotels = [
    { name: 'Victoria Falls Hotel', img: '/images/hotel-vicfalls.jpg', place: 'Victoria Falls · historic luxury' },
    { name: 'The Grand Entrance', img: '/images/hotel-entrance.jpg', place: 'Victoria Falls · colonial charm' },
    { name: 'Palm Gardens Wing', img: '/images/hotel-grounds.jpg', place: 'Victoria Falls · garden views' },
    { name: 'Heritage Block, est. 1904', img: '/images/hotel-heritage.jpg', place: 'Victoria Falls · landmark stay' },
    { name: 'Robins Safari Camp', img: '/images/hotel-robins.jpg', place: 'Hwange · bush camp' },
    { name: 'Maleme Rest Camp', img: '/images/hotel-maleme.jpg', place: 'Matobo Hills · hillside retreat' },
  ];
  checkIn = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  checkOut = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  guests = 2;
  msg = ''; error = '';
  cal = signal<any[]>([]);
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth() + 1;
  today = new Date().toISOString().slice(0, 10);

  pads() {
    const first = new Date(this.calYear, this.calMonth - 1, 1).getDay(); // 0=Sun
    return new Array((first + 6) % 7); // Monday-first blanks
  }
  loadCal() {
    this.api.roomCalendar(this.calYear, this.calMonth, this.guests).subscribe({ next: (d) => this.cal.set(d) });
  }
  shiftMonth(n: number) {
    let m = this.calMonth + n;
    let y = this.calYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    this.calMonth = m; this.calYear = y;
    this.loadCal();
  }
  pickDay(date: string) {
    this.checkIn = date;
    const out = new Date(date + 'T12:00:00');
    out.setDate(out.getDate() + 2);
    this.checkOut = out.toISOString().slice(0, 10);
    this.search();
  }

  ngOnInit() {
    const q = this.route.snapshot.queryParams;
    if (q['checkIn']) this.checkIn = q['checkIn'];
    if (q['checkOut']) this.checkOut = q['checkOut'];
    if (q['guests']) this.guests = +q['guests'];
    if (q['checkIn'] && q['checkOut']) this.search();
    else this.loadAll();
    this.loadCal();
  }
  loadAll() {
    this.api.getRooms().subscribe({ next: (d) => { this.rooms.set(d); } });
  }
  search() {
    this.msg = ''; this.error = '';
    this.api.getAvailableRooms(this.checkIn, this.checkOut, this.guests).subscribe({
      next: (d) => { this.rooms.set(d); this.msg = `${d.length} rooms available`; this.loadCal(); },
      error: (e) => (this.error = e.error ?? 'Search failed'),
    });
  }
  selectHotel(name: string) {
    this.router.navigate(['/request-booking'], { queryParams: { kind: 'room', hotel: name } });
  }
  select(r: any) {
    this.router.navigate(['/request-booking'], {
      queryParams: {
        kind: 'room', roomType: r.roomType, roomNumber: r.roomNumber,
        checkIn: this.checkIn, checkOut: this.checkOut, guests: this.guests,
      },
    });
  }
}
