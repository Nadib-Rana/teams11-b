// src/service/entities/service.entity.ts
/**
 * ServiceEntity represents a service offered by a business.
 * Services can be of different types (service, event, class) and are assigned to staff members.
 */
export class ServiceEntity {
  id: string;
  businessId: string;
  categoryId: string;
  title: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  color?: string;
  type: "service" | "event" | "class";
  createdAt: Date;
}
