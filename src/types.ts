export type Language = 'en' | 'ur';

export interface SchoolProfile {
  schoolId?: string;
  name: string;
  ownerName?: string;
  studentsCount?: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  trialEndDate: string;
  plan?: 'free' | 'premium';
  academicYearStart?: string;
  academicYearEnd?: string;
  whatsapp?: string;
  geminiApiKey?: string;
  classFees: { [key: string]: number };
  createdAt?: string;
}

export interface Student {
  id: string; // Firestore document ID
  name: string;
  fatherName: string;
  class: string;
  rollNo: string;
  dob: string;
  address: string;
  phone: string;
  gender: string;
  createdAt: string;
}

export interface AttendanceRecordItem {
  studentId: string;
  status: 'P' | 'A' | 'L'; // Present, Absent, Leave
}

export interface AttendanceRecord {
  id: string; // date_class eg "2026-05-26_10th-grade"
  date: string;
  class: string;
  records: AttendanceRecordItem[];
}

export interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  paid: number;
  balance: number;
  month: string; // e.g. "May 2026"
  receiptNo: string;
  paidDate: string;
}

export interface SubjectMarks {
  [subject: string]: number;
}

export interface ResultRecordItem {
  studentId: string;
  subjects: SubjectMarks;
  total: number;
  percentage: number;
  grade: string;
  remarks: string;
}

export interface ExamResult {
  id: string;
  examName: string;
  date: string;
  records: ResultRecordItem[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Teacher' | 'Admin' | 'Guard' | 'Peon' | 'Other';
  subject: string;
  phone: string;
  salary: number;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

export interface PayrollRecord {
  id: string; // staffId_month_year
  staffId: string;
  month: string;
  basic: number;
  deductions: number;
  bonus: number;
  net: number;
  status: 'Paid' | 'Pending';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Utilities' | 'Maintenance' | 'Supplies' | 'Events' | 'Salaries' | 'Other';
  description: string;
  amount: number;
  addedBy: string;
}

export interface SavedAIReport {
  id: string;
  reportType: string;
  timePeriod: string;
  englishContent: string;
  urduContent: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  schoolId: string;
  schoolName: string;
  email: string;
  subject: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

