// Mirrors the backend's UserRole enum (common/enums/user-role.enum.ts).
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'principal'
  | 'teacher'
  | 'accountant'
  | 'transport_manager'
  | 'parent'
  | 'staff';

// Success envelope produced by the backend TransformInterceptor.
export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

// Error envelope produced by the backend HttpExceptionFilter.
export interface ApiError {
  success: false;
  statusCode: number;
  path: string;
  message: string | string[];
  timestamp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  /** null only for super_admin — every other account belongs to one school. */
  schoolId: string | null;
  iat: number;
  exp: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardOverview {
  generatedAt: string;
  students: { total: number; active: number };
  staff: { total: number; present: number };
  fees: { collectedToday: number; pending: number };
  attendance: { presentToday: number; absentToday: number };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  schoolId?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Schools (SaaS console — super admin only) ─────────────
export type SchoolStatus = 'active' | 'trial' | 'suspended' | 'inactive';

export interface SchoolAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface School {
  _id: string;
  name: string;
  code: string;
  address?: SchoolAddress | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: SchoolStatus;
  enabledModules: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Present right after creation when the admin was invited (email not yet wired). */
  adminInviteUrl?: string;
}

export interface SchoolStats {
  total: number;
  byStatus: Record<SchoolStatus, number>;
}

export interface SchoolOverview {
  school: School;
  students: number;
  usersByRole: Partial<Record<UserRole, number>>;
}

/**
 * The school IS its admin — creating a school bundles its admin account.
 * No password: the admin is emailed a set-password invite link.
 */
export interface CreateSchoolInput {
  name: string;
  code?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: SchoolAddress;
  admin?: {
    name: string;
    email: string;
    phone?: string;
  };
}

/** No password: staff are emailed a set-password invite link. */
export interface CreateUserInput {
  name: string;
  /** Required for staff roles; parents onboard by phone instead. */
  email?: string;
  phone?: string;
  role: UserRole;
  schoolId?: string;
}

/** Response of GET /auth/invite — who a set-password link belongs to. */
export interface InviteInfo {
  email: string;
  name: string;
}

// ── Students ──────────────────────────────────────────────
export type Gender = 'male' | 'female' | 'other';

export type StudentStatus =
  | 'active'
  | 'inactive'
  | 'graduated'
  | 'withdrawn'
  | 'suspended';

export type GuardianRelationship =
  | 'father'
  | 'mother'
  | 'guardian'
  | 'grandparent'
  | 'sibling'
  | 'other';

export interface Guardian {
  name: string;
  relationship: GuardianRelationship;
  phone: string;
  email?: string | null;
  occupation?: string | null;
  isPrimary?: boolean;
}

export interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth: string;
  gender: Gender;
  photoUrl?: string | null;
  classId?: string | null;
  enrollmentDate: string;
  status: StudentStatus;
  guardians: Guardian[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentStats {
  total: number;
  byStatus: Record<StudentStatus, number>;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  admissionNumber?: string;
  guardians?: Guardian[];
}

// ── Classes ───────────────────────────────────────────────
export interface SchoolClass {
  _id: string;
  name: string;
  section: string;
  displayName?: string;
  academicYear: string;
  capacity: number;
  classTeacher?: string | null;
  room?: string | null;
  isActive: boolean;
  enrolled: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  name: string;
  section?: string;
  academicYear: string;
  capacity?: number;
  room?: string;
}

// ── Attendance ────────────────────────────────────────────
export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'on_leave'
  | 'holiday';

export interface AttendanceSheetRow {
  student: { _id: string; fullName: string; admissionNumber: string };
  status: AttendanceStatus | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  remarks: string | null;
}

export interface AttendanceSummary {
  date: string;
  total: number;
  marked: number;
  notMarked: number;
  byStatus: Record<AttendanceStatus, number>;
}

export interface MarkAttendanceInput {
  classId: string;
  date: string;
  entries: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}

// ── Fees ──────────────────────────────────────────────────
export type FeeStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'waived'
  | 'refunded';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'online';

export interface FeeComponent {
  name: string;
  amount: number;
}

export interface FeeStructure {
  _id: string;
  name: string;
  academicYear: string;
  classId?: string | null;
  frequency: string;
  components: FeeComponent[];
  totalAmount: number;
  isActive: boolean;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  student: string;
  classId?: string | null;
  academicYear: string;
  period: string;
  lineItems: FeeComponent[];
  totalAmount: number;
  amountPaid: number;
  balance?: number;
  dueDate: string;
  status: FeeStatus;
  issuedAt: string;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  amount: number;
  balanceAfter: number;
  issuedAt: string;
}

export interface PaymentResult {
  payment: { _id: string; paymentNumber: string; amount: number };
  receipt: Receipt;
  invoice: Invoice;
}

export interface CollectionReport {
  from: string | null;
  to: string | null;
  totalCollected: number;
  paymentCount: number;
  byMethod: Record<string, number>;
}

export interface OutstandingReport {
  outstandingInvoices: number;
  totalOutstanding: number;
}

export interface CreateInvoiceInput {
  studentId: string;
  academicYear: string;
  period: string;
  lineItems: FeeComponent[];
  dueDate: string;
}

export interface CreateStructureInput {
  name: string;
  academicYear: string;
  components: FeeComponent[];
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

// ── Daycare ───────────────────────────────────────────────
export type DaycareEntryType =
  | 'meals'
  | 'naps'
  | 'activities'
  | 'health'
  | 'observations';

export interface MealEntry {
  _id: string;
  mealType: string;
  menu: string;
  amountEaten: string;
  notes?: string | null;
}
export interface NapEntry {
  _id: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  quality: string;
  notes?: string | null;
}
export interface ActivityEntry {
  _id: string;
  title: string;
  category: string;
  description?: string | null;
  notes?: string | null;
}
export interface HealthEntry {
  _id: string;
  type: string;
  description: string;
  temperature?: number | null;
  severity: string;
  notes?: string | null;
}
export interface ObservationEntry {
  _id: string;
  mood: string;
  observation: string;
  context?: string | null;
  notes?: string | null;
}

export interface DaycareDiary {
  studentId: string;
  date: string;
  meals: MealEntry[];
  naps: NapEntry[];
  activities: ActivityEntry[];
  health: HealthEntry[];
  observations: ObservationEntry[];
}

// ── Academic ──────────────────────────────────────────────
export type AssessmentType =
  | 'quiz'
  | 'test'
  | 'exam'
  | 'project'
  | 'oral'
  | 'observation'
  | 'assignment';

export interface Assessment {
  _id: string;
  title: string;
  subject: string;
  classId: string;
  type: AssessmentType;
  maxScore: number;
  date: string;
  description?: string | null;
}

export interface Result {
  _id: string;
  assessment: string;
  student: string;
  score: number;
  grade?: string | null;
  remarks?: string | null;
}

export interface Homework {
  _id: string;
  title: string;
  subject: string;
  classId: string;
  description?: string | null;
  assignedDate: string;
  dueDate: string;
}

export interface CreateAssessmentInput {
  title: string;
  subject: string;
  classId: string;
  type: AssessmentType;
  maxScore: number;
  date: string;
}

export interface EnterResultsInput {
  assessmentId: string;
  entries: { studentId: string; score: number; grade?: string }[];
}

export interface CreateHomeworkInput {
  title: string;
  subject: string;
  classId: string;
  dueDate: string;
  description?: string;
}

// ── Admissions ────────────────────────────────────────────
export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'visited'
  | 'converted'
  | 'closed';

export type AdmissionStatus =
  | 'applied'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'enrolled'
  | 'withdrawn';

export interface Inquiry {
  _id: string;
  childName: string;
  childDateOfBirth?: string | null;
  gender?: Gender | null;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  gradeInterested?: string | null;
  source: string;
  status: InquiryStatus;
  notes?: string | null;
  createdAt: string;
}

export interface Admission {
  _id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  parentName: string;
  parentPhone: string;
  academicYear: string;
  status: AdmissionStatus;
  waitlistPosition?: number | null;
  reviewNotes?: string | null;
  student?: string | null;
}

export interface AdmissionStats {
  total: number;
  byStatus: Record<AdmissionStatus, number>;
}

export interface CreateInquiryInput {
  childName: string;
  parentName: string;
  parentPhone: string;
  childDateOfBirth?: string;
  gender?: Gender;
  gradeInterested?: string;
  source?: string;
}

// ── Communication ─────────────────────────────────────────
export type CircularAudience =
  | 'all'
  | 'parents'
  | 'teachers'
  | 'staff'
  | 'class';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type PtmStatus =
  | 'requested'
  | 'scheduled'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface Circular {
  _id: string;
  title: string;
  body: string;
  audience: CircularAudience;
  classId?: string | null;
  pinned: boolean;
  publishedAt: string;
}

export interface EmergencyAlert {
  _id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  audience: CircularAudience;
  sentAt: string;
}

export interface PtmRequest {
  _id: string;
  student: string;
  requestedBy: string;
  teacher?: string | null;
  reason: string;
  preferredSlots: string[];
  status: PtmStatus;
  scheduledAt?: string | null;
  responseNote?: string | null;
  createdAt: string;
}

export interface CreateCircularInput {
  title: string;
  body: string;
  audience: CircularAudience;
}

export interface CreateAlertInput {
  title: string;
  message: string;
  severity: AlertSeverity;
}
