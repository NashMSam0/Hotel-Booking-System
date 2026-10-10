import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Destination { name: string; img: string; off: string; price: number; rating: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .hero { background: #07211d; color: #fff; position: relative; overflow: hidden; }
    .hero-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; animation: kenburns 24s ease-in-out infinite alternate; }
    @keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.1); } }
    @media (prefers-reduced-motion: reduce) { .hero-photo, .offer-badge { animation: none; } }
    .hero::before { content:''; position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(5,25,21,.78), rgba(5,25,21,.25) 60%, rgba(5,25,21,.05)); }
    .hero-inner { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 160px 20px 130px; }
    .hero h1 { font-size: 56px; margin: 0; line-height: 1.05; text-shadow: 0 2px 12px rgba(0,0,0,.35); }
    .hero h1 .mem { color: #e7b96a; font-style: italic; }
    .hero p.sub { font-size: 17px; max-width: 520px; opacity: .95; }
    .hero-cta { display: flex; gap: 12px; margin: 18px 0; }
    .trusted { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
    .trusted .faces { display: flex; }
    .trusted img { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff; margin-left: -8px; object-fit: cover; }
    .trusted img:first-child { margin-left: 0; }
    .offer-badge { position: absolute; right: 6%; top: 90px; background: #fff; color: #16233b; border-radius: 16px; padding: 14px 20px; text-align: center; transform: rotate(4deg); box-shadow: 0 8px 24px rgba(0,0,0,.25); animation: bob 5s ease-in-out infinite alternate; }
    @keyframes bob { from { margin-top: 0; } to { margin-top: -14px; } }
    .offer-badge b { font-size: 26px; color: var(--blue); display: block; }
    .offer-badge small { color: var(--muted); }

    .search-card { position: relative; max-width: 1080px; margin: -70px auto 0; background: rgba(255,255,255,.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.6); border-radius: 20px; box-shadow: 0 12px 40px rgba(16,28,51,.18); padding: 18px 22px; z-index: 5; }
    .tabs { display: flex; gap: 26px; border-bottom: 1px solid #e8eefc; margin-bottom: 14px; }
    .tabs button { border: 0; background: none; font-size: 14.5px; font-weight: 700; color: var(--muted); padding: 8px 2px; cursor: pointer; border-bottom: 3px solid transparent; }
    .tabs button.active { color: var(--blue); border-bottom-color: var(--blue); }
    .search-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; gap: 12px; align-items: end; }
    .search-grid label { font-size: 12.5px; color: var(--muted); }
    .search-grid input { border: 0; background: #f2f6ff; font-weight: 600; }
    .search-now { height: 46px; padding: 0 26px; }

    .section { max-width: 1200px; margin: 0 auto; padding: 40px 20px 6px; }
    .section-head { display: flex; justify-content: space-between; align-items: baseline; }
    .section-head h2 { margin: 0; font-size: 26px; }
    .section-head a { color: var(--blue); font-weight: 700; font-size: 13.5px; text-decoration: none; }
    .dest-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-top: 16px; }
    .dest { position: relative; border-radius: 16px; overflow: hidden; height: 300px; cursor: pointer; display: block; }
    .dest img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
    .dest:hover img { transform: scale(1.06); }
    .dest .off { position: absolute; top: 10px; left: 10px; background: var(--orange); color: #fff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; }
    .dest .info { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; background: linear-gradient(transparent, rgba(8,18,38,.85)); color: #fff; }
    .dest .info b { font-size: 15.5px; }
    .dest .info small { display: block; opacity: .9; font-size: 12px; }
    .stars { color: #ffb703; font-size: 13px; }

    .deals { display: grid; grid-template-columns: 1.1fr 1fr 1fr 1fr; gap: 14px; margin-top: 16px; }
    .deal-banner { background: linear-gradient(135deg, #123a8f, #1f6ff2); border-radius: 18px; color: #fff; padding: 26px; position: relative; overflow: hidden; }
    .deal-banner img { position: absolute; right: -30px; bottom: -20px; width: 230px; opacity: .9; }
    .deal-banner h3 { font-size: 26px; margin: 0 0 6px; }
    .deal { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(16,28,51,.08); position: relative; }
    .deal img { width: 100%; height: 150px; object-fit: cover; }
    .deal .tag { position: absolute; top: 10px; left: 10px; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 999px; color: #fff; }
    .deal .body { padding: 12px 14px 16px; }
    .deal .body b { font-size: 15px; }
    .deal .body small { color: var(--muted); display: block; }
    .deal .price { margin-top: 6px; font-weight: 800; color: #d61f2c; font-size: 17px; }
    .deal .price s { color: var(--muted); font-weight: 400; font-size: 13px; margin-right: 6px; }
    .deal a { color: var(--blue); font-size: 13px; font-weight: 700; text-decoration: none; }

    .trust { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
    .trust div { background: #fff; border-radius: 14px; padding: 14px; text-align: center; box-shadow: 0 3px 12px rgba(16,28,51,.06); }
    .trust .ic { font-size: 22px; }
    .trust b { display: block; font-size: 13.5px; margin-top: 6px; }
    .trust small { color: var(--muted); font-size: 12px; }

    .tests { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 16px; }
    .test { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(16,28,51,.08); }
    .test .q { color: var(--blue); font-size: 30px; line-height: 1; }
    .test p { font-size: 14px; color: #33415c; }
    .test .who { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
    .test .who img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; }

    .news { margin: 36px auto 46px; max-width: 1200px; padding: 0 20px; }
    .news-inner { background: url('/images/karibapan.jpg') center/cover; border-radius: 20px; padding: 40px; color: #fff; display: flex; justify-content: space-between; align-items: center; gap: 20px; position: relative; overflow: hidden; }
    .news-inner::before { content:''; position: absolute; inset: 0; background: rgba(11,40,110,.55); }
    .news-inner > div { position: relative; }
    .news h3 { margin: 0 0 4px; font-size: 24px; }
    .news-form { display: flex; background: #fff; border-radius: 999px; padding: 5px 5px 5px 18px; min-width: 340px; position: relative; }
    .news-form input { border: 0; outline: 0; flex: 1; font-size: 14px; }
    .news-form button { border-radius: 999px; }

    .faq { margin-top: 16px; display: grid; gap: 10px; }
    .faq-item { background: #fff; border-radius: 14px; box-shadow: 0 3px 12px rgba(16,28,51,.06); overflow: hidden; }
    .faq-q { width: 100%; border: 0; background: none; text-align: left; padding: 16px 18px; font-size: 15px; font-weight: 700; color: var(--navy); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .faq-q span:last-child { color: var(--orange); font-size: 20px; }
    .faq-a { padding: 0 18px 18px; font-size: 14px; color: #33415c; line-height: 1.6; }

    @media (max-width: 1000px) {
      .hero h1 { font-size: 38px; }
      .offer-badge { display: none; }
      .search-grid { grid-template-columns: 1fr 1fr; }
      .dest-row { grid-template-columns: repeat(2, 1fr); }
      .deals { grid-template-columns: 1fr 1fr; }
      .trust { grid-template-columns: repeat(2, 1fr); }
      .tests { grid-template-columns: 1fr; }
      .news-inner { flex-direction: column; text-align: center; }
    }
  `],
  template: `
    <section class="hero">
      <img class="hero-photo" src="/images/falls-hero.jpg" alt="Victoria Falls" />
      <div class="hero-inner">
      <h1>Explore the World<br />Create <span class="mem">Memories</span></h1>
      <p class="sub">Discover Zimbabwe's amazing places at exclusive prices and unforgettable experiences.</p>
      <div class="hero-cta">
        <a class="btn" routerLink="/hotels">Explore Destinations →</a>
        <a class="btn white" routerLink="/activities">View Packages</a>
      </div>
      <div class="trusted">
        <span class="faces">
          <img src="/images/face1.jpg" alt="traveler" /><img src="/images/face2.jpg" alt="traveler" /><img src="/images/face3.jpg" alt="traveler" /><img src="/images/face4.jpg" alt="traveler" />
        </span>
        <span>Trusted by <b>250,000+ happy travelers</b></span>
      </div>
      <div class="offer-badge">★ Special Offer<br />Get up to<br /><b>30% OFF</b><small>On all bookings</small></div>
    </div></section>

    <div class="search-card">
      <div class="tabs">
        <button [class.active]="tab==='hotels'" (click)="tab='hotels'">✈ Hotels</button>
        <button [class.active]="tab==='activities'" (click)="tab='activities'">◈ Activities</button>
        <button [class.active]="tab==='dining'" (click)="tab='dining'">◉ Dining</button>
      </div>
      @if (tab === 'hotels') {
        <div class="search-grid">
          <label>Check-in<input type="date" [(ngModel)]="checkIn" /></label>
          <label>Check-out<input type="date" [(ngModel)]="checkOut" /></label>
          <label>Travelers<input type="number" min="1" max="8" [(ngModel)]="guests" /></label>
          <label>Destination<input value="Anywhere" disabled /></label>
          <label>&nbsp;<span class="hint">{{ nights }} night(s)</span></label>
          <button class="btn search-now" (click)="searchHotels()">Search Now</button>
        </div>
      } @else if (tab === 'activities') {
        <div class="search-grid">
          <label>Date<input type="date" [(ngModel)]="actDate" /></label>
          <label>Travelers<input type="number" min="1" [(ngModel)]="actPeople" /></label>
          <label>Experience<input value="All activities" disabled /></label>
          <label>&nbsp;</label><label>&nbsp;</label>
          <button class="btn search-now" (click)="go('/activities')">Search Now</button>
        </div>
      } @else {
        <div class="search-grid">
          <label>Date<input type="date" [(ngModel)]="checkIn" /></label>
          <label>Meal<select [(ngModel)]="meal"><option value="0">Lunch</option><option value="1">Dinner</option></select></label>
          <label>Party size<input type="number" min="1" [(ngModel)]="guests" /></label>
          <label>&nbsp;</label><label>&nbsp;</label>
          <button class="btn search-now" (click)="go('/dining')">Search Now</button>
        </div>
      }
    </div>

    <section class="section">
      <div class="section-head"><h2>Popular Destinations</h2><a routerLink="/hotels">View All Destinations →</a></div>
      <div class="dest-row">
        @for (d of destinations; track d.name) {
          <a class="dest" routerLink="/hotels">
            <img [src]="d.img" [alt]="d.name" loading="lazy" />
            <span class="off">{{ d.off }}</span>
            <span class="info"><b>{{ d.name }}</b><small>Starting from \${{ d.price }}</small><span class="stars">★★★★★ {{ d.rating }}</span></span>
          </a>
        }
      </div>
    </section>

    <section class="section">
      <div class="deals">
        <div class="deal-banner">
          <h3>Top Deals<br />This Week</h3>
          <p>Limited time offers.<br />Don't miss out!</p>
          <a class="btn white" routerLink="/hotels" style="margin-top:10px">Grab Deals →</a>
          <img src="/images/bushplane.jpg" alt="deals" />
        </div>
        <div class="deal"><img src="/images/fallsdeal.jpg" alt="Victoria Falls" /><span class="tag" style="background:#7c3aed">Best Seller</span>
          <div class="body"><b>Victoria Falls Tour</b><small>5 Days / 4 Nights</small><div class="price"><s>$899</s>$629</div><a routerLink="/hotels">View Details →</a></div></div>
        <div class="deal"><img src="/images/safarideal.jpg" alt="Hwange" /><span class="tag" style="background:#e11d48">Hot Deal</span>
          <div class="body"><b>Hwange Safari Escape</b><small>6 Days / 5 Nights</small><div class="price"><s>$749</s>$529</div><a routerLink="/activities">View Details →</a></div></div>
        <div class="deal"><img src="/images/kariba.jpg" alt="Lake Kariba" /><span class="tag" style="background:#059669">New Offer</span>
          <div class="body"><b>Kariba Lake Discovery</b><small>7 Days / 6 Nights</small><div class="price"><s>$1099</s>$899</div><a routerLink="/hotels">View Details →</a></div></div>
      </div>
      <div class="trust">
        <div><span class="ic">🛡</span><b>Best Price</b><small>Guarantee</small></div>
        <div><span class="ic">◷</span><b>24/7 Support</b><small>We are here</small></div>
        <div><span class="ic">🔒</span><b>Secure Booking</b><small>100% safe</small></div>
        <div><span class="ic">↩</span><b>Easy Cancellation</b><small>Hassle-free</small></div>
        <div><span class="ic">★</span><b>Handpicked Hotels</b><small>Top Rated</small></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>What Our Travelers Say</h2></div>
      <div class="tests">
        <div class="test"><span class="q">“</span><p>Kudzis made our vacation absolutely perfect! Best service and great deals!</p>
          <div class="who"><img src="/images/face1.jpg" alt="Sophia" /><span><b>Sophia Williams</b><br /><span class="stars">★★★★★</span></span></div></div>
        <div class="test"><span class="q">“</span><p>Amazing experience and very easy booking process. Highly recommend!</p>
          <div class="who"><img src="/images/face2.jpg" alt="James" /><span><b>James Anderson</b><br /><span class="stars">★★★★★</span></span></div></div>
        <div class="test"><span class="q">“</span><p>Customer support was awesome and our trip was unforgettable!</p>
          <div class="who"><img src="/images/face3.jpg" alt="Olivia" /><span><b>Olivia Martinez</b><br /><span class="stars">★★★★★</span></span></div></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Plan Your Trip — FAQs</h2></div>
      <div class="faq">
        @for (f of faqs; track f.q; let i = $index) {
          <div class="faq-item">
            <button class="faq-q" (click)="openFaq = openFaq === i ? -1 : i"><span>{{ f.q }}</span><span>{{ openFaq === i ? '−' : '+' }}</span></button>
            @if (openFaq === i) { <div class="faq-a">{{ f.a }}</div> }
          </div>
        }
      </div>
    </section>

    <div class="news"><div class="news-inner">
      <div><h3>Get Exclusive Offers<br />&amp; Travel Inspiration</h3><small>Subscribe to our newsletter</small></div>
      <div>
        @if (!subscribed) {
          <div class="news-form"><input placeholder="Enter your email" [(ngModel)]="email" type="email" /><button class="btn" (click)="subscribe()">✈</button></div>
        } @else { <p><b>You're on the list! Watch your inbox. ✈</b></p> }
      </div>
    </div></div>
  `,
})
export class HomeComponent {
  private router = inject(Router);
  tab: 'hotels' | 'activities' | 'dining' = 'hotels';
  checkIn = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  checkOut = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  guests = 2;
  actDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  actPeople = 2;
  meal = '1';
  email = '';
  subscribed = false;
  openFaq = 0;

  faqs = [
    { q: 'When is the best time to visit Victoria Falls?', a: 'For the Falls at their most dramatic (“the smoke that thunders” in full force), visit February to May. For clearer views, photography and adventure activities like rafting, August to October is ideal. Game viewing is best June to October.' },
    { q: 'How many days should I spend?', a: 'We recommend 3 to 5 nights: a Falls rainforest walk, a Zambezi sunset cruise, one big adrenaline day (rafting or bungee), plus a safari or Great Zimbabwe tour — without feeling rushed.' },
    { q: 'Is Zimbabwe good for a family safari?', a: 'Yes — sunset cruises, gentle game drives, the Falls rainforest rainbows and cultural village visits suit all ages. Our hotels show max guests per room so you can pick family-sized stays.' },
    { q: 'How do bookings and cancellations work?', a: 'Book instantly with just your name, email and phone — login keeps all your trips under My Bookings. Room overlaps and activity capacities are checked live, and you can cancel any booking free of charge from My Bookings.' },
    { q: 'What should I pack?', a: 'Light layers, a rain jacket for the Falls spray (it drenches you year-round), sun protection, comfortable walking shoes and a sense of adventure. Malaria prophylaxis is advised — consult your clinic.' },
  ];

  destinations: Destination[] = [
    { name: 'Victoria Falls', img: '/images/vicfalls.jpg', off: '-30%', price: 499, rating: '4.9' },
    { name: 'Hwange National Park', img: '/images/hwange.jpg', off: '-25%', price: 399, rating: '4.8' },
    { name: 'Great Zimbabwe', img: '/images/greatzim.jpg', off: '-20%', price: 299, rating: '4.7' },
    { name: 'Mana Pools', img: '/images/manapools.jpg', off: '-35%', price: 599, rating: '4.9' },
    { name: 'Matobo Hills', img: '/images/matobo.jpg', off: '-25%', price: 349, rating: '4.8' },
  ];

  get nights() {
    const ms = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }

  searchHotels() {
    this.router.navigate(['/hotels'], { queryParams: { checkIn: this.checkIn, checkOut: this.checkOut, guests: this.guests } });
  }
  go(path: string) { this.router.navigate([path]); }
  subscribe() {
    if (this.email.includes('@')) this.subscribed = true;
  }
}
