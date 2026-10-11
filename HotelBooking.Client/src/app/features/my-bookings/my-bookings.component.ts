import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h2>My bookings</h2>
      @if (payMsg) { <p class="ok">{{ payMsg }}</p> }
      @if (payErr) { <p class="error">{{ payErr }}</p> }
      <h3>Rooms</h3>
      @for (b of rooms(); track b.id) {
        <div class="line"><span><b>{{ b.reference }}</b> Room {{ b.room?.roomNumber }} {{ b.checkIn.slice(0,10) }} → {{ b.checkOut.slice(0,10) }} · \${{ b.totalPrice }} · {{ status(b.status) }} · {{ payStatus(b.paymentStatus) }} (paid \${{ b.amountPaid }})</span>
        <span>
          @if (b.status !== 2 && b.balance > 0) { <button (click)="startPay('room', b)">Pay</button> }
          @if (b.status !== 2) { <button class="ghost" (click)="cancelRoom(b.id)">Cancel</button> }
          @if (bizNumber) { <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waAbout('room', b.reference)">WhatsApp</a> }
        </span></div>
        @if (payFor?.kind === 'room' && payFor?.id === b.id) {
          <div class="row">
            <label>Method <select [(ngModel)]="payMethod"><option>EcoCash</option><option>PayNow</option><option>Card</option><option>Mock</option></select></label>
            <label>Amount <input type="number" min="1" [(ngModel)]="payAmount" style="width:110px" /></label>
            <button (click)="doPay()">Pay now</button>
            <button class="ghost" (click)="payFor = null">Close</button>
          </div>
        }
      } @empty { <p>No room bookings.</p> }
      <h3>Activities</h3>
      @for (b of activities(); track b.id) {
        <div class="line"><span><b>{{ b.reference }}</b> {{ b.activity?.name }} {{ b.slotStart.replace('T',' ') }} × {{ b.participants }} · \${{ b.totalPrice }} · {{ status(b.status) }} · {{ payStatus(b.paymentStatus) }} (paid \${{ b.amountPaid }})</span>
        <span>
          @if (b.status !== 2 && b.balance > 0) { <button (click)="startPay('activity', b)">Pay</button> }
          @if (b.status !== 2) { <button class="ghost" (click)="cancelActivity(b.id)">Cancel</button> }
          @if (bizNumber) { <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waAbout('activity', b.reference)">WhatsApp</a> }
        </span></div>
        @if (payFor?.kind === 'activity' && payFor?.id === b.id) {
          <div class="row">
            <label>Method <select [(ngModel)]="payMethod"><option>EcoCash</option><option>PayNow</option><option>Card</option><option>Mock</option></select></label>
            <label>Amount <input type="number" min="1" [(ngModel)]="payAmount" style="width:110px" /></label>
            <button (click)="doPay()">Pay now</button>
            <button class="ghost" (click)="payFor = null">Close</button>
          </div>
        }
      } @empty { <p>No activity bookings.</p> }
      <h3>Dining</h3>
      @for (b of dining(); track b.id) {
        <div class="line"><span><b>{{ b.reference }}</b> {{ b.bookingDate.slice(0,10) }} {{ b.mealType === 0 ? 'Lunch' : 'Dinner' }} × {{ b.partySize }} · Table {{ b.table?.tableNumber ?? '—' }} · {{ status(b.status) }} · free</span>
        <span>
          @if (b.status !== 2) { <button class="ghost" (click)="cancelDining(b.id)">Cancel</button> }
          @if (bizNumber) { <a class="btn ghost" style="padding:9px 16px" target="_blank" rel="noopener" [href]="waAbout('dining', b.reference)">WhatsApp</a> }
        </span></div>
      } @empty { <p>No dining bookings.</p> }
    </div>
  `,
})
export class MyBookingsComponent implements OnInit {
  api = inject(ApiService);
  rooms = signal<any[]>([]);
  activities = signal<any[]>([]);
  dining = signal<any[]>([]);
  payFor: { kind: string; id: number } | null = null;
  payMethod = 'EcoCash';
  payAmount = 0;
  payMsg = '';
  payErr = '';
  bizNumber = '';

  ngOnInit() {
    this.reload();
    this.api.siteConfig().subscribe({ next: (c) => (this.bizNumber = c.whatsappEnabled ? c.whatsappNumber : '') });
  }
  waAbout(kind: string, reference: string): string {
    const text = encodeURIComponent(`Hi Kudzis Bookings! About my ${kind} booking ${reference}.`);
    return `https://wa.me/${this.bizNumber}?text=${text}`;
  }
  status(s: number) { return s === 0 ? 'Pending' : s === 1 ? 'Confirmed' : 'Cancelled'; }
  payStatus(s: number) { return s === 0 ? 'Unpaid' : s === 1 ? 'Deposit paid' : s === 2 ? 'Paid' : 'Refunded'; }
  reload() {
    this.api.myRoomBookings().subscribe({ next: (d) => this.rooms.set(d.map((x: any) => ({ ...x, balance: x.totalPrice - x.amountPaid }))) });
    this.api.myActivityBookings().subscribe({ next: (d) => this.activities.set(d.map((x: any) => ({ ...x, balance: x.totalPrice - x.amountPaid }))) });
    this.api.myDiningBookings().subscribe({ next: (d) => this.dining.set(d) });
  }
  startPay(kind: string, b: any) {
    this.payMsg = ''; this.payErr = '';
    this.payFor = { kind, id: b.id };
    this.api.initiatePayment(kind, b.id).subscribe({
      next: (r) => {
        this.payAmount = r.depositDue > 0 ? r.depositDue : r.balance;
      },
      error: () => (this.payErr = 'Could not start payment.'),
    });
  }
  doPay() {
    if (!this.payFor) return;
    const { kind, id } = this.payFor;
    this.api.confirmPayment(kind, id, this.payMethod, +this.payAmount).subscribe({
      next: (r) => { this.payMsg = `Payment ${r.paymentReference} accepted. Balance $${r.balance}.`; this.payFor = null; this.reload(); },
      error: (e) => (this.payErr = e.error?.error ?? e.error ?? 'Payment failed.'),
    });
  }
  cancelRoom(id: number) { this.api.cancelRoomBooking(id).subscribe({ next: () => this.reload() }); }
  cancelActivity(id: number) { this.api.cancelActivityBooking(id).subscribe({ next: () => this.reload() }); }
  cancelDining(id: number) { this.api.cancelDiningBooking(id).subscribe({ next: () => this.reload() }); }
}
