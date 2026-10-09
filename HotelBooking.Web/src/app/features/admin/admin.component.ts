import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h2>Admin console</h2>
      <div class="row">
        @for (t of tabs; track t) {
          <button [class.ghost]="tab !== t" (click)="tab = t; loadTab()">{{ t }}</button>
        }
      </div>
      @if (msg) { <p class="ok">{{ msg }}</p> }
      @if (error) { <p class="error">{{ error }}</p> }

      @if (tab === 'Bookings') {
        <button class="ghost" (click)="reload()">Refresh</button>
        <h3>Rooms ({{ rooms().length }})</h3>
        @for (b of rooms(); track b.id) {
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · Room {{ b.room?.roomNumber }} · {{ b.checkIn.slice(0,10) }}→{{ b.checkOut.slice(0,10) }} · \${{ b.totalPrice }} · {{ b.paymentStatus === 2 ? 'Paid' : b.paymentStatus === 1 ? 'Deposit' : 'Unpaid' }}</span></div>
        }
        <h3>Activities ({{ activities().length }})</h3>
        @for (b of activities(); track b.id) {
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · {{ b.activity?.name }} · {{ b.slotStart.replace('T',' ') }} ×{{ b.participants }}</span></div>
        }
        <h3>Dining ({{ dining().length }})</h3>
        @for (b of dining(); track b.id) {
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · {{ b.bookingDate.slice(0,10) }} {{ b.mealType === 0 ? 'Lunch' : 'Dinner' }} ×{{ b.partySize }} · T{{ b.table?.tableNumber ?? '—' }}</span></div>
        }
      }

      @if (tab === 'Catalog') {
        <h3>Rooms <button class="ghost" (click)="reloadCatalog()">Refresh</button></h3>
        @for (r of catalogRooms(); track r.id) {
          <div class="line"><span>Room {{ r.roomNumber }} ({{ r.roomType }}, floor {{ r.floor }})</span>
          <button class="ghost" (click)="deactivateRoom(r.id)">Deactivate</button></div>
        }
        <div class="row">
          <input placeholder="Number" [(ngModel)]="newRoom.number" style="width:90px" />
          <input placeholder="Floor" type="number" [(ngModel)]="newRoom.floor" style="width:80px" />
          <select [(ngModel)]="newRoom.typeId">@for (t of roomTypes(); track t.id) { <option [value]="t.id">{{ t.name }}</option> } </select>
          <button (click)="addRoom()">Add room</button>
        </div>
        <h3>Room types</h3>
        @for (t of roomTypes(); track t.id) {
          <div class="line"><span>{{ t.name }} · \${{ t.pricePerNight }}/night · max {{ t.maxGuests }}</span></div>
        }
        <div class="row">
          <input placeholder="Name" [(ngModel)]="newType.name" />
          <input placeholder="Price/night" type="number" [(ngModel)]="newType.price" style="width:110px" />
          <input placeholder="Max guests" type="number" [(ngModel)]="newType.guests" style="width:100px" />
          <input placeholder="Amenities" [(ngModel)]="newType.amenities" />
          <button (click)="addType()">Add type</button>
        </div>
        <h3>Activities</h3>
        @for (a of catalogActivities(); track a.id) {
          <div class="line"><span>{{ a.name }} · \${{ a.pricePerPerson }}/person · cap {{ a.capacity }}</span>
          <button class="ghost" (click)="deactivateActivity(a.id)">Deactivate</button></div>
        }
        <div class="row">
          <input placeholder="Name" [(ngModel)]="newActivity.name" />
          <input placeholder="Price/person" type="number" [(ngModel)]="newActivity.price" style="width:110px" />
          <input placeholder="Capacity" type="number" [(ngModel)]="newActivity.capacity" style="width:100px" />
          <input placeholder="Location" [(ngModel)]="newActivity.location" />
          <button (click)="addActivity()">Add activity</button>
        </div>
        <h3>Tables</h3>
        @for (t of tables(); track t.id) {
          <div class="line"><span>Table {{ t.tableNumber }} · {{ t.seats }} seats · {{ t.location }}</span>
          <button class="ghost" (click)="deactivateTable(t.id)">Deactivate</button></div>
        }
        <div class="row">
          <input placeholder="Number" [(ngModel)]="newTable.number" style="width:90px" />
          <input placeholder="Seats" type="number" [(ngModel)]="newTable.seats" style="width:80px" />
          <input placeholder="Location" [(ngModel)]="newTable.location" />
          <button (click)="addTable()">Add table</button>
        </div>
      }

      @if (tab === 'Reports') {
        <button class="ghost" (click)="loadReports()">Refresh</button>
        @if (reports) {
          <h3>This month: {{ reports.occupancyByMonth.at(-1)?.rate }}% occupancy</h3>
          <h3>Revenue by month</h3>
          @for (r of reports.roomRevenueByMonth; track r.month) {
            <div class="line"><span>{{ r.month }} rooms \${{ r.revenue }}</span></div>
          }
          @for (r of reports.activityRevenueByMonth; track r.month) {
            <div class="line"><span>{{ r.month }} activities \${{ r.revenue }}</span></div>
          }
          <h3>Counts</h3>
          <p>Rooms: {{ reports.counts.roomsTotal }} total · {{ reports.counts.roomsUpcoming }} upcoming · {{ reports.counts.roomsCancelled }} cancelled ·
             Activities: {{ reports.counts.activitiesTotal }} · Dining: {{ reports.counts.diningTotal }} ·
             Payments collected: \${{ reports.counts.paidTotal }}</p>
          <h3>Top activities</h3>
          @for (t of reports.topActivities; track t.name) {
            <div class="line"><span>{{ t.name }} · {{ t.bookings }} bookings · \${{ t.revenue }}</span></div>
          }
          <h3>Recent payments</h3>
          @for (p of reports.recentPayments; track p.id) {
            <div class="line"><span>{{ p.reference }} · {{ p.bookingKind }} #{{ p.bookingId }} · \${{ p.amount }} · {{ p.method }}</span></div>
          }
        }
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  api = inject(ApiService);
  tabs = ['Bookings', 'Catalog', 'Reports'];
  tab = 'Bookings';
  msg = ''; error = '';
  rooms = signal<any[]>([]);
  activities = signal<any[]>([]);
  dining = signal<any[]>([]);
  catalogRooms = signal<any[]>([]);
  catalogActivities = signal<any[]>([]);
  roomTypes = signal<any[]>([]);
  tables = signal<any[]>([]);
  reports: any = null;
  newRoom: any = { number: '', floor: 1, typeId: 1 };
  newType: any = { name: '', price: 100, guests: 2, amenities: '' };
  newActivity: any = { name: '', price: 30, capacity: 10, location: '' };
  newTable: any = { number: '', seats: 2, location: 'Indoor' };

  ngOnInit() { this.reload(); }
  loadTab() {
    this.msg = ''; this.error = '';
    if (this.tab === 'Bookings') this.reload();
    if (this.tab === 'Catalog') this.reloadCatalog();
    if (this.tab === 'Reports') this.loadReports();
  }
  reload() {
    this.api.allRoomBookings().subscribe({ next: (d) => this.rooms.set(d) });
    this.api.allActivityBookings().subscribe({ next: (d) => this.activities.set(d) });
    this.api.allDiningBookings().subscribe({ next: (d) => this.dining.set(d) });
  }
  reloadCatalog() {
    this.api.getRooms().subscribe({ next: (d) => this.catalogRooms.set(d) });
    this.api.getActivities().subscribe({ next: (d) => this.catalogActivities.set(d) });
    this.api.getRoomTypes().subscribe({ next: (d) => { this.roomTypes.set(d); if (d.length && !this.newRoom.typeId) this.newRoom.typeId = d[0].id; } });
    this.api.getTables().subscribe({ next: (d) => this.tables.set(d) });
  }
  loadReports() {
    this.api.reportsSummary().subscribe({ next: (d) => (this.reports = d), error: () => (this.error = 'Reports failed.') });
  }
  ok(m: string) { this.msg = m; this.error = ''; }
  fail(e: any) { this.error = e.error ?? 'Operation failed.'; }
  addRoom() {
    this.api.createRoom({ roomNumber: this.newRoom.number, floor: +this.newRoom.floor, roomTypeId: +this.newRoom.typeId })
      .subscribe({ next: () => { this.ok('Room added.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  deactivateRoom(id: number) {
    this.api.deleteRoom(id).subscribe({ next: () => { this.ok('Room deactivated.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  addType() {
    this.api.createRoomType({ name: this.newType.name, description: '', pricePerNight: +this.newType.price, maxGuests: +this.newType.guests, amenities: this.newType.amenities })
      .subscribe({ next: () => { this.ok('Room type added.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  addActivity() {
    this.api.createActivity({ name: this.newActivity.name, description: '', location: this.newActivity.location, pricePerPerson: +this.newActivity.price, capacity: +this.newActivity.capacity, durationMinutes: 60, imageUrl: null })
      .subscribe({ next: () => { this.ok('Activity added.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  deactivateActivity(id: number) {
    this.api.deleteActivity(id).subscribe({ next: () => { this.ok('Activity deactivated.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  addTable() {
    this.api.createTable({ tableNumber: this.newTable.number, seats: +this.newTable.seats, location: this.newTable.location })
      .subscribe({ next: () => { this.ok('Table added.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
  deactivateTable(id: number) {
    this.api.deleteTable(id).subscribe({ next: () => { this.ok('Table deactivated.'); this.reloadCatalog(); }, error: (e) => this.fail(e) });
  }
}
