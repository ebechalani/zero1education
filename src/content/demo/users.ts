import type { AppUser, ClassGroup, School } from "@/types/user";

/**
 * DEMO MODE ONLY — sample identities for evaluating the platform without
 * Firebase. Removed in production builds by setting NEXT_PUBLIC_ZERO1_MODE=live.
 */

export const DEMO_SCHOOL: School = {
  id: "sch-cedars",
  name: "Cedars International School",
  city: "Beirut",
  country: "Lebanon",
  plan: "premium",
  seats: 850,
  seatsUsed: 812,
  status: "active",
  createdAt: "2025-09-01T08:00:00Z",
};

export const DEMO_CLASS: ClassGroup = {
  id: "cls-6a",
  schoolId: "sch-cedars",
  name: "Grade 6 — Section A",
  grade: 6,
  teacherIds: ["usr-teacher"],
  studentIds: [], // filled by roster below
};

export const DEMO_USERS: AppUser[] = [
  {
    uid: "usr-student",
    firstName: "Maya",
    lastName: "Haddad",
    email: "maya.haddad@student.cedars.edu.lb",
    role: "student",
    schoolId: "sch-cedars",
    classIds: ["cls-6a"],
    grade: 6,
    avatarHue: 195,
    createdAt: "2025-09-03T08:00:00Z",
    status: "active",
  },
  {
    uid: "usr-teacher",
    firstName: "Rana",
    lastName: "Khoury",
    email: "r.khoury@cedars.edu.lb",
    role: "teacher",
    schoolId: "sch-cedars",
    classIds: ["cls-6a", "cls-6b", "cls-7a"],
    avatarHue: 262,
    title: "ICT Teacher — Middle School",
    createdAt: "2025-08-20T08:00:00Z",
    status: "active",
  },
  {
    uid: "usr-school-admin",
    firstName: "Nadine",
    lastName: "Chami",
    email: "n.chami@cedars.edu.lb",
    role: "school_admin",
    schoolId: "sch-cedars",
    classIds: [],
    avatarHue: 25,
    title: "Head of Digital Learning",
    createdAt: "2025-08-01T08:00:00Z",
    status: "active",
  },
  {
    uid: "usr-zero1-admin",
    firstName: "Eddy",
    lastName: "Bachaalany",
    email: "eddy@zero1.education",
    role: "zero1_admin",
    schoolId: "zero1-hq",
    classIds: [],
    avatarHue: 220,
    title: "Author & Founder, ZERO1 Education",
    createdAt: "2025-01-01T08:00:00Z",
    status: "active",
  },
];

export const demoUserByRole = (role: AppUser["role"]) =>
  DEMO_USERS.find((u) => u.role === role)!;
