import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

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
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · Room {{ b.room?.roomNumber }} · {{ b.checkIn.slice(0,10) }}→{{ b.checkOut.slice(0,10) }} · \${{ b.totalPrice }} · {{ b.paymentStatus === 2 ? 'Paid' : b.paymentStatus === 1 ? 'Deposit' : 'Unpaid' }}</span>
          <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waGuest(b.phone, 'Hi ' + b.guestName + '! Kudzis Bookings here about your stay ' + b.reference + ' (' + b.checkIn.slice(0,10) + ' to ' + b.checkOut.slice(0,10) + ').')">WhatsApp</a></div>
        }
        <h3>Activities ({{ activities().length }})</h3>
        @for (b of activities(); track b.id) {
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · {{ b.activity?.name }} · {{ b.slotStart.replace('T',' ') }} ×{{ b.participants }}</span>
          <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waGuest(b.phone, 'Hi ' + b.guestName + '! Kudzis Bookings here about ' + b.activity?.name + ' ' + b.reference + '.')">WhatsApp</a></div>
        }
        <h3>Dining ({{ dining().length }})</h3>
        @for (b of dining(); track b.id) {
          <div class="line"><span><b>{{ b.reference }}</b> {{ b.guestName }} · {{ b.bookingDate.slice(0,10) }} {{ b.mealType === 0 ? 'Lunch' : 'Dinner' }} ×{{ b.partySize }} · T{{ b.table?.tableNumber ?? '—' }}</span>
          <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waGuest(b.phone, 'Hi ' + b.guestName + '! Kudzis Bookings here about your table ' + b.reference + ' on ' + b.bookingDate.slice(0,10) + '.')">WhatsApp</a></div>
        }
      }

      @if (tab === 'Requests') {
        <button class="ghost" (click)="reloadRequests()">Refresh</button>
        <div class="row">
          <label>Filter <select [(ngModel)]="reqFilter" (change)="reloadRequests()">
            <option value="">All</option><option value="New">New</option><option value="Handled">Handled</option>
          </select></label>
        </div>
        @for (r of requests(); track r.id) {
          <div class="tile" style="margin-bottom:10px">
            <b>{{ r.kind }} request #{{ r.id }}</b> · {{ r.status }} · {{ r.createdAt.replace('T',' ').slice(0,16) }}<br />
            <span>{{ r.name }} · {{ r.email }} · {{ r.phone }}</span>
            <p style="white-space:pre-wrap">{{ r.preferences }}</p>
            <div class="row">
              @if (r.status === 'New') { <button (click)="handleRequest(r.id)">Mark handled</button> }
              <a class="btn ghost" target="_blank" rel="noopener" [href]="waGuest(r.phone, 'Hi ' + r.name + '! Kudzis Bookings here about your ' + r.kind + ' request.')">WhatsApp guest</a>
            </div>
          </div>
        } @empty { <p>No requests.</p> }
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

      @if (tab === 'Reviews') {
        <button class="ghost" (click)="reloadReviews()">Refresh</button>
        @for (r of reviews(); track r.id) {
          <div class="tile" style="margin-bottom:10px">
            <b>{{ r.guestName }}</b> · {{ r.kind }}{{ r.target ? ' · ' + r.target : '' }} · {{ '★★★★★'.slice(0, r.rating) }} · {{ r.approved ? 'visible' : 'hidden' }}<br />
            <span class="hint">{{ r.createdAt.replace('T',' ').slice(0,16) }}{{ r.bookingReference ? ' · ref ' + r.bookingReference : '' }}</span>
            <p style="white-space:pre-wrap">{{ r.comment }}</p>
            <div class="row">
              <button class="ghost" (click)="moderateReview(r.id, !r.approved)">{{ r.approved ? 'Hide' : 'Approve' }}</button>
              <button class="ghost" (click)="deleteReview(r.id)">Delete</button>
            </div>
          </div>
        } @empty { <p>No reviews.</p> }
      }

      @if (tab === 'Users') {
        @if (isAdmin) {
          <button class="ghost" (click)="reloadUsers()">Refresh</button>
          <h3>Team accounts</h3>
          @for (u of users(); track u.id) {
            <div class="line"><span>{{ u.fullName }} · {{ u.email }} · {{ (u.roles ?? []).join(', ') }}</span>
            <span>
              <select [ngModel]="currentRole(u)" (ngModelChange)="changeRole(u.id, $event)">
                <option>Guest</option><option>Staff</option><option>Admin</option>
              </select>
            </span></div>
          }
          <h3>Add staff / admin</h3>
          <div class="row">
            <input placeholder="Full name" [(ngModel)]="newUser.name" />
            <input placeholder="Email" [(ngModel)]="newUser.email" type="email" />
            <input placeholder="Password (min 6)" [(ngModel)]="newUser.password" type="password" />
            <select [(ngModel)]="newUser.role"><option>Staff</option><option>Admin</option></select>
            <button (click)="addUser()">Create account</button>
          </div>
        } @else { <p>Admins only.</p> }
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  api = inject(ApiService);
  private auth = inject(AuthService);
  tabs = ['Bookings', 'Requests', 'Catalog', 'Reports', 'Reviews', 'Users'];
  tab = 'Bookings';
  msg = ''; error = '';
  rooms = signal<any[]>([]);
  activities = signal<any[]>([]);
  dining = signal<any[]>([]);
  catalogRooms = signal<any[]>([]);
  catalogActivities = signal<any[]>([]);
  roomTypes = signal<any[]>([]);
  tables = signal<any[]>([]);
  requests = signal<any[]>([]);
  reqFilter = '';
  reviews = signal<any[]>([]);
  users = signal<any[]>([]);
  newUser: any = { name: '', email: '', password: '', role: 'Staff' };
  reports: any = null;
  newRoom: any = { number: '', floor: 1, typeId: 1 };
  newType: any = { name: '', price: 100, guests: 2, amenities: '' };
  newActivity: any = { name: '', price: 30, capacity: 10, location: '' };
  newTable: any = { number: '', seats: 2, location: 'Indoor' };

  ngOnInit() { this.reload(); }
  get isAdmin() { return this.auth.isAdmin; }
  waGuest(phone: string, text: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('0') ? '263' + digits.slice(1) : digits;
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
  }
  loadTab() {
    this.msg = ''; this.error = '';
    if (this.tab === 'Bookings') this.reload();
    if (this.tab === 'Requests') this.reloadRequests();
    if (this.tab === 'Catalog') this.reloadCatalog();
    if (this.tab === 'Reports') this.loadReports();
    if (this.tab === 'Reviews') this.reloadReviews();
    if (this.tab === 'Users') this.reloadUsers();
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
  reloadRequests() {
    this.api.bookingRequests(this.reqFilter || undefined).subscribe({ next: (d) => this.requests.set(d) });
  }
  handleRequest(id: number) {
    this.api.handleBookingRequest(id).subscribe({ next: () => { this.ok('Request marked handled.'); this.reloadRequests(); }, error: (e) => this.fail(e) });
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
  reloadReviews() {
    this.api.getReviews().subscribe({ next: (d) => this.reviews.set(d) });
  }
  moderateReview(id: number, approved: boolean) {
    this.api.moderateReview(id, approved).subscribe({ next: () => this.reloadReviews(), error: (e) => this.fail(e) });
  }
  deleteReview(id: number) {
    this.api.deleteReview(id).subscribe({ next: () => { this.ok('Review deleted.'); this.reloadReviews(); }, error: (e) => this.fail(e) });
  }
  reloadUsers() {
    this.api.listUsers().subscribe({ next: (d) => this.users.set(d), error: () => (this.error = 'Admins only.') });
  }
  currentRole(u: any): string { return (u.roles ?? [])[0] ?? 'Guest'; }
  changeRole(id: string, role: string) {
    this.api.changeUserRole(id, role).subscribe({ next: () => { this.ok('Role updated.'); this.reloadUsers(); }, error: (e) => this.fail(e) });
  }
  addUser() {
    this.api.createUser({ email: this.newUser.email, password: this.newUser.password, fullName: this.newUser.name, role: this.newUser.role })
      .subscribe({ next: () => { this.ok('Account created.'); this.newUser = { name: '', email: '', password: '', role: 'Staff' }; this.reloadUsers(); }, error: (e) => this.fail(e) });
  }
}
