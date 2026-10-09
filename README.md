# Kudzis Bookings — Rooms + Activities + Dining

Explicit split:

- **Backend** = `HotelBooking.Api` (ASP.NET Core 8 Web API: Identity + JWT, EF Core, Swagger, Razor ops dashboard)
  + `HotelBooking.Data` (`HotelDbContext : IdentityDbContext`, seed: room types, rooms, 5 Zim activities, tables)
  + `HotelBooking.Core` (pricing, overlap checks, payment + reference helpers)
- **Frontend** = `HotelBooking.Web` (Angular standalone: landing page, rooms search/book + calendar, activity slots, lunch/dinner tables, my-bookings + payments, admin console)

```
HotelBooking/
  HotelBooking.slnx
  HotelBooking.Api/     <- backend (controllers: auth, rooms/room-bookings, activities/activity-bookings, dining)
  HotelBooking.Data/    <- backend (entities + DbContext + migrations)
  HotelBooking.Core/    <- backend (shared logic)
  HotelBooking.Web/     <- frontend (Angular: proxy.conf.json -> https://localhost:7064)
```

## Run backend
```powershell
dotnet ef database update --project HotelBooking.Data --startup-project HotelBooking.Api
dotnet run --project HotelBooking.Api
# Swagger: https://localhost:7064/swagger
# Seed admin: admin@hotel.local / Admin123!
```

## Run frontend
```powershell
cd HotelBooking.Web
npm install
npm start     # ng serve --proxy-config proxy.conf.json -> https://localhost:7064
# http://localhost:4200
```

## Key rules (verified end-to-end)
- Rooms: overlap blocked (409) — `CheckIn < existing.CheckOut && existing.CheckIn < CheckOut`
- Activities: capacity check per `SlotStart`, `SUM(participants) <= Capacity`
- Dining: `MealType 0=Lunch/12:30, 1=Dinner/19:30`, table clash per date+meal, `Seats >= PartySize`
- Auth: register assigns `Guest`; admin seeded; cancel allowed for owner or Admin/Staff

## Deploying the frontend to Vercel
Vercel hosts the Angular app only — the ASP.NET API + SQL Server must live
elsewhere (e.g. Azure App Service + Azure SQL).
1. Host `HotelBooking.Api` publicly with a SQL database, run `dotnet ef database update`
   against it, and add your Vercel domain to the `ng` CORS policy in `Program.cs`.
   Override `Jwt:Key` and `ConnectionStrings:Default` via host env vars (do not
   ship the dev values in `appsettings.json`).
2. Put the public API URL into `HotelBooking.Web/src/environments/environment.prod.ts`
   (`apiBaseUrl`, e.g. `https://kudzis-api.azurewebsites.net/api`).
3. On Vercel: Import the GitHub repo → Root Directory `HotelBooking.Web` →
   Build Command `npm run build` → Output Directory `dist/HotelBooking.Web/browser`
   (`vercel.json` in that folder already sets this + SPA rewrites).
