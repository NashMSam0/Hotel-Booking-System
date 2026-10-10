import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

interface Dish { name: string; img: string; meal: string; blurb: string; }

@Component({
  selector: 'app-dining',
  standalone: true,
  template: `
    <div class="page"><div class="card">
      <h2>Lunch &amp; Dinner</h2>
      <p class="hint">Our kitchen serves Zimbabwean classics — pick a dish and send a booking request, no account needed. Our team confirms by email.</p>
      <div class="grid">
        @for (d of dishes; track d.name) {
          <div class="tile">
            <img [src]="d.img" [alt]="d.name" loading="lazy" style="width:100%;height:170px;object-fit:cover;border-radius:8px;" />
            <b>{{ d.blurb }}:</b> {{ d.name }} <small class="hint">· {{ d.meal }}</small>
            <div class="row"><button class="btn" (click)="select(d)">Select this {{ d.meal.toLowerCase() }}</button></div>
          </div>
        }
      </div>
    </div></div>
  `,
})
export class DiningComponent {
  private router = inject(Router);
  dishes: Dish[] = [
    { name: 'Sadza & slow-cooked beef', img: '/images/food-sadza-meat.jpg', meal: 'Lunch', blurb: 'Lunch favourite' },
    { name: 'Stewed kapenta & sadza', img: '/images/food-capenta.jpg', meal: 'Lunch', blurb: 'Local classic' },
    { name: 'Sadza & Zambezi fish', img: '/images/food-sadza-fish.jpg', meal: 'Dinner', blurb: 'Dinner plate' },
    { name: 'Sadza, sausage & greens', img: '/images/food-sadza-sausage.jpg', meal: 'Dinner', blurb: 'House special' },
  ];
  select(d: Dish) {
    this.router.navigate(['/request-booking'], { queryParams: { kind: 'dining', meal: d.meal, dish: d.name } });
  }
}
