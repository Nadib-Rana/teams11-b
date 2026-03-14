// src/staff/entities/staff.entity.ts
export class StaffEntity {
  id: string;
  userId: string;
  businessId: string;
  role?: string;
  specialties?: string;
  workingDays?: Record<string, boolean>;
  createdAt: Date;
}
