// src/booking/entities/booking.entity.ts
/**
 * BookingEntity represents a booking made by a customer for a service.
 * Bookings can be virtual (online) or in-person.
 */
export class BookingEntity {
  id: string;
  customerId: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  bookingType: "virtual" | "in_person";
  status: "pending" | "waiting" | "confirmed" | "cancelled";
  date: Date;
  startTime: Date;
  endTime: Date;
  cancelReason?: string;
  createdAt: Date;
}
