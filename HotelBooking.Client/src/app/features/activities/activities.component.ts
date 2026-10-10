import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activities',
  standalone: true,
  template: `
    <div class="page"><div class="card">
      <h2>Activities</h2>
      <p class="hint">Pick an experience and send a booking request — no account needed. Our team confirms availability by email.</p>
      @if (error) { <p class="error">{{ error }}</p> }
      <div class="grid">
        @for (a of activities(); track a.id) {
          <div class="tile">
            @if (a.imageUrl) { <img [src]="a.imageUrl" [alt]="a.name" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:8px;" /> }
            <h3>{{ a.name }} — \${{ a.pricePerPerson }}/person</h3>
            <p>{{ a.description }} · {{ a.location }} · {{ a.durationMinutes }} min · max {{ a.capacity }} per slot</p>
            <div class="row"><button class="btn" (click)="select(a)">Select this activity</button></div>
          </div>
        } @empty { <p>No activities right now — check back soon.</p> }
      </div>
    </div></div>
  `,
})
export class ActivitiesComponent implements OnInit {
  api = inject(ApiService);
  private router = inject(Router);
  activities = signal<any[]>([]);
  error = '';
  ngOnInit() {
    this.api.getActivities().subscribe({
      next: (d) => this.activities.set(d),
      error: (e) => (this.error = e.error ?? 'Could not load activities.'),
    });
  }
  select(a: any) {
    this.router.navigate(['/request-booking'], { queryParams: { kind: 'activity', activity: a.name } });
  }
}
