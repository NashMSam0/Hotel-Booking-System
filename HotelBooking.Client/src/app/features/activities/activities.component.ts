import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h2>Experiences Showcase</h2>
      <p class="hint">A taste of what awaits — the smoke that thunders, elephant country, ancient cities and wild rivers.</p>
      <div class="grid">
        <div class="tile"><img src="/images/fallsdeal.jpg" alt="Victoria Falls" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Falls rainforest walk</b></div>
        <div class="tile"><img src="/images/act-cruise.jpg" alt="Zambezi sunset cruise" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Zambezi sunset cruise</b></div>
        <div class="tile"><img src="/images/safarideal.jpg" alt="Hwange game drive" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Hwange game drive</b></div>
        <div class="tile"><img src="/images/act-bungy.jpg" alt="Bridge bungee jump" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Bridge bungee jump</b></div>
        <div class="tile"><img src="/images/greatzim.jpg" alt="Great Zimbabwe" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Great Zimbabwe ruins</b></div>
        <div class="tile"><img src="/images/hwange.jpg" alt="Hwange elephants" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" /><b>Elephant country</b></div>
      </div>
    </div>
    <div class="card">
      <h2>Activities</h2>
      @if (error) { <p class="error">{{ error }}</p> }
      @if (msg) { <p class="ok">{{ msg }}</p> }
      <div class="grid">
        @for (a of activities(); track a.id) {
          <div class="tile">
            @if (a.imageUrl) { <img [src]="a.imageUrl" [alt]="a.name" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" /> }
            <h3>{{ a.name }} — \${{ a.pricePerPerson }}/person</h3>
            <p>{{ a.description }} · {{ a.location }} · {{ a.durationMinutes }} min · cap {{ a.capacity }}</p>
            <div class="row">
              <label>Slot <input type="datetime-local" [(ngModel)]="form[a.id].slot" /></label>
              <label>People <input type="number" min="1" [(ngModel)]="form[a.id].participants" style="width:70px" /></label>
              <button class="ghost" (click)="viewSlots(a)">Day slots</button>
            </div>
            @if (slots()[a.id]?.length) {
              <div class="row">
                @for (s of slots()[a.id]; track s.slot) {
                  <button class="ghost" [disabled]="s.remaining < form[a.id].participants"
                    (click)="form[a.id].slot = s.slot.slice(0,16)"
                    title="{{ s.booked }}/{{ s.capacity }} taken">{{ s.slot.slice(11,16) }} ({{ s.remaining }} left)</button>
                }
              </div>
            }
            <div class="row">
              <input placeholder="Guest name" [(ngModel)]="form[a.id].guestName" />
              <input placeholder="Email" [(ngModel)]="form[a.id].email" />
              <input placeholder="Phone" [(ngModel)]="form[a.id].phone" />
              <button [disabled]="!auth.isLoggedIn" (click)="book(a)">Book</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ActivitiesComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  activities = signal<any[]>([]);
  form: Record<number, any> = {};
  slots = signal<Record<number, any[]>>({});
  msg = ''; error = '';
  ngOnInit() {
    this.api.getActivities().subscribe({ next: (d) => {
      this.activities.set(d);
      d.forEach((a) => (this.form[a.id] = {
        slot: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        participants: 2, guestName: this.auth.user?.fullName ?? '',
        email: this.auth.user?.email ?? '', phone: '',
      }));
    }});
  }
  book(a: any) {
    const f = this.form[a.id];
    this.api.bookActivity({ activityId: a.id, slotStart: f.slot, participants: +f.participants, guestName: f.guestName, email: f.email, phone: f.phone })
      .subscribe({
        next: () => (this.msg = `${a.name} booked for ${f.slot}!`),
        error: (e) => (this.error = e.error ?? 'Booking failed'),
      });
  }
  viewSlots(a: any) {
    const date = (this.form[a.id].slot as string).slice(0, 10);
    this.api.activitySlots(a.id, date).subscribe({
      next: (d) => this.slots.update((s) => ({ ...s, [a.id]: d })),
      error: (e) => (this.error = e.error ?? 'Could not load slots.'),
    });
  }
}
