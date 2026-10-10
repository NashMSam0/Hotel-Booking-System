import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getRooms() { return this.http.get<any[]>(`${this.base}/rooms`); }
  getAvailableRooms(checkIn: string, checkOut: string, guests = 1) {
    return this.http.get<any[]>(`${this.base}/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  }
  bookRoom(body: any) { return this.http.post(`${this.base}/room-bookings`, body); }
  myRoomBookings() { return this.http.get<any[]>(`${this.base}/room-bookings/mine`); }
  cancelRoomBooking(id: number) { return this.http.post(`${this.base}/room-bookings/${id}/cancel`, {}); }

  getActivities() { return this.http.get<any[]>(`${this.base}/activities`); }
  bookActivity(body: any) { return this.http.post(`${this.base}/activity-bookings`, body); }
  myActivityBookings() { return this.http.get<any[]>(`${this.base}/activity-bookings/mine`); }
  cancelActivityBooking(id: number) { return this.http.post(`${this.base}/activity-bookings/${id}/cancel`, {}); }

  getTables() { return this.http.get<any[]>(`${this.base}/dining/tables`); }
  getAvailableTables(date: string, mealType: number, partySize: number) {
    return this.http.get<any[]>(`${this.base}/dining/available?date=${date}&mealType=${mealType}&partySize=${partySize}`);
  }
  bookDining(body: any) { return this.http.post(`${this.base}/dining/bookings`, body); }
  myDiningBookings() { return this.http.get<any[]>(`${this.base}/dining/bookings/mine`); }
  cancelDiningBooking(id: number) { return this.http.post(`${this.base}/dining/bookings/${id}/cancel`, {}); }

  allRoomBookings() { return this.http.get<any[]>(`${this.base}/room-bookings`); }
  allActivityBookings() { return this.http.get<any[]>(`${this.base}/activity-bookings`); }
  allDiningBookings() { return this.http.get<any[]>(`${this.base}/dining/bookings`); }

  roomCalendar(year: number, month: number, guests = 1) {
    return this.http.get<any[]>(`${this.base}/rooms/calendar?year=${year}&month=${month}&guests=${guests}`);
  }
  activitySlots(activityId: number, date: string) {
    return this.http.get<any[]>(`${this.base}/activities/${activityId}/slots?date=${date}`);
  }

  initiatePayment(kind: string, bookingId: number) {
    return this.http.post<any>(`${this.base}/payments/initiate`, { kind, bookingId });
  }
  confirmPayment(kind: string, bookingId: number, method: string, amount: number) {
    return this.http.post<any>(`${this.base}/payments/confirm`, { kind, bookingId, method, amount });
  }

  createRoom(body: any) { return this.http.post(`${this.base}/rooms`, body); }
  deleteRoom(id: number) { return this.http.delete(`${this.base}/rooms/${id}`); }
  getRoomTypes() { return this.http.get<any[]>(`${this.base}/rooms/room-types`); }
  createRoomType(body: any) { return this.http.post(`${this.base}/rooms/room-types`, body); }
  createActivity(body: any) { return this.http.post(`${this.base}/activities`, body); }
  deleteActivity(id: number) { return this.http.delete(`${this.base}/activities/${id}`); }
  createTable(body: any) { return this.http.post(`${this.base}/dining/tables`, body); }
  deleteTable(id: number) { return this.http.delete(`${this.base}/dining/tables/${id}`); }
  reportsSummary() { return this.http.get<any>(`${this.base}/reports/summary`); }
  bookingRequests(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.http.get<any[]>(`${this.base}/booking-requests${q}`);
  }
  handleBookingRequest(id: number) { return this.http.post(`${this.base}/booking-requests/${id}/handle`, {}); }
}
