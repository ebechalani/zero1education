export type Role = "student" | "teacher" | "school_admin" | "zero1_admin";

export type UserStatus = "active" | "invited" | "disabled";

export interface AppUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  schoolId: string;
  classIds: string[];
  /** Students only */
  grade?: number;
  /** Deterministic avatar hue (0–360) — no photos for child privacy */
  avatarHue: number;
  title?: string;
  createdAt: string;
  lastLogin?: string;
  status: UserStatus;
}

export interface School {
  id: string;
  name: string;
  city?: string;
  country?: string;
  plan: "pilot" | "standard" | "premium";
  seats: number;
  seatsUsed: number;
  status: "active" | "trial" | "expired";
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  schoolId: string;
  name: string;
  grade: number;
  teacherIds: string[];
  studentIds: string[];
}

export interface License {
  id: string;
  schoolId: string;
  plan: School["plan"];
  seats: number;
  validFrom: string;
  validTo: string;
  status: "active" | "expiring" | "expired";
}
