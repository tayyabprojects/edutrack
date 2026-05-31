import React, { useState, useEffect, useRef } from 'react';
import { 
  db, OperationType, handleFirestoreError 
} from '../lib/firebase';
import { 
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { 
  translations } from '../translations';
import { 
  Language, Student, AttendanceRecord, FeeRecord, ExamResult, 
  StaffMember, PayrollRecord, ExpenseRecord, SchoolProfile, SavedAIReport, Complaint, ExamScheduleItem
} from '../types';
import { 
  GraduationCap, LogOut, Search, Plus, Trash2, Edit, Save, FileText, 
  UserPlus, DollarSign, Calendar, Users, Award, BookOpen, Layers, 
  Sparkles, Settings, Menu, X, ArrowRight, Printer, AlertTriangle, CheckCircle, Globe, MessageSquare, Clock, Loader2,
  Upload
} from 'lucide-react';

interface DashboardProps {
  schoolId: string;
  currentLang: Language;
  onToggleLang: () => void;
  onLogout: () => void;
  schoolProfile: SchoolProfile | null;
}

export default function Dashboard({ schoolId, currentLang, onToggleLang, onLogout, schoolProfile: initialProfile }: DashboardProps) {
  const t = (key: keyof typeof translations['en'] | any) => {
    return translations[currentLang][key as keyof typeof translations['en']] || key;
  };

  const isRTL = currentLang === 'ur';

  // Current active module/tab
  const [activeModule, setActiveModule] = useState<'dashboard' | 'students' | 'attendance' | 'fees' | 'results' | 'staff' | 'payroll' | 'expenses' | 'settings' | 'complaints' | 'exams_schedule'>('dashboard');
  
  // Complaints and Support ticket states
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [newComplaintForm, setNewComplaintForm] = useState({ subject: '', description: '' });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Real database states
  const [profile, setProfile] = useState<SchoolProfile | null>(initialProfile);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [savedReports, setSavedReports] = useState<SavedAIReport[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [examSearchQuery, setExamSearchQuery] = useState('');

  // Ledger Select Filter Month (May 2026, Apr 2026, Jun 2026, etc)
  const [ledgerSelectedMonth, setLedgerSelectedMonth] = useState('May 2026');

  // Modals state
  const [studentModal, setStudentModal] = useState<{ open: boolean; editItem?: Student | null }>({ open: false });
  const [feeModal, setFeeModal] = useState<{ open: boolean; student?: Student | null }>({ open: false });
  const [examModal, setExamModal] = useState<boolean>(false);
  const [staffModal, setStaffModal] = useState<{ open: boolean; editItem?: StaffMember | null }>({ open: false });
  const [expenseModal, setExpenseModal] = useState<boolean>(false);
  const [examScheduleModal, setExamScheduleModal] = useState<{ open: boolean; editItem?: ExamScheduleItem | null }>({ open: false });
  const [bulkExamScheduleModal, setBulkExamScheduleModal] = useState<boolean>(false);
  const [bulkExamForm, setBulkExamForm] = useState({
    examName: 'Final Exams 2026',
    startDate: '2026-06-01',
    subjects: 'English, Urdu, Mathematics, Science, Islamiat',
    startTime: '09:00',
    endTime: '12:00',
    totalMarks: 100,
    classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
  });


  // Active printable previews/slips
  const [activeReportCard, setActiveReportCard] = useState<{ student: Student; examItem: ExamResult; record: any } | null>(null);
  const [activeSalarySlip, setActiveSalarySlip] = useState<{ staff: StaffMember; record: PayrollRecord } | null>(null);
  const [activeAiReportPrint, setActiveAiReportPrint] = useState<SavedAIReport | null>(null);
  const [activeFeeVoucher, setActiveFeeVoucher] = useState<{ student: Student; record: FeeRecord | any } | null>(null);
  const [activeDateSheetClass, setActiveDateSheetClass] = useState<string | null>(null);
  const [examClassFilter, setExamClassFilter] = useState<string>('All Classes');

  // Form Inputs Buffer
  const [studentForm, setStudentForm] = useState({
    name: '', fatherName: '', class: 'Class 1', rollNo: '', dob: '', address: '', phone: '', gender: 'Male'
  });
  const [feeForm, setFeeForm] = useState({ amount: 0, month: 'May 2026' });
  const [examForm, setExamForm] = useState({ examName: '', date: '2026-05-26', subjects: 'English, Mathematics, Science' });
  const [staffForm, setStaffForm] = useState({
    name: '', role: 'Teacher' as any, subject: '', phone: '', salary: 30000, joinDate: '2026-05-26', status: 'Active' as any
  });
  const [expenseForm, setExpenseForm] = useState({
    date: '2026-05-26', category: 'Utilities' as any, description: '', amount: 0
  });
  const [examScheduleForm, setExamScheduleForm] = useState({
    examName: 'Final Exams 2026', class: 'Class 1', subject: 'English', date: '2026-06-05', startTime: '09:00', endTime: '12:00', totalMarks: 100, roomNo: 'Room A'
  });

  // Attendance tracker state
  const [attendanceDate, setAttendanceDate] = useState('2026-05-26');
  const [attendanceClass, setAttendanceClass] = useState('Class 1');
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: 'P' | 'A' | 'L' }>({});

  // Marks entry state
  const [activeExamForMarks, setActiveExamForMarks] = useState<string | null>(null);
  const [tempMarks, setTempMarks] = useState<{ [studentId: string]: { [subject: string]: number } }>({});
  const [tempRemarks, setTempRemarks] = useState<{ [studentId: string]: string }>({});

  // Payroll State filter
  const [payrollMonthYear, setPayrollMonthYear] = useState('May 2026');

  // AI report state
  const [aiReportType, setAiReportType] = useState('Student Performance');
  const [aiPeriod, setAiPeriod] = useState('This Month');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [lastGeneratedReport, setLastGeneratedReport] = useState<SavedAIReport | null>(null);

  // CSV input ref
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Toast Notification helper
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // REAL-TIME FIRESTORE SYNCHRONIZATION
  useEffect(() => {
    if (!schoolId) return;

    setLoading(true);
    const unsubscibers: (() => void)[] = [];

    // Profile listener
    const profRef = doc(db, 'schools', schoolId);
    unsubscibers.push(
      onSnapshot(profRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as SchoolProfile);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `schools/${schoolId}`))
    );

    // Students Sync
    const studCol = collection(db, 'schools', schoolId, 'students');
    unsubscibers.push(
      onSnapshot(studCol, (snap) => {
        const list: Student[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as Student));
        setStudents(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/students`))
    );

    // Fees Sync
    const feeCol = collection(db, 'schools', schoolId, 'fees');
    unsubscibers.push(
      onSnapshot(feeCol, (snap) => {
        const list: FeeRecord[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as FeeRecord));
        setFees(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/fees`))
    );

    // Exams/Results Sync
    const resultCol = collection(db, 'schools', schoolId, 'results');
    unsubscibers.push(
      onSnapshot(resultCol, (snap) => {
        const list: ExamResult[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as ExamResult));
        setExams(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/results`))
    );

    // Staff Sync
    const staffCol = collection(db, 'schools', schoolId, 'staff');
    unsubscibers.push(
      onSnapshot(staffCol, (snap) => {
        const list: StaffMember[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as StaffMember));
        setStaff(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/staff`))
    );

    // Payroll Sync
    const payrollCol = collection(db, 'schools', schoolId, 'payroll');
    unsubscibers.push(
      onSnapshot(payrollCol, (snap) => {
        const list: PayrollRecord[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as PayrollRecord));
        setPayroll(list);
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/payroll`))
    );

    // Expenses Sync
    const expCol = collection(db, 'schools', schoolId, 'expenses');
    unsubscibers.push(
      onSnapshot(expCol, (snap) => {
        const list: ExpenseRecord[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as ExpenseRecord));
        setExpenses(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/expenses`))
    );

    // AI Reports Saving Sync
    const reportCol = collection(db, 'schools', schoolId, 'reports');
    unsubscibers.push(
      onSnapshot(reportCol, (snap) => {
        const list: SavedAIReport[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as SavedAIReport));
        setSavedReports(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `schools/${schoolId}/reports`))
    );

    // Complaints realtime synchronization
    const complaintsQuery = query(collection(db, 'complaints'), where('schoolId', '==', schoolId));
    unsubscibers.push(
      onSnapshot(complaintsQuery, (snap) => {
        const list: Complaint[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Complaint);
        });
        // Sort newest first
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setComplaintsList(list);
      }, (err) => console.warn("Could not listen to complaints stream:", err))
    );

    // Attendance overall history sync
    const attendanceColRef = collection(db, 'schools', schoolId, 'attendance');
    unsubscibers.push(
      onSnapshot(attendanceColRef, (snap) => {
        const list: AttendanceRecord[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as AttendanceRecord));
        setAttendance(list);
      }, (err) => console.warn("Failed fetching overall attendance history", err))
    );

    // Exam Schedule Sync
    const examSchedColRef = collection(db, 'schools', schoolId, 'examschedule');
    unsubscibers.push(
      onSnapshot(examSchedColRef, (snap) => {
        const list: ExamScheduleItem[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as ExamScheduleItem));
        setExamSchedules(list);
      }, (err) => console.warn("Failed fetching exam schedules", err))
    );

    return () => unsubscibers.forEach(unsub => unsub());
  }, [schoolId]);

  // Sync attendance list for current class/date when picker shifts
  useEffect(() => {
    if (!schoolId || !attendanceDate || !attendanceClass) return;
    const docKey = `${attendanceDate}_${attendanceClass.replace(' ', '_')}`;
    const attDocRef = doc(db, 'schools', schoolId, 'attendance', docKey);
    
    getDoc(attDocRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as AttendanceRecord;
        const initialStatus: { [studentId: string]: 'P' | 'A' | 'L' } = {};
        data.records.forEach(rec => {
          initialStatus[rec.studentId] = rec.status;
        });
        setAttendanceRecords(initialStatus);
      } else {
        // Default to all present
        const defaultStatus: { [studentId: string]: 'P' | 'A' | 'L' } = {};
        students.filter(s => s.class === attendanceClass).forEach(st => {
          defaultStatus[st.id] = 'P';
        });
        setAttendanceRecords(defaultStatus);
      }
    }).catch(e => handleFirestoreError(e, OperationType.GET, `schools/${schoolId}/attendance/${docKey}`));
  }, [attendanceDate, attendanceClass, students, schoolId]);

  // Helper to load temp exam marks when active exam selection shifts
  useEffect(() => {
    if (!activeExamForMarks) return;
    const examItem = exams.find(e => e.id === activeExamForMarks);
    if (!examItem) return;

    const loadedMarks: typeof tempMarks = {};
    const loadedRemarks: typeof tempRemarks = {};

    examItem.records.forEach(studentResult => {
      loadedMarks[studentResult.studentId] = studentResult.subjects;
      loadedRemarks[studentResult.studentId] = studentResult.remarks;
    });

    setTempMarks(loadedMarks);
    setTempRemarks(loadedRemarks);
  }, [activeExamForMarks, exams]);

  // CALCULATED VALUES
  const classesList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  
  // STATS
  const totalStudentsCount = students.length;
  const staffCountTotal = staff.length;
  
  const totalCollectedCurrentMonth = fees
    .filter(f => f.month === 'May 2026')
    .reduce((acc, current) => acc + current.paid, 0);

  const totalPendingCurrentMonth = fees
    .filter(f => f.month === 'May 2026')
    .reduce((acc, current) => acc + current.balance, 0);

  const defaultersCount = fees.filter(f => f.balance > 0).length;

  // Dynamic financial helpers based on staff designation searches
  const getStaffRole = (staffId: string) => {
    const s = staff.find(itm => itm.id === staffId);
    return s ? (s.designation || '').toLowerCase() : '';
  };

  // Dynamic Month Wise Ledger Helpers
  const monthToDatePrefix = (m: string) => {
    const parts = m.split(' ');
    if (parts.length < 2) return '2026-05';
    const monthName = parts[0];
    const year = parts[1];
    const monthsMap: { [key: string]: string } = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    return `${year}-${monthsMap[monthName] || '05'}`;
  };

  const getMonthlyFeeCollection = (targetMonth: string) => {
    return fees
      .filter(f => f.month === targetMonth)
      .reduce((sum, item) => sum + (item.paid || 0), 0);
  };

  const getMonthlySalariesPaid = (targetMonth: string) => {
    return payroll
      .filter(p => p.month === targetMonth && p.status === 'Paid')
      .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);
  };

  const getMonthlyTeacherSalariesPaid = (targetMonth: string) => {
    return payroll
      .filter(p => p.month === targetMonth && p.status === 'Paid' && (isTeacher(p.staffId)))
      .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);
  };

  const isTeacher = (staffId: string) => {
    const s = staff.find(itm => itm.id === staffId);
    return s && (s.role === 'Teacher' || (s.role || '').toLowerCase().includes('teach'));
  };

  const getMonthlyExpenses = (targetMonth: string) => {
    const prefix = monthToDatePrefix(targetMonth);
    return expenses
      .filter(e => e.date?.startsWith(prefix))
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const getMonthlyNetSavings = (targetMonth: string) => {
    const feeCol = getMonthlyFeeCollection(targetMonth);
    const payCol = getMonthlySalariesPaid(targetMonth);
    const expCol = getMonthlyExpenses(targetMonth);
    return feeCol - (payCol + expCol);
  };

  const getTodaysAttendancePercent = () => {
    if (!attendance || attendance.length === 0) return '94.3%';
    const sorted = [...attendance].sort((a, b) => b.date.localeCompare(a.date));
    const latestDate = sorted[0].date;
    const activeOnLatestDate = attendance.filter(a => a.date === latestDate);
    let totalStudents = 0;
    let presentStudents = 0;
    activeOnLatestDate.forEach(a => {
      if (a.records) {
        totalStudents += a.records.length;
        presentStudents += a.records.filter(r => r.status === 'P' || r.status === 'L').length;
      }
    });
    if (totalStudents === 0) return '94.3%';
    return `${Math.round((presentStudents / totalStudents) * 100)}%`;
  };

  // Student Fee earnings for May 2026
  const feeEarningsMay26 = totalCollectedCurrentMonth;

  // Utility and electricity expenses for May 2026
  const electricityExpensesMay26 = expenses
    .filter(e => e.date?.startsWith('2026-05') && (
      (e.category || '').toLowerCase().includes('electricity') ||
      (e.category || '').toLowerCase().includes('bill') ||
      (e.category || '').toLowerCase().includes('utility') ||
      (e.description || '').toLowerCase().includes('bill') ||
      (e.description || '').toLowerCase().includes('electricity')
    ))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const otherExpensesMay26 = expenses
    .filter(e => e.date?.startsWith('2026-05') && !(
      (e.category || '').toLowerCase().includes('electricity') ||
      (e.category || '').toLowerCase().includes('bill') ||
      (e.category || '').toLowerCase().includes('utility') ||
      (e.description || '').toLowerCase().includes('bill') ||
      (e.description || '').toLowerCase().includes('electricity')
    ))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalSchoolExpensesMay26 = electricityExpensesMay26 + otherExpensesMay26;

  // Payroll employee salaries breakdown for guard, teachers, peons
  const teacherSalariesMay26 = payroll
    .filter(p => p.month === 'May 2026' && p.status === 'Paid' && getStaffRole(p.staffId).includes('teacher'))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const guardSalariesMay26 = payroll
    .filter(p => p.month === 'May 2026' && p.status === 'Paid' && getStaffRole(p.staffId).includes('guard'))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const peonSalariesMay26 = payroll
    .filter(p => p.month === 'May 2026' && p.status === 'Paid' && (
      getStaffRole(p.staffId).includes('peon') || 
      getStaffRole(p.staffId).includes('naib qasid') ||
      getStaffRole(p.staffId).includes('helper') ||
      getStaffRole(p.staffId).includes('servant') ||
      getStaffRole(p.staffId).includes('peils')
    ))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const otherSalariesMay26 = payroll
    .filter(p => p.month === 'May 2026' && p.status === 'Paid' && 
      !getStaffRole(p.staffId).includes('teacher') &&
      !getStaffRole(p.staffId).includes('guard') &&
      !(getStaffRole(p.staffId).includes('peon') || getStaffRole(p.staffId).includes('naib qasid') || getStaffRole(p.staffId).includes('helper') || getStaffRole(p.staffId).includes('servant') || getStaffRole(p.staffId).includes('peils'))
    )
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const totalPayrollMay26 = teacherSalariesMay26 + guardSalariesMay26 + peonSalariesMay26 + otherSalariesMay26;
  const netProfitLossMay26 = feeEarningsMay26 - (totalSchoolExpensesMay26 + totalPayrollMay26);

  // Dynamic variables for selected month
  const activeSelectedFeeEarnings = getMonthlyFeeCollection(ledgerSelectedMonth);
  const activeSelectedExpenses = getMonthlyExpenses(ledgerSelectedMonth);
  const activeSelectedSalaries = getMonthlySalariesPaid(ledgerSelectedMonth);
  const activeSelectedNetSavings = activeSelectedFeeEarnings - (activeSelectedExpenses + activeSelectedSalaries);
  
  // Specific breakdown
  const prefixSelected = monthToDatePrefix(ledgerSelectedMonth);
  const activeSelectedElectricity = expenses
    .filter(e => e.date?.startsWith(prefixSelected) && (
      (e.category || '').toLowerCase().includes('electricity') ||
      (e.category || '').toLowerCase().includes('bill') ||
      (e.category || '').toLowerCase().includes('utility') ||
      (e.description || '').toLowerCase().includes('bill') ||
      (e.description || '').toLowerCase().includes('electricity')
    ))
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const activeSelectedOtherExpenses = Math.max(0, activeSelectedExpenses - activeSelectedElectricity);
  
  const activeSelectedTeacherSalaries = payroll
    .filter(p => p.month === ledgerSelectedMonth && p.status === 'Paid' && (
      getStaffRole(p.staffId).includes('teacher') || isTeacher(p.staffId)
    ))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const activeSelectedGuardSalaries = payroll
    .filter(p => p.month === ledgerSelectedMonth && p.status === 'Paid' && getStaffRole(p.staffId).includes('guard'))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const activeSelectedPeonSalaries = payroll
    .filter(p => p.month === ledgerSelectedMonth && p.status === 'Paid' && (
      getStaffRole(p.staffId).includes('peon') || getStaffRole(p.staffId).includes('naib qasid') || getStaffRole(p.staffId).includes('helper')
    ))
    .reduce((sum, item) => sum + (item.net || item.basic || 0), 0);

  const activeSelectedOtherSalaries = Math.max(0, activeSelectedSalaries - (activeSelectedTeacherSalaries + activeSelectedGuardSalaries + activeSelectedPeonSalaries));

  // Recent Activity logger logs basic system stats changes
  const recentActivities = [
    students.length ? { module: t('students'), desc: `کل ${students.length} طلبہ پورٹل پر مستعد اور سرگرم ہیں`, time: 'لائیو' } : null,
    totalCollectedCurrentMonth ? { module: t('feesTab'), desc: `رواں مہینے ${totalCollectedCurrentMonth} روپے فیس وصول ہوئی ہے`, time: 'سیکنڈ پہلے' } : null,
    staff.length ? { module: t('staff'), desc: `اسکول کا ٹھیکہ مکمل کرنے کے لئے ${staff.length} اساتذہ شامل ہیں`, time: 'مستعد' } : null,
  ].filter(Boolean);

  // STUDENT CRUD
  const handleOpenStudentModal = (st?: Student) => {
    if (st) {
      setStudentForm({
        name: st.name, fatherName: st.fatherName, class: st.class, rollNo: st.rollNo, 
        dob: st.dob, address: st.address, phone: st.phone, gender: st.gender
      });
      setStudentModal({ open: true, editItem: st });
    } else {
      setStudentForm({
        name: '', fatherName: '', class: 'Class 1', rollNo: (students.length + 1).toString(), 
        dob: '2016-01-01', address: '', phone: '', gender: 'Male'
      });
      setStudentModal({ open: true, editItem: null });
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.fatherName || !studentForm.rollNo) {
      triggerToast('برائے مہربانی تمام نشان زدہ فیلڈز پُر کریں / Please fill the required fields.', 'error');
      return;
    }

    try {
      if (studentModal.editItem) {
        // Update
        const docRef = doc(db, 'schools', schoolId, 'students', studentModal.editItem.id);
        const updatedObj = { ...studentForm };
        await setDoc(docRef, updatedObj, { merge: true });
        triggerToast('طالب علم ریکارڈ کامیابی سے تبدیل کیا گیا / Student successfully updated.');
      } else {
        // Create
        const docId = `st_${Date.now()}`;
        const newDocRef = doc(db, 'schools', schoolId, 'students', docId);
        const newObj: Student = {
          id: docId,
          ...studentForm,
          createdAt: new Date().toISOString()
        };
        await setDoc(newDocRef, newObj);
        triggerToast('نیا طالب علم کامیابی سے شامل کیا گیا / Student successfully created.');
      }
      setStudentModal({ open: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/students`);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'schools', schoolId, 'students', studentId));
      triggerToast('ریکارڈ کامیابی سے حذف کیا گیا / Student record deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schools/${schoolId}/students/${studentId}`);
    }
  };

  // CSV EXPORT/IMPORT
  const handleExportCSV = () => {
    if (students.length === 0) {
      triggerToast('کوئی طالب علم موجود نہیں ہے / No students available to export.', 'error');
      return;
    }
    const headers = 'Name,Father Name,Class,Roll No,DOB,Address,Phone,Gender\n';
    const rows = students.map(s => 
      `"${s.name}","${s.fatherName}","${s.class}","${s.rollNo}","${s.dob}","${s.address}","${s.phone}","${s.gender}"`
    ).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edutrack_students_${schoolId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVClick = () => {
    csvFileRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        // Skip header
        const batch = writeBatch(db);
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Basic split comma parsing supporting quotes
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, ''));
          if (cols.length < 4) continue;

          const docId = `st_csv_${Date.now()}_${i}`;
          const destRef = doc(db, 'schools', schoolId, 'students', docId);
          
          const sObj: Student = {
            id: docId,
            name: cols[0] || 'Unknown Student',
            fatherName: cols[1] || 'Unknown Father',
            class: cols[2] || 'Class 1',
            rollNo: cols[3] || `${students.length + count + 1}`,
            dob: cols[4] || '2016-01-01',
            address: cols[5] || '',
            phone: cols[6] || '',
            gender: cols[7] || 'Male',
            createdAt: new Date().toISOString()
          };

          batch.set(destRef, sObj);
          count++;
        }

        if (count > 0) {
          await batch.commit();
          triggerToast(t('csvSuccess'));
        } else {
          triggerToast(t('csvError'), 'error');
        }
      } catch (err) {
        console.error('Import failure:', err);
        triggerToast(t('csvError'), 'error');
      }
    };
    reader.readAsText(file);
  };

  // ATTENDANCE SAVE LOGIC
  const handleSaveAttendance = async () => {
    const docKey = `${attendanceDate}_${attendanceClass.replace(' ', '_')}`;
    const attDocRef = doc(db, 'schools', schoolId, 'attendance', docKey);

    const formattedRecords = Object.keys(attendanceRecords).map(sId => ({
      studentId: sId,
      status: attendanceRecords[sId]
    }));

    const attendanceObj: AttendanceRecord = {
      id: docKey,
      date: attendanceDate,
      class: attendanceClass,
      records: formattedRecords
    };

    try {
      await setDoc(attDocRef, attendanceObj);
      triggerToast(t('attendanceSuccess'));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `schools/${schoolId}/attendance/${docKey}`);
    }
  };

  const handleToggleAttendance = (sId: string, status: 'P' | 'A' | 'L') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [sId]: status
    }));
  };

  // FEE COLLECTION LOGIC
  const handleOpenFeeCollectModal = (st: Student) => {
    const currentClassFee = profile?.classFees?.[st.class] || 2500;
    setFeeForm({
      amount: currentClassFee,
      month: 'May 2026'
    });
    setFeeModal({ open: true, student: st });
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModal.student) return;

    const sId = feeModal.student.id;
    const feeId = `${sId}_${feeForm.month.replace(' ', '_')}`;
    const feeRef = doc(db, 'schools', schoolId, 'fees', feeId);

    const defaultClassFee = profile?.classFees?.[feeModal.student.class] || 2500;
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    const feeObj: FeeRecord = {
      id: feeId,
      studentId: sId,
      amount: defaultClassFee,
      paid: feeForm.amount,
      balance: Math.max(0, defaultClassFee - feeForm.amount),
      month: feeForm.month,
      receiptNo,
      paidDate: new Date().toISOString()
    };

    try {
      await setDoc(feeRef, feeObj);
      triggerToast(t('confirmFeeSuccess'));
      setFeeModal({ open: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/fees/${feeId}`);
    }
  };

  // EXAM RESULTS & GRADES CREATION
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.examName || !examForm.subjects) {
      triggerToast('برائے مہربانی معلومات درج کریں / Exam Name and Subjects are required.', 'error');
      return;
    }

    const examId = `exam_${Date.now()}`;
    const examRef = doc(db, 'schools', schoolId, 'results', examId);

    const examRecord: ExamResult = {
      id: examId,
      examName: examForm.examName,
      date: examForm.date,
      records: []
    };

    try {
      await setDoc(examRef, examRecord);
      triggerToast('امتحانی شیڈول تیار ہو گیا ہے / Test schedule created.');
      setActiveExamForMarks(examId);
      setExamModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/results/${examId}`);
    }
  };

  const handleSaveExamMarks = async () => {
    if (!activeExamForMarks) return;
    const examItem = exams.find(ex => ex.id === activeExamForMarks);
    if (!examItem) return;

    // Build subject list
    const examSubjectNames = examForm.subjects.split(',').map(s => s.trim()).filter(Boolean);

    const finalRecords = students.map(student => {
      const studentMarks = tempMarks[student.id] || {};
      const studentRemarks = tempRemarks[student.id] || '';

      let obtained = 0;
      examSubjectNames.forEach(sub => {
        obtained += Number(studentMarks[sub] || 0);
      });

      const maxMarksTotal = examSubjectNames.length * 100;
      const pct = maxMarksTotal > 0 ? (obtained / maxMarksTotal) * 100 : 0;
      
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';

      return {
        studentId: student.id,
        subjects: studentMarks,
        total: obtained,
        percentage: Number(pct.toFixed(1)),
        grade,
        remarks: studentRemarks
      };
    });

    const updatedExam: ExamResult = {
      ...examItem,
      records: finalRecords
    };

    try {
      await setDoc(doc(db, 'schools', schoolId, 'results', activeExamForMarks), updatedExam);
      triggerToast('امتحانی نمبر بوجھ کر دیے گئے / Exam performance recorded.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/results/${activeExamForMarks}`);
    }
  };

  // STAFF MANAGEMENT CRUD
  const handleOpenStaffModal = (stf?: StaffMember) => {
    if (stf) {
      setStaffForm({
        name: stf.name, role: stf.role, subject: stf.subject, phone: stf.phone, 
        salary: stf.salary, joinDate: stf.joinDate, status: stf.status
      });
      setStaffModal({ open: true, editItem: stf });
    } else {
      setStaffForm({
        name: '', role: 'Teacher', subject: '', phone: '', salary: 25000, joinDate: '2026-05-26', status: 'Active'
      });
      setStaffModal({ open: true, editItem: null });
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;

    try {
      if (staffModal.editItem) {
        await updateDoc(doc(db, 'schools', schoolId, 'staff', staffModal.editItem.id), staffForm);
        triggerToast('تفصیلات تبدیل کر دی گئیں / Staff updated successfully.');
      } else {
        const sId = `staff_${Date.now()}`;
        const newRef = doc(db, 'schools', schoolId, 'staff', sId);
        await setDoc(newRef, { id: sId, ...staffForm });
        triggerToast('نیا ملازم شامل ہو چکا ہے / Staff added successfully.');
      }
      setStaffModal({ open: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/staff`);
    }
  };

  // PAYROLL SUBMISSION
  const handlePaySalary = async (stf: StaffMember) => {
    const payrollId = `${stf.id}_${payrollMonthYear.replace(' ', '_')}`;
    const payRef = doc(db, 'schools', schoolId, 'payroll', payrollId);

    const record: PayrollRecord = {
      id: payrollId,
      staffId: stf.id,
      month: payrollMonthYear,
      basic: stf.salary,
      deductions: 0,
      bonus: 0,
      net: stf.salary,
      status: 'Paid'
    };

    try {
      await setDoc(payRef, record);
      triggerToast('تنخواہ جاری کر دی گئی ہے / Employee salary disbursed.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/payroll/${payrollId}`);
    }
  };

  // EXPENSE LOG OPERATIONS
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || expenseForm.amount <= 0) return;

    const extId = `exp_${Date.now()}`;
    const expRef = doc(db, 'schools', schoolId, 'expenses', extId);

    const record: ExpenseRecord = {
      id: extId,
      ...expenseForm,
      addedBy: profile?.name || 'Administrator'
    };

    try {
      await setDoc(expRef, record);
      triggerToast('نئے اخراجات شامل کر دیے گئے / Expense recorded.');
      setExpenseModal(false);
      setExpenseForm({ date: '2026-05-26', category: 'Utilities', description: '', amount: 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/expenses/${extId}`);
    }
  };

  // EXAMS SCHEDULE MANAGEMENT
  const handleOpenExamScheduleModal = (item?: ExamScheduleItem | null) => {
    if (item) {
      setExamScheduleForm({
        examName: item.examName,
        class: item.class,
        subject: item.subject,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        totalMarks: item.totalMarks,
        roomNo: item.roomNo
      });
      setExamScheduleModal({ open: true, editItem: item });
    } else {
      setExamScheduleForm({
        examName: 'Final Exams 2026',
        class: 'Class 1',
        subject: 'English',
        date: '2026-06-05',
        startTime: '09:00',
        endTime: '12:00',
        totalMarks: 100,
        roomNo: 'Room A'
      });
      setExamScheduleModal({ open: true, editItem: null });
    }
  };

  const handleSaveExamSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examScheduleForm.examName || !examScheduleForm.subject || !examScheduleForm.date) {
      triggerToast('برائے مہربانی تمام نشان زدہ فیلڈز پُر کریں / Please fill the required fields.', 'error');
      return;
    }

    try {
      if (examScheduleModal.editItem) {
        // Edit existing
        const docRef = doc(db, 'schools', schoolId, 'examschedule', examScheduleModal.editItem.id);
        const updatedObj: ExamScheduleItem = {
          id: examScheduleModal.editItem.id,
          ...examScheduleForm
        };
        await setDoc(docRef, updatedObj, { merge: true });
        triggerToast('سلسلہ شیڈول کامیابی سے تبدیل کیا گیا / Exam schedule successfully updated.');
      } else {
        // Create new
        const docId = `exsch_${Date.now()}`;
        const newDocRef = doc(db, 'schools', schoolId, 'examschedule', docId);
        const newObj: ExamScheduleItem = {
          id: docId,
          ...examScheduleForm
        };
        await setDoc(newDocRef, newObj);
        triggerToast('نیا امتحان کامیابی سے شیڈول کیا گیا / Exam successfully scheduled.');
      }
      setExamScheduleModal({ open: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}/examschedule`);
    }
  };

  const handleDeleteExamSchedule = async (scheduleId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'schools', schoolId, 'examschedule', scheduleId));
      triggerToast('شیڈول کامیابی سے حذف کیا گیا / Exam schedule deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schools/${schoolId}/examschedule/${scheduleId}`);
    }
  };

  const handleClearAllSchedules = async () => {
    if (examSchedules.length === 0) {
      triggerToast('کوئی شیڈول صاف کرنے کے لیے موجود نہیں ہے / There are no schedules to clear.', 'error');
      return;
    }
    if (!confirm('کیا آپ واقعی تمام امتحانی شیڈول حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔ / Are you sure you want to clear ALL scheduled exams? This action is irreversible.')) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      examSchedules.forEach(item => {
        const docRef = doc(db, 'schools', schoolId, 'examschedule', item.id);
        batch.delete(docRef);
      });
      await batch.commit();
      triggerToast('تمام امتحانی شیڈول کامیابی سے صاف ہو گئے ہیں / Cleared all exam schedules successfully.');
    } catch (err) {
      console.error(err);
      triggerToast('تمام شیڈول صاف کرنے میں خرابی پیش آئی / Failed to clear schedules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBulkExamSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkExamForm.examName || !bulkExamForm.subjects || !bulkExamForm.startDate) {
      triggerToast('برائے مہربانی تمام معلومات فراہم کریں / Please fill the required fields.', 'error');
      return;
    }

    const subjs = bulkExamForm.subjects
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (subjs.length === 0) {
      triggerToast('برائے مہربانی کم از کم ایک پرچہ / مضمون لکھیں / Please specify at least one subject.', 'error');
      return;
    }

    if (bulkExamForm.classes.length === 0) {
      triggerToast('برائے مہربانی کم از کم ایک کلاس منتخب کریں / Please select at least one class.', 'error');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const scheduledDates: string[] = [];
      let currentDate = new Date(bulkExamForm.startDate);
      
      for (let i = 0; i < subjs.length; i++) {
        // If Sunday, skip to Monday
        if (currentDate.getDay() === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        scheduledDates.push(`${yyyy}-${mm}-${dd}`);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let count = 0;
      for (let sIdx = 0; sIdx < subjs.length; sIdx++) {
        const subjectName = subjs[sIdx];
        const examDate = scheduledDates[sIdx];

        for (let cIdx = 0; cIdx < bulkExamForm.classes.length; cIdx++) {
          const className = bulkExamForm.classes[cIdx];
          const docId = `exsch_bulk_${Date.now()}_${count}`;
          const docRef = doc(db, 'schools', schoolId, 'examschedule', docId);
          
          const newObj: ExamScheduleItem = {
            id: docId,
            examName: bulkExamForm.examName,
            class: className,
            subject: subjectName,
            date: examDate,
            startTime: bulkExamForm.startTime,
            endTime: bulkExamForm.endTime,
            totalMarks: bulkExamForm.totalMarks,
            roomNo: `Room ${String.fromCharCode(65 + (cIdx % 6))}`
          };
          batch.set(docRef, newObj);
          count++;
        }
      }

      await batch.commit();
      triggerToast(`کامیابی سے کُل ${count} شیڈول تیار کر دیئے گئے ہیں / Successfully generated ${count} exam schedules.`);
      setBulkExamScheduleModal(false);
    } catch (err) {
      console.error(err);
      triggerToast('شیڈول تیار کرنے میں خرابی پیش آئی / Failed to generate bulk schedules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // PROXIED GEMINI AI REPORTS
  const handleGenerateAIReport = async () => {
    let datasetContext: any = {};

    if (aiReportType === 'Student Performance') {
      datasetContext = { studentsList: students, grades: exams };
    } else if (aiReportType === 'Class Summary') {
      datasetContext = { studentsCountByClass: students.map(s => s.class) };
    } else if (aiReportType === 'Fee Report') {
      datasetContext = { ledgerList: fees.slice(0, 50) };
    } else if (aiReportType === 'Attendance Report') {
      datasetContext = { totalStudentsCount, recentActivities };
    }

    setAiGenerating(true);
    setLastGeneratedReport(null);

    const customKey = profile?.geminiApiKey || '';

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: aiReportType,
          timePeriod: aiPeriod,
          data: datasetContext,
          customApiKey: customKey
        }),
      });

      if (!response.ok) {
        throw new Error('AI Engine failed to generate report');
      }

      const reportJson = await response.json();
      
      // Save output to firestore reports
      const rId = `report_${Date.now()}`;
      const rRef = doc(db, 'schools', schoolId, 'reports', rId);

      const savedReport: SavedAIReport = {
        id: rId,
        reportType: aiReportType,
        timePeriod: aiPeriod,
        englishContent: reportJson.english || 'No English translation received.',
        urduContent: reportJson.urdu || 'اردو جائزہ وصول نہیں کیا جا سکا۔',
        createdAt: new Date().toISOString()
      };

      await setDoc(rRef, savedReport);
      setLastGeneratedReport(savedReport);
      triggerToast('AI رپورٹ کامیابی سے تخلیق اور محفوظ ہوئی / AI Report generated.');
    } catch (err) {
      console.error(err);
      triggerToast(t('aiError'), 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const compressAndResizeLogo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Logo = await compressAndResizeLogo(file);
      await updateDoc(doc(db, 'schools', schoolId), { logoUrl: base64Logo });
      triggerToast('اسکول کا لوگو کامیابی سے اپ لوڈ ہو گیا!');
    } catch (err) {
      console.error("Logo upload failed:", err);
      triggerToast('Upload failed: ' + String(err), 'error');
    }
  };

  const calculateStudentAttendancePercentage = (studentId: string): number => {
    let presentDays = 0;
    let totalDays = 0;
    
    attendance.forEach((att) => {
      if (!att.records) return;
      const item = att.records.find((r) => r.studentId === studentId);
      if (item) {
        totalDays++;
        if (item.status === 'P' || item.status === 'L') {
          presentDays++;
        }
      }
    });

    if (totalDays === 0) return 100; // default to 100%
    return Math.round((presentDays / totalDays) * 100);
  };

  // PROFILE SETTINGS & DANGER ZONE
  const [settingsBuffer, setSettingsBuffer] = useState({
    name: profile?.name || '',
    address: profile?.address || '',
    city: profile?.city || '',
    phone: profile?.phone || '',
    whatsapp: profile?.whatsapp || '',
    geminiApiKey: profile?.geminiApiKey || '',
  });

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updateObj: Partial<SchoolProfile> = {
      name: settingsBuffer.name,
      address: settingsBuffer.address,
      city: settingsBuffer.city,
      phone: settingsBuffer.phone,
      whatsapp: settingsBuffer.whatsapp,
      geminiApiKey: settingsBuffer.geminiApiKey
    };

    try {
      await updateDoc(doc(db, 'schools', schoolId), updateObj);
      triggerToast('اسکول کی سیٹنگز کامیابی سے اپ ڈیٹ ہو گئیں / Settings saved.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}`);
    }
  };

  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  
  const handleDeleteAllData = async () => {
    if (deleteConfirmInput !== 'DELETE ALL') {
      triggerToast('برائے مہربانی تصدیقی الفاظ صحیح لکھیں / Invalid safety confirmation text.', 'error');
      return;
    }

    try {
      const batch = writeBatch(db);
      students.forEach(st => batch.delete(doc(db, 'schools', schoolId, 'students', st.id)));
      fees.forEach(fe => batch.delete(doc(db, 'schools', schoolId, 'fees', fe.id)));
      exams.forEach(ex => batch.delete(doc(db, 'schools', schoolId, 'results', ex.id)));
      staff.forEach(sf => batch.delete(doc(db, 'schools', schoolId, 'staff', sf.id)));
      payroll.forEach(py => batch.delete(doc(db, 'schools', schoolId, 'payroll', py.id)));
      expenses.forEach(ep => batch.delete(doc(db, 'schools', schoolId, 'expenses', ep.id)));

      await batch.commit();
      triggerToast('تحفظاتی طور پر اسکول کا تمام منتخب ڈیٹا حذف ہو چکا ہے / Every single school record deleted.');
      setDeleteConfirmInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}`);
    }
  };

  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintForm.subject || !newComplaintForm.description) return;
    setSubmittingComplaint(true);

    try {
      const collectionRef = collection(db, 'complaints');
      const newDocRef = doc(collectionRef); // Generate auto-id
      
      const complaintData: Complaint = {
        id: newDocRef.id,
        schoolId: schoolId,
        schoolName: profile?.name || 'Onboarding School',
        email: profile?.email || 'support@edutrack.com',
        subject: newComplaintForm.subject,
        description: newComplaintForm.description,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(newDocRef, complaintData);
      triggerToast('آپ کی شکایت کامیابی کے ساتھ درج ہو گئی ہے / Complaint lodged successfully.');
      setNewComplaintForm({ subject: '', description: '' });
    } catch (err) {
      console.error("Failed to lodge complaint:", err);
      triggerToast('شکایت درج کرنے میں غلطی پیش آئی / Error submitting support request.', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f4f7ff] text-slate-800 ${isRTL ? 'rtl' : 'ltr'} flex flex-col md:flex-row relative`} id="dashboard-wrapper">
      
      {/* Toast notifications */}
      {alert && (
        <div className="fixed top-24 left-10 right-10 md:left-auto md:right-10 z-50 p-4 bg-white border-l-4 border-[#00c896] shadow-xl rounded-xl max-w-sm flex items-center space-x-3 space-x-reverse animate-bounce" id="dashboard-toast">
          {alert.type === 'success' ? <CheckCircle className="h-5 w-5 text-[#00c896]" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
          <div>
            <p className="text-xs font-bold font-sans">{alert.message}</p>
          </div>
        </div>
      )}

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#0f1b3d] text-white p-4 flex items-center justify-between border-b border-slate-800 w-full">
        <div className="flex items-center space-x-2 space-x-reverse">
          <GraduationCap className="h-6 w-6 text-[#00c896]" />
          <span className="font-bold font-mono text-sm uppercase tracking-wider">{profile?.name || t('appName')}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* LEFT SIDEBAR (Collapsible) */}
      <aside className={`fixed md:sticky top-[61px] md:top-0 left-0 right-0 h-[calc(100vh-61px)] md:h-screen w-full md:w-64 bg-[#0f1b3d] text-slate-300 z-40 md:z-0 flex-col justify-between transition-all duration-300 border-r border-slate-900 ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 tracking-wide font-sans flex items-center space-x-3 space-x-reverse">
            <div className="bg-[#00c896] text-white p-2 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base line-clamp-1">{profile?.name || 'Administation'}</h2>
              <span className="text-[10px] text-slate-400 block tracking-widest">{t('schoolId')}: {schoolId.slice(0, 8)}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[60vh]">
            {[
              { id: 'dashboard', label: t('dashboard'), icon: Layers },
              { id: 'students', label: t('students'), icon: Users },
              { id: 'attendance', label: t('attendance'), icon: Calendar },
              { id: 'fees', label: t('feesTab'), icon: DollarSign },
              { id: 'results', label: t('results'), icon: Award },
              { id: 'exams_schedule', label: currentLang === 'ur' ? 'امتحانی شیڈول / شیڈول' : 'امتحانی شیڈول / Exam Schedule', icon: Calendar },
              { id: 'staff', label: t('staff'), icon: Users },
              { id: 'payroll', label: t('payroll'), icon: DollarSign },
              { id: 'expenses', label: t('expenses'), icon: BookOpen },
              { id: 'settings', label: t('settings'), icon: Settings },
              { id: 'complaints', label: currentLang === 'ur' ? 'شکایات اور مدد' : 'Complaints & Support', icon: MessageSquare }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button 
                  key={m.id}
                  onClick={() => {
                    setActiveModule(m.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeModule === m.id ? 'bg-[#00c896] text-[#0f1b3d] font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Language Toggle */}
          <button 
            type="button"
            onClick={onToggleLang}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#16254a]/30 hover:bg-[#16254a]/50 text-xs font-bold transition flex items-center justify-between text-slate-300"
          >
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-[#00c896]" /> English / اردو Toggle</span>
            <span className="text-[#00c896] font-extrabold uppercase">{currentLang}</span>
          </button>

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold bg-[#db3b58]/10 hover:bg-[#db3b58]/20 text-[#ff6078] transition"
          >
            <span>{t('logout')}</span>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 min-h-screen overflow-y-auto p-4 sm:p-8" id="dashboard-main-content">
        
        {/* Top Header Information strip */}
        <div className="hidden md:flex justify-between items-center pb-6 border-b border-slate-200/80 mb-6 font-sans">
          <div>
            <h1 className="text-2xl font-black text-[#0f1b3d]">{profile?.name} - {t('welcomeBack')}</h1>
            <p className="text-xs text-slate-500">حالیہ آج کا ریکارڈ: {new Date().toLocaleDateString(currentLang === 'ur' ? 'ur-PK' : 'en-US')}</p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse bg-white p-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 shrink-0">{profile?.city}</span>
            <span className="h-4 w-[1px] bg-slate-300" />
            <div className="w-8 h-8 rounded-full bg-[#0f1b3d] text-[#00c896] flex items-center justify-center font-bold text-xs shadow-inner">
              {profile?.name ? profile.name.slice(0,2).toUpperCase() : 'ED'}
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="h-96 flex items-center justify-center text-slate-400 font-bold" id="loading-spinner">
            <div className="text-center space-y-2">
              <span className="animate-ping block text-[#00c896]">●</span>
              <span>{t('loading')}</span>
            </div>
          </div>
        ) : (
          <>
            {/* MODULE 1: MAIN DASHBOARD */}
            {activeModule === 'dashboard' && (
              <div className="space-y-6" id="module-dashboard">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">{t('totalStudents')}</span>
                      <span className="text-2xl font-black text-[#0f1b3d] font-sans">{totalStudentsCount}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f1b3d] flex items-center justify-center"><Users className="h-6 w-6" /></div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">{t('todaysAttendance')}</span>
                      <span className="text-2xl font-black text-[#0f1b3d] font-sans">{getTodaysAttendancePercent()}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center"><CheckCircle className="h-6 w-6" /></div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">{t('thisMonthFee')}</span>
                      <span className="text-2xl font-black text-[#0f1b3d] font-sans">PKR {totalCollectedCurrentMonth}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center"><DollarSign className="h-6 w-6" /></div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">{t('staffCount')}</span>
                      <span className="text-2xl font-black text-[#0f1b3d] font-sans">{staffCountTotal}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center"><Users className="h-6 w-6" /></div>
                  </div>
                </div>

                {/* ADVANCED MONTHLY FINANCIAL STATEMENT LEDGER */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6" id="dashboard-financial-ledger">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                    <div className="space-y-1 text-right sm:text-left">
                      <h3 className="font-extrabold text-[#0f1b3d] text-base flex items-center gap-2">
                        <span>مالیاتی حساب کتاب / Monthly Financial Ledger</span>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border font-normal border-emerald-100 font-sans tracking-wide">Bilingual</span>
                      </h3>
                      <p className="text-xs text-slate-400">مہینہ منتخب کریں اور طالب علموں کی فیس، اساتذہ کی تنخواہیں اور کُل مالی بچت لائیو دیکھیں</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <select 
                          value={ledgerSelectedMonth} 
                          onChange={(e) => setLedgerSelectedMonth(e.target.value)}
                          className="bg-slate-50 border border-slate-200 hover:border-slate-300 font-extrabold text-xs shadow-xs rounded-xl py-2 px-3 text-slate-800 outline-none cursor-pointer font-sans transition-all"
                        >
                          {["January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026", "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"].map(mon => (
                            <option key={mon} value={mon}>{mon}</option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">خالص بچت / Net Savings</span>
                        <span className={`text-sm font-black font-sans px-3 py-1.5 rounded-xl border inline-block ${activeSelectedNetSavings >= 0 ? 'bg-green-50 text-emerald-800 border-green-200' : 'bg-red-50 text-rose-800 border-red-200'}`}>
                          PKR {activeSelectedNetSavings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Earning Card */}
                    <div className="bg-[#f4f7ff]/70 border border-indigo-100/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">آمدنی / Fee Income</span>
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">{ledgerSelectedMonth} میں موصول شدہ کُل فیس (Students Earnings)</span>
                        <span className="text-2xl font-black text-indigo-950 font-sans block">PKR {activeSelectedFeeEarnings.toLocaleString()}</span>
                      </div>

                      <div className="pt-2 text-xs text-slate-500 font-sans space-y-1 border-t border-dashed border-indigo-100/50">
                        <div className="flex justify-between">
                          <span>طالب علموں کی تعداد:</span>
                          <span className="font-bold">{students.length} Total</span>
                        </div>
                      </div>
                    </div>

                    {/* School Expenses Card */}
                    <div className="bg-[#fff5f5]/70 border border-rose-100/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">اخراجات / Expenses</span>
                        <FileText className="h-4 w-4 text-rose-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">{ledgerSelectedMonth} کے کُل اخراجات (Electricity & Misc)</span>
                        <span className="text-2xl font-black text-rose-800 font-sans block">PKR {activeSelectedExpenses.toLocaleString()}</span>
                      </div>

                      <div className="pt-2 text-xs text-slate-500 font-sans space-y-2 border-t border-dashed border-rose-100/50">
                        <div className="flex justify-between">
                          <span>بجلی کا بل (Electricity Utility):</span>
                          <span className="font-bold font-sans text-rose-700">PKR {activeSelectedElectricity.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>متفرق اخراجات (Other School Exp):</span>
                          <span className="font-bold font-sans text-rose-700">PKR {activeSelectedOtherExpenses.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Employee Salaries Card */}
                    <div className="bg-[#f0fdf4]/70 border border-green-150/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">ملازمین تنخواہیں / Payroll</span>
                        <Users className="h-4 w-4 text-emerald-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">{ledgerSelectedMonth} میں ادا شدہ اور جاری شدہ تنخواہیں (Staff Payroll)</span>
                        <span className="text-2xl font-black text-emerald-850 font-sans block">PKR {activeSelectedSalaries.toLocaleString()}</span>
                      </div>

                      <div className="pt-2 text-xs text-slate-500 font-sans space-y-1.5 border-t border-dashed border-green-150/50">
                        <div className="flex justify-between">
                          <span className="font-semibold text-emerald-900">اساتذہ (Teachers Salary Paid):</span>
                          <span className="font-black font-sans text-emerald-800">PKR {activeSelectedTeacherSalaries.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>چوکیدار تنخواہ (Guard Salary):</span>
                          <span className="font-semibold font-sans text-slate-700">PKR {activeSelectedGuardSalaries.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>نائب قاصد (Peon Salary):</span>
                          <span className="font-semibold font-sans text-slate-700">PKR {activeSelectedPeonSalaries.toLocaleString()}</span>
                        </div>
                        {activeSelectedOtherSalaries > 0 && (
                          <div className="flex justify-between">
                            <span>دیگر سٹاف (Other Staff):</span>
                            <span className="font-semibold font-sans text-slate-700">PKR {activeSelectedOtherSalaries.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Graph Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fee visual collection target */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t('feeProgress')} - May 2026</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{t('collected')}: PKR {totalCollectedCurrentMonth}</span>
                        <span className="text-slate-500">{t('remaining')}: PKR {totalPendingCurrentMonth}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#00c896] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(totalCollectedCurrentMonth / (totalCollectedCurrentMonth + totalPendingCurrentMonth || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Activity feed */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t('recentActivity')}</h3>
                    <div className="space-y-2.5">
                      {recentActivities.length === 0 ? (
                        <p className="text-xs text-slate-400">{t('noActions')}</p>
                      ) : (
                        recentActivities.map((act, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 bg-[#f4f7ff] rounded-lg">
                            <span className="font-bold text-[#0f1b3d]">{act?.module}</span>
                            <span className="text-slate-600 shrink-0">{act?.desc}</span>
                            <span className="text-[10px] text-slate-400">{act?.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions strip */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">{t('quickActions')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button onClick={() => setActiveModule('attendance')} className="p-4 bg-slate-50 hover:bg-[#00c896]/10 hover:border-[#00c896] border border-slate-150 rounded-xl transition text-center space-y-2">
                      <Calendar className="h-6 w-6 text-[#00c896] mx-auto" />
                      <span className="text-xs font-bold block">{t('markAttendance')}</span>
                    </button>
                    <button onClick={() => setActiveModule('fees')} className="p-4 bg-slate-50 hover:bg-[#00c896]/10 hover:border-[#00c896] border border-slate-150 rounded-xl transition text-center space-y-2">
                      <DollarSign className="h-6 w-6 text-[#00c896] mx-auto" />
                      <span className="text-xs font-bold block">فیس جمع کریں</span>
                    </button>
                    <button onClick={() => handleOpenStudentModal()} className="p-4 bg-slate-50 hover:bg-[#00c896]/10 hover:border-[#00c896] border border-slate-150 rounded-xl transition text-center space-y-2">
                      <UserPlus className="h-6 w-6 text-[#00c896] mx-auto" />
                      <span className="text-xs font-bold block">{t('addStudent')}</span>
                    </button>
                    <button onClick={() => setActiveModule('results')} className="p-4 bg-slate-50 hover:bg-[#00c896]/10 hover:border-[#00c896] border border-slate-150 rounded-xl transition text-center space-y-2">
                      <Award className="h-6 w-6 text-[#00c896] mx-auto" />
                      <span className="text-xs font-bold block">{t('results')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 2: STUDENTS */}
            {activeModule === 'students' && (
              <div className="space-y-6" id="module-students">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-3 space-x-reverse bg-white p-2 border rounded-xl max-w-sm w-full">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('searchStudent')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm outline-none bg-transparent w-full"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleExportCSV} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                      {t('exportCsv')}
                    </button>
                    <button onClick={handleImportCSVClick} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                      {t('importCsv')}
                    </button>
                    <input 
                      type="file" 
                      ref={csvFileRef} 
                      onChange={handleFileImport} 
                      accept=".csv" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => handleOpenStudentModal()}
                      className="px-4 py-2.5 bg-[#00c896] text-white font-bold text-xs rounded-xl hover:bg-[#00b284] flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>طالب علم شامل کریں</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs text-right">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/70">
                          <th className="py-3 px-4">رول نمبر</th>
                          <th className="py-3 px-4">طالب علم کا نام</th>
                          <th className="py-3 px-4">کلاس</th>
                          <th className="py-3 px-4">ولدیت</th>
                          <th className="py-3 px-4">موبائل فون</th>
                          <th className="py-3 px-4">جنس</th>
                          <th className="py-3 px-4 text-center">حاضری فیصدی (Attendance %)</th>
                          <th className="py-3 px-4">کارروائی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.filter(s => 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNo.includes(searchQuery)
                        ).map(st => {
                          const attPercent = calculateStudentAttendancePercentage(st.id);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{st.rollNo}</td>
                              <td className="py-3.5 px-4 font-bold text-[#0f1b3d]">{st.name}</td>
                              <td className="py-3.5 px-4">{st.class}</td>
                              <td className="py-3.5 px-4">{st.fatherName}</td>
                              <td className="py-3.5 px-4 font-mono">{st.phone || '—'}</td>
                              <td className="py-3.5 px-4">{st.gender}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black font-sans ${attPercent >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'}`}>
                                  {attPercent}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleOpenStudentModal(st)} className="text-blue-600 p-1 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => handleDeleteStudent(st.id)} className="text-red-500 p-1 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => handleOpenFeeCollectModal(st)} className="text-[#00c896] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 font-extrabold text-[10px] rounded-lg">فیس وصول کریں</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 3: ATTENDANCE */}
            {activeModule === 'attendance' && (
              <div className="space-y-6" id="module-attendance">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">{t('date')}</label>
                    <input 
                      type="date" 
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">{t('selectClass')}</label>
                    <select 
                      value={attendanceClass}
                      onChange={(e) => setAttendanceClass(e.target.value)}
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                    >
                      {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <button 
                      onClick={handleSaveAttendance}
                      className="w-full py-3 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer text-center"
                    >
                      {t('saveAttendance')}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-slate-50/70 border-b flex justify-between items-center text-xs">
                    <span className="font-bold text-[#0f1b3d]">طالب علم معلومات</span>
                    <span className="font-bold text-[#0f1b3d]">حاضری حالت (Mark Status)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {students.filter(s => s.class === attendanceClass).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">کلاس میں کوئی طلبہ شامل نہیں ہیں۔ / No students registered in this class.</div>
                    ) : (
                      students.filter(s => s.class === attendanceClass).map(st => {
                        const status = attendanceRecords[st.id] || 'P';
                        return (
                          <div key={st.id} className="p-4 flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-700">{st.rollNo}. {st.name} <span className="text-xs font-medium text-slate-400">({st.fatherName})</span></span>
                            <div className="flex space-x-1.5 space-x-reverse">
                              <button 
                                onClick={() => handleToggleAttendance(st.id, 'P')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${status === 'P' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                              >
                                {t('present')}
                              </button>
                              <button 
                                onClick={() => handleToggleAttendance(st.id, 'A')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${status === 'A' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                              >
                                {t('absent')}
                              </button>
                              <button 
                                onClick={() => handleToggleAttendance(st.id, 'L')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${status === 'L' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                              >
                                {t('leave')}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 4: FEES */}
            {activeModule === 'fees' && (
              <div className="space-y-6" id="module-fees">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">کل جمع شدہ فیس</span>
                      <span className="text-xl font-bold text-[#0f1b3d]">PKR {totalCollectedCurrentMonth}</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">کل بقایا رقم</span>
                      <span className="text-xl font-bold text-red-600">PKR {totalPendingCurrentMonth}</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block mb-1">نادہندگان (Defaulters)</span>
                      <span className="text-xl font-bold text-rose-500">{defaultersCount} Students</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <span className="font-bold text-[#0f1b3d] text-sm">{t('feesSummary')}</span>
                  </div>

                  <div className="overflow-x-auto text-xs text-right">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/70">
                          <th className="py-3 px-4">رول نمبر</th>
                          <th className="py-3 px-4">طالب علم کا نام</th>
                          <th className="py-3 px-4">کلاس</th>
                          <th className="py-3 px-4">مقررہ فیس (Due)</th>
                          <th className="py-3 px-4">وصول شدہ (Paid)</th>
                          <th className="py-3 px-4">بقایا واجب (Balance)</th>
                          <th className="py-3 px-4">کارروائی (Action)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map(st => {
                          const studentFeeRecord = fees.find(f => f.studentId === st.id && f.month === 'May 2026');
                          const standardFee = profile?.classFees?.[st.class] || 2500;
                          const paid = studentFeeRecord ? studentFeeRecord.paid : 0;
                          const balance = studentFeeRecord ? studentFeeRecord.balance : standardFee;

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{st.rollNo}</td>
                              <td className="py-3.5 px-4 font-bold text-[#0f1b3d]">{st.name}</td>
                              <td className="py-3.5 px-4">{st.class}</td>
                              <td className="py-3.5 px-4">PKR {standardFee}</td>
                              <td className="py-3.5 px-4 font-bold text-emerald-600">PKR {paid}</td>
                              <td className="py-3.5 px-4 font-bold text-rose-600">PKR {balance}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleOpenFeeCollectModal(st)}
                                    className="px-3 py-1.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-[10px] rounded-lg text-center"
                                  >
                                    فیس وصول کریں (Collect)
                                  </button>
                                  <button 
                                    onClick={() => setActiveFeeVoucher({ student: st, record: studentFeeRecord || null })}
                                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-[10px] rounded-lg text-center"
                                  >
                                    پرنٹ واؤچر (Voucher Slip)
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 5: RESULTS & EXAMS */}
            {activeModule === 'results' && (
              <div className="space-y-6" id="module-results">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <select 
                      value={activeExamForMarks || ''} 
                      onChange={(e) => setActiveExamForMarks(e.target.value)}
                      className="p-3 bg-white border border-slate-200 font-bold text-sm rounded-xl outline-none"
                    >
                      <option value="">امتحانی ٹرم منتخب کریں / Select Exam</option>
                      {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.examName}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => setExamModal(true)}
                    className="px-4 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>نیا امتحان ترتیب دیں</span>
                  </button>
                </div>

                {activeExamForMarks ? (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
                    <h3 className="font-bold text-slate-800 text-sm">تفصیلی نمبر درج کریں (Enter Subject Marks for each Student)</h3>
                    
                    <div className="space-y-4">
                      {students.map(st => {
                        const examItem = exams.find(e => e.id === activeExamForMarks);
                        const subjects = examForm.subjects.split(',').map(s => s.trim()).filter(Boolean);
                        
                        return (
                          <div key={st.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                            <span className="font-bold text-[#0f1b3d] block">{st.rollNo}. {st.name} <span className="text-xs text-slate-400">({st.fatherName})</span></span>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {subjects.map(sub => (
                                <div key={sub} className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-500">{sub}</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    value={tempMarks[st.id]?.[sub] ?? ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setTempMarks(prev => ({
                                        ...prev,
                                        [st.id]: {
                                          ...(prev[st.id] || {}),
                                          [sub]: val
                                        }
                                      }));
                                    }}
                                    placeholder="Marks (Max 100)"
                                    className="p-2 border bg-white rounded-lg outline-none text-xs w-full text-center font-bold"
                                  />
                                </div>
                              ))}

                              <div className="space-y-1 col-span-2 sm:col-span-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500">تاثرات (Remarks)</label>
                                <input 
                                  type="text" 
                                  value={tempRemarks[st.id] ?? ''}
                                  onChange={(e) => {
                                    setTempRemarks(prev => ({
                                      ...prev,
                                      [st.id]: e.target.value
                                    }));
                                  }}
                                  placeholder="e.g. Pass"
                                  className="p-2 border bg-white rounded-lg outline-none text-xs w-full font-bold"
                                />
                              </div>
                            </div>

                            {/* Show Report card trigger if exam sub record exists */}
                            {examItem?.records?.find(r => r.studentId === st.id) && (
                              <div className="flex justify-end">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const rec = examItem.records.find(r => r.studentId === st.id);
                                    setActiveReportCard({ student: st, examItem, record: rec });
                                  }}
                                  className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                                >
                                  <Printer className="h-3 w-3" />
                                  <span>رول رزلٹ کارڈ پرنٹ کریں</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSaveExamMarks}
                        className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        امتحانی نمبر محفوظ کریں
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">کلاس ریکارڈ مانیٹر کرنے کے لئے کوئی امتحان ٹرم منتخب کریں یا نیا شیڈول تیار کریں۔</div>
                )}
              </div>
            )}

            {/* MODULE 6: STAFF */}
            {activeModule === 'staff' && (
              <div className="space-y-6" id="module-staff">
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleOpenStaffModal()}
                    className="px-4 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>نیا عملہ شامل کریں</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs text-right">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/70">
                          <th className="py-3 px-4">ملازم نام</th>
                          <th className="py-3 px-4">عہدہ</th>
                          <th className="py-3 px-4">موبائل فون</th>
                          <th className="py-3 px-4">بنیادی تنخواہ</th>
                          <th className="py-3 px-4">تاریخ شمولیت</th>
                          <th className="py-3 px-4">حالات</th>
                          <th className="py-3 px-4">عمل اور تنخواہ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {staff.map(stf => (
                          <tr key={stf.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4 font-bold text-[#0f1b3d]">{stf.name}</td>
                            <td className="py-3.5 px-4">{stf.role} <span className="text-[10px] text-slate-400">({stf.subject || '—'})</span></td>
                            <td className="py-3.5 px-4 font-mono">{stf.phone || '—'}</td>
                            <td className="py-3.5 px-4 font-bold">PKR {stf.salary}</td>
                            <td className="py-3.5 px-4">{stf.joinDate}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stf.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {stf.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenStaffModal(stf)} className="p-1 bg-slate-100 rounded-lg text-blue-600 hover:bg-slate-200"><Edit className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handlePaySalary(stf)} className="text-xs font-bold text-white bg-[#0f1b3d] px-3 py-1 rounded-lg hover:bg-[#00c896]">تنخواہ اد کریں</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 7: PAYROLL */}
            {activeModule === 'payroll' && (
              <div className="space-y-6" id="module-payroll">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 w-full max-w-xs">
                    <label className="text-xs font-bold text-slate-500 block">{t('payrollMonth')}</label>
                    <select 
                      value={payrollMonthYear}
                      onChange={(e) => setPayrollMonthYear(e.target.value)}
                      className="p-3 bg-slate-50 border border-slate-200 font-bold text-sm rounded-xl outline-none w-full"
                    >
                      <option value="May 2026">May 2026</option>
                      <option value="June 2026">June 2026</option>
                      <option value="July 2026">July 2026</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs text-right">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/70">
                          <th className="py-3 px-4">ملازم نام</th>
                          <th className="py-3 px-4">آپریشنل بنیادی تنخواہ</th>
                          <th className="py-3 px-4">حاصل رقم ادائیگی درجہ</th>
                          <th className="py-3 px-4">تنخواہ سلپ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {staff.map(stf => {
                          const record = payroll.find(p => p.staffId === stf.id && p.month === payrollMonthYear);
                          const isPaid = !!record;

                          return (
                            <tr key={stf.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4 font-bold text-[#0f1b3d]">{stf.name}</td>
                              <td className="py-3.5 px-4 font-bold">PKR {stf.salary}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {isPaid ? t('salaryPaid') : t('salaryPending')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {isPaid ? (
                                  <button 
                                    onClick={() => setActiveSalarySlip({ staff: stf, record: record! })}
                                    className="px-3 py-1 bg-slate-100 rounded text-slate-700 hover:bg-slate-200 font-bold text-[10px]"
                                  >
                                    سلپ پرنٹ کریں
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handlePaySalary(stf)}
                                    className="px-3 py-1 bg-[#0f1b3d] text-[#00c896] hover:bg-[#00c896] hover:text-[#0f1b3d] font-bold rounded text-[10px]"
                                  >
                                    تنخواہ دیں
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 8: EXPENSES */}
            {activeModule === 'expenses' && (
              <div className="space-y-6" id="module-expenses">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">{t('monthlyExpensesSummary')}</h3>
                  <button 
                    onClick={() => setExpenseModal(true)}
                    className="px-4 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>نیا خرچہ درج کریں</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-xs text-right">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/70">
                          <th className="py-3 px-4">تاریخ</th>
                          <th className="py-3 px-4">کیٹیگری</th>
                          <th className="py-3 px-4">خرچہ تفصیل</th>
                          <th className="py-3 px-4">کُل رقم</th>
                          <th className="py-3 px-4">رجسٹرار بقلم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {expenses.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-400">کوئی اخراجات ریکارڈ نہیں ہے۔</td></tr>
                        ) : (
                          expenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4 font-mono text-slate-500">{exp.date}</td>
                              <td className="py-3.5 px-4 font-bold">{exp.category}</td>
                              <td className="py-3.5 px-4">{exp.description}</td>
                              <td className="py-3.5 px-4 font-bold text-rose-500">PKR {exp.amount}</td>
                              <td className="py-3.5 px-4 text-xs text-slate-400">{exp.addedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* MODULE: EXAMS SCHEDULE */}
            {activeModule === 'exams_schedule' && (() => {
              const filteredSchedules = examSchedules.filter(item => {
                const query = (examSearchQuery || '').toLowerCase();
                const matchesSearch = (item.examName || '').toLowerCase().includes(query) ||
                                      (item.class || '').toLowerCase().includes(query) ||
                                      (item.subject || '').toLowerCase().includes(query);
                const matchesClass = examClassFilter === 'All Classes' || item.class === examClassFilter;
                return matchesSearch && matchesClass;
              });

              return (
                <div className="space-y-6" id="module-exams-schedule">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
                    <div className="space-y-1 text-right sm:text-left">
                      <h3 className="font-extrabold text-[#0f1b3d] text-lg flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#00c896] rounded-full inline-block"></span>
                        <span>امتحانی شیڈولنگ بورڈ / Exam Schedule Board</span>
                      </h3>
                      <p className="text-xs text-slate-400">تمام کلاسوں اور پرچوں کے امتحانی نظام الاوقات کو یہاں سے مینیج کریں</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          setBulkExamForm({
                            examName: 'Final Exams 2026',
                            startDate: '2026-06-01',
                            subjects: 'English, Mathematics, Science, Urdu, Islamiat',
                            startTime: '09:00',
                            endTime: '12:00',
                            totalMarks: 100,
                            classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10']
                          });
                          setBulkExamScheduleModal(true);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 text-emerald-100" />
                        <span>سب کلاسز کا شیڈول ایک بار میں تیار کریں / Bulk Create (All Classes)</span>
                      </button>

                      <button 
                        onClick={() => {
                          setExamScheduleForm({
                            examName: 'Final Exams 2026',
                            class: 'Class 5',
                            subject: 'Mathematics',
                            date: '2026-06-05',
                            startTime: '09:00',
                            endTime: '12:00',
                            totalMarks: 100,
                            roomNo: 'Room A'
                          });
                          setExamScheduleModal({ open: true, editItem: null });
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#0f1b3d] text-[#00c896] hover:bg-opacity-90 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-500/20 shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>نیا امتحان شیڈول کریں / Create Schedule</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter and stats */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-5 relative">
                        <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="کلاس، مضمون یا امتحان تلاش کریں... / Exam, class, subject..."
                          value={examSearchQuery}
                          onChange={(e) => setExamSearchQuery(e.target.value)}
                          className="w-full text-xs font-semibold pr-10 pl-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border rounded-xl outline-none focus:border-indigo-400 transition-all text-right"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <select
                          value={examClassFilter}
                          onChange={(e) => setExamClassFilter(e.target.value)}
                          className="w-full text-xs font-extrabold py-3 px-4 bg-indigo-50/60 border border-indigo-100 hover:border-indigo-200 text-indigo-950 rounded-xl outline-none cursor-pointer transition-all text-right"
                        >
                          <option value="All Classes">تمام کلاسیں / All Classes</option>
                          {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => setActiveDateSheetClass(examClassFilter)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0f1b3d] font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                          <span>ڈیٹ شیٹ پرنٹ کریں / Print Date Sheet</span>
                        </button>

                        <button
                          onClick={handleClearAllSchedules}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-750 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>شیڈول صاف کریں / Clear All</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-slate-400">کُل شیڈولڈ پرچے:</span>
                        <span className="font-extrabold text-[#0f1b3d] font-sans text-sm">{filteredSchedules.length} Papers</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-slate-400">امتحانی بورڈ:</span>
                        <span className="font-extrabold text-emerald-700 font-sans text-xs">Bilingual Board</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-slate-400">فلٹر شدہ کلاس:</span>
                        <span className="font-extrabold text-indigo-700 text-xs">{examClassFilter}</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-slate-400">سستم اسٹیٹس:</span>
                        <span className="font-extrabold text-emerald-600 text-xs">مستعد / Active</span>
                      </div>
                    </div>

                    {/* Listings */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="py-3.5 px-4 text-right">امتحان کا نام / Exam</th>
                            <th className="py-3.5 px-4 text-center">کلاس / Class</th>
                            <th className="py-3.5 px-4 text-center">پرچہ / Subject</th>
                            <th className="py-3.5 px-4 text-center">تاریخ / Date</th>
                            <th className="py-3.5 px-4 text-center">وقت / Timing</th>
                            <th className="py-3.5 px-4 text-center">روم نمبر / Room</th>
                            <th className="py-3.5 px-4 text-center">کُل نمبر / Marks</th>
                            <th className="py-3.5 px-4 text-center">ایکشنز / Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSchedules.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400 space-y-3">
                                <Calendar className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
                                <p className="font-semibold text-slate-600">کوئی امتحانی شیڈول تاحال موجود نہیں ہے</p>
                                <p className="text-[11px] text-slate-400">نیا شیڈول بنانے کے لیے اوپر موجود بٹن پر کلک کریں</p>
                              </td>
                            </tr>
                          ) : (
                            filteredSchedules.map(sched => (
                              <tr key={sched.id} className="hover:bg-slate-50/60 font-medium transition-colors">
                                <td className="py-4 px-4 font-bold text-slate-800 text-right">{sched.examName}</td>
                                <td className="py-4 px-4 text-center"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-sans font-bold">{sched.class}</span></td>
                                <td className="py-4 px-4 text-center text-slate-700 font-bold">{sched.subject}</td>
                                <td className="py-4 px-4 text-center font-sans font-semibold text-slate-600">{sched.date}</td>
                                <td className="py-4 px-4 text-center font-sans font-semibold text-slate-500">{sched.startTime} - {sched.endTime}</td>
                                <td className="py-4 px-4 text-center text-slate-600 font-sans font-semibold">{sched.roomNo || 'N/A'}</td>
                                <td className="py-4 px-4 text-center font-sans font-bold text-emerald-600 font-sans">{sched.totalMarks || 100}</td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button 
                                      onClick={() => {
                                        setExamScheduleForm({
                                          examName: sched.examName,
                                          class: sched.class,
                                          subject: sched.subject,
                                          date: sched.date,
                                          startTime: sched.startTime,
                                          endTime: sched.endTime,
                                          totalMarks: sched.totalMarks,
                                          roomNo: sched.roomNo
                                        });
                                        setExamScheduleModal({ open: true, editItem: sched });
                                      }}
                                      className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                                    >
                                      تبدیل کریں / Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteExamSchedule(sched.id)}
                                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold cursor-pointer"
                                    >
                                      حذف / Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* MODULE 10: SETTINGS */}
            {activeModule === 'settings' && (
              <div className="space-y-6" id="module-settings">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-4xl mx-auto">
                  <h3 className="font-bold text-[#0f1b3d] text-lg border-b pb-3">{t('settingsTitle')}</h3>
                  
                  <form onSubmit={handleUpdateSettings} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">اسکول کا نام (School Name)</label>
                        <input 
                          type="text" 
                          value={settingsBuffer.name}
                          onChange={(e) => setSettingsBuffer(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">{t('addressLbl')}</label>
                        <input 
                          type="text" 
                          value={settingsBuffer.address}
                          onChange={(e) => setSettingsBuffer(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">اسکول کا شہر / City</label>
                        <input 
                          type="text" 
                          value={settingsBuffer.city}
                          onChange={(e) => setSettingsBuffer(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">رابطہ فون نمبر (School Phone)</label>
                        <input 
                          type="text" 
                          value={settingsBuffer.phone}
                          onChange={(e) => setSettingsBuffer(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-2 col-span-1 sm:col-span-2 border-t pt-4">
                        <label className="text-xs font-bold text-slate-500 block">اسکول کا آفیشل لوگو / School Official Logo (سلپس اور فیس واؤچرز پر نمایاں کرنے کے لیے)</label>
                        <div className="flex items-center gap-4 flex-wrap bg-[#f4f7ff]/50 p-4 rounded-2xl border border-indigo-100/50">
                          {profile?.logoUrl ? (
                            <img src={profile.logoUrl} alt="School Logo" className="h-16 max-w-[160px] object-contain bg-white border border-slate-200 rounded-xl p-1 shadow-sm" />
                          ) : (
                            <div className="bg-white h-16 w-32 rounded-xl flex items-center justify-center border border-dashed border-slate-350 text-[10px] font-bold text-slate-400">لوگو اپ لوڈ نہیں ہوا</div>
                          )}
                          <div className="space-y-1">
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="school-logo-input" 
                              className="hidden" 
                              onChange={handleLogoUpload}
                            />
                            <label 
                              htmlFor="school-logo-input" 
                              className="px-4 py-2 bg-[#0f1b3d] hover:bg-[#00c896] text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md inline-flex items-center gap-1.5 transition active:scale-95 duration-100"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>لوگو اپ لوڈ کریں / Upload Logo</span>
                            </label>
                            <span className="text-[10px] text-slate-400 block p-0.5">PNG یا Jpeg تصویر اپلوڈنگ کے دوران خودکار طور پر ری سائز ہوگی</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')}</button>
                    </div>
                  </form>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-red-150 space-y-4">
                    <h4 className="text-red-500 font-bold text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 animate-bounce" /> {t('dangerZone')}</h4>
                    <p className="text-slate-500 text-xs">اسکول کا تمام امتحانی ریکارڈ، واٹس ایپ فیس بقایا اور ڈیٹا کلیئر کریں (This operation is irreversible).</p>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input 
                        type="text" 
                        placeholder={t('deleteConfirmText')}
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        className="text-xs p-3 bg-red-50/50 border border-red-200 outline-none rounded-xl grow uppercase font-bold text-slate-700"
                      />
                      <button 
                        onClick={handleDeleteAllData}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl text-center cursor-pointer"
                      >
                        {t('deleteAllData')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 11: COMPLAINTS & SUPPORT */}
            {activeModule === 'complaints' && (
              <div className="space-y-6" id="module-complaints">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Complaint Submission form */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h3 className="font-extrabold text-[#0f1b3d] text-base border-b pb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-5 w-5 text-[#00c896]" />
                      <span>{currentLang === 'ur' ? 'نئی شکایت یا مدد کا ٹکٹ بنائیں' : 'Lodge Support Request'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      {currentLang === 'ur' ? 'اگر آپ کو سسٹم کے استعمال میں کوئی شکایت ہو یا لائسنس میں مدد درکار ہو تو براہِ کرم تفصیلی ٹکٹ بنائیں۔ محمد طیب (سسٹم انجینئر) جلد از جلد جواب دیں گے۔' : 'If you face any issues using the EduTrack platform or need billing updates, submit a ticket. Muhammad Tayyab will respond promptly.'}
                    </p>

                    <form onSubmit={handleSaveComplaint} className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">{currentLang === 'ur' ? 'موضوع / شکایت کا عنوان' : 'Subject of Support Request'}</label>
                        <input 
                          type="text" 
                          value={newComplaintForm.subject}
                          onChange={(e) => setNewComplaintForm(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder={currentLang === 'ur' ? 'مثال کے طور پر: نئے رپورٹس کا مسئلہ' : 'e.g. Invoicing updates or system issue'}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none focus:border-[#00c896]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">{currentLang === 'ur' ? 'شکایت کی تفصیلات' : 'Detailed description'}</label>
                        <textarea 
                          rows={5}
                          value={newComplaintForm.description}
                          onChange={(e) => setNewComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder={currentLang === 'ur' ? 'پورے مسئلے کی تفصیل یہاں لکھیں تاکہ ہم معاونت فراہم کر سکیں...' : 'Explain the issue in detail so Muhammad Tayyab can troubleshoot...'}
                          className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none focus:border-[#00c896] font-sans"
                          required
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={submittingComplaint}
                        className="w-full py-3 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {submittingComplaint && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{currentLang === 'ur' ? 'ٹکٹ جمع کروائیں' : 'Submit Ticket'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Complaints History stream list */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-[#0f1b3d] text-base border-b pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="h-5 w-5 text-indigo-500" />
                          <span>{currentLang === 'ur' ? 'آپ کی شکایات کے جوابات کی تاریخ' : 'Support Ticket History'}</span>
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                          {complaintsList.length} Tickets
                        </span>
                      </h3>

                      {complaintsList.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold font-sans">
                          {currentLang === 'ur' ? 'ابھی تک آپ کی کوئی شکایت رجسٹرڈ نہیں ہے۔' : 'You have no logged support requests currently.'}
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                          {complaintsList.map((c) => {
                            const isPending = c.status === 'Pending';
                            const isResolved = c.status === 'Resolved';
                            return (
                              <div key={c.id} className="border p-4 rounded-2xl space-y-3 hover:shadow-sm transition">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <h4 className="font-extrabold text-[#0f1b3d] text-sm">{c.subject}</h4>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                  </div>
                                  
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isResolved ? 'bg-emerald-50 text-emerald-700 border' : isPending ? 'bg-rose-50 text-rose-700 border animate-pulse' : 'bg-amber-50 text-amber-700 border'
                                  }`}>
                                    {c.status}
                                  </span>
                                </div>

                                <p className="text-slate-600 text-xs font-sans bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  {c.description}
                                </p>

                                {c.reply ? (
                                  <div className="bg-[#f0f9ff] border border-blue-100 p-3 rounded-xl space-y-1 block text-right">
                                    <span className="text-xs font-bold text-indigo-600 block">
                                      {currentLang === 'ur' ? 'محمد طیب کا جواب:' : 'Response from Creator Muhammad Tayyab:'}
                                    </span>
                                    <p className="text-slate-700 text-xs italic font-medium">{c.reply}</p>
                                    <span className="text-[9px] text-slate-400 font-mono block">
                                      {c.repliedAt ? new Date(c.repliedAt).toLocaleDateString() : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-rose-500 font-mono font-bold flex items-center gap-1">
                                    <Clock className="h-3 w-3 animate-spin" />
                                    <span>{currentLang === 'ur' ? 'ایڈمن جائزہ لے رہے ہیں' : 'Awaiting super admin review...'}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 italic flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{currentLang === 'ur' ? 'اگر لائیو معاونت چاہیے ہو تو طیب سے ڈائریکٹ واٹس ایپ یا لنکڈ ان ان باکس پر رابطہ کریں۔' : 'For urgent support queries, connect with Tayyab directly via LinkedIn inbox.'}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* STUDENT ADD/EDIT MODAL OVERLAY */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 border shadow-2xl relative text-right">
            <button onClick={() => setStudentModal({ open: false })} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-6 text-center">{studentModal.editItem ? t('editStudentTitle') : t('addStudentTitle')}</h3>
            
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">طالب علم کا نام *</label>
                  <input 
                    type="text" 
                    value={studentForm.name}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">ولدیت نام *</label>
                  <input 
                    type="text" 
                    value={studentForm.fatherName}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, fatherName: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">رول نمبر *</label>
                  <input 
                    type="text" 
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, rollNo: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">کلاس منتخب کریں</label>
                  <select 
                    value={studentForm.class}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                  >
                    {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">جنس</label>
                  <select 
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                  >
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">رابطہ نمبر (موبائل)</label>
                  <input 
                    type="text" 
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-start space-x-2 space-x-reverse pt-4 border-t">
                <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')}</button>
                <button type="button" onClick={() => setStudentModal({ open: false })} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT FEE MODAL OVERLAY */}
      {feeModal.open && feeModal.student && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border shadow-2xl relative text-right">
            <button onClick={() => setFeeModal({ open: false })} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-6 text-center">{t('collectFeeTitle')}</h3>
            
            <form onSubmit={handleSaveFee} className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">طالب علم کا نام</span>
                <span className="text-base font-black text-[#0f1b3d]">{feeModal.student.name}</span>
                <span className="text-xs block text-slate-400">Class: {feeModal.student.class} · Roll #{feeModal.student.rollNo}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">پیک فیس بل من مئی (Amount in PKR)</label>
                <input 
                  type="number" 
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-bold font-sans text-center"
                />
              </div>

              <div className="flex justify-start space-x-2 space-x-reverse pt-4 border-t">
                <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')} فیس</button>
                <button type="button" onClick={() => setFeeModal({ open: false })} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {examModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border shadow-2xl relative text-right">
            <button onClick={() => setExamModal(false)} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-6 text-center">{t('createExamBtn')}</h3>
            
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">امتحان کا نام (Primary Exam Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. First Term Exams"
                  value={examForm.examName}
                  onChange={(e) => setExamForm(prev => ({ ...prev, examName: e.target.value }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">مقررہ مضامین (Subjects - separated by comma)</label>
                <input 
                  type="text" 
                  value={examForm.subjects}
                  onChange={(e) => setExamForm(prev => ({ ...prev, subjects: e.target.value }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none text-xs"
                />
              </div>

              <div className="flex justify-start space-x-2 space-x-reverse pt-4 border-t">
                <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')} امتحان</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF CREATE/EDIT MODAL OVERLAY */}
      {staffModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border shadow-2xl relative text-right">
            <button onClick={() => setStaffModal({ open: false })} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-6 text-center">{staffModal.editItem ? t('editStaffTitle') : t('addStaffBtn')}</h3>
            
            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">ملازم نام *</label>
                <input 
                  type="text" 
                  value={staffForm.name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">آفس کا بنیادی عہدہ (Staff Role)</label>
                <select 
                  value={staffForm.role}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                >
                  <option value="Teacher">{t('teacher')}</option>
                  <option value="Admin">{t('admin')}</option>
                  <option value="Guard">{t('guard')}</option>
                  <option value="Peon">{t('peon')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">خصوصی تدریسی مضمون / Subject</label>
                <input 
                  type="text" 
                  value={staffForm.subject}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">ماہانہ مختص تنخواہ (Salary PKR)</label>
                <input 
                  type="number" 
                  value={staffForm.salary}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                  required
                />
              </div>

              <div className="flex justify-start space-x-2 space-x-reverse pt-4 border-t">
                <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')} عملہ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OPERATIONAL EXPENSE MODAL */}
      {expenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border shadow-2xl relative text-right">
            <button onClick={() => setExpenseModal(false)} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-6 text-center">{t('addExpense')}</h3>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اخراجات تفصیل / Description</label>
                <input 
                  type="text" 
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="بل یا ڈلیوری تفصیل"
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">کیٹیگری / Category</label>
                <select 
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none"
                >
                  <option value="Utilities">{t('utilities')}</option>
                  <option value="Maintenance">{t('maintenance')}</option>
                  <option value="Supplies">{t('supplies')}</option>
                  <option value="Events">{t('events')}</option>
                  <option value="Salaries">{t('salaries')}</option>
                  <option value="Other">{t('otherExpenses')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">کُل لاگت (Amount in PKR)</label>
                <input 
                  type="number" 
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full text-sm p-3 bg-slate-50 border rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div className="flex justify-start space-x-2 space-x-reverse pt-4 border-t">
                <button type="submit" className="px-6 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">{t('save')} رجسٹرار</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINT DIALOG: STUDENT REPORT CARD POPUP */}
      {activeReportCard && (
        <div className="fixed inset-0 z-50 bg-white md:bg-slate-900/60 overflow-y-auto flex items-center justify-center p-0 md:p-6" id="report-card-overlay">
          <div className="bg-white max-w-2xl w-full p-8 md:rounded-3xl shadow-2xl relative text-right font-sans border flex flex-col justify-between" id="printable-report-body">
            
            {/* Modal actions close & print */}
            <div className="flex justify-between items-center pb-4 border-b mb-6 no-print">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0f1b3d] text-white font-bold text-xs rounded-xl hover:bg-[#00c896] flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>پرنٹ رپورٹ کارڈ / Print</span>
              </button>
              
              <button onClick={() => setActiveReportCard(null)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Structured Letterhead Card Body */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b-2 border-[#0f1b3d] pb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <GraduationCap className="h-10 w-10 text-[#00c896]" />
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0f1b3d]">{profile?.name}</h2>
                    <p className="text-[10px] text-slate-400 font-bold">{profile?.address}, {profile?.city}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs uppercase font-extrabold text-[#0f1b3d] block">{activeReportCard.examItem.examName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Date: {activeReportCard.examItem.date}</span>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4 text-xs font-bold leading-relaxed text-slate-700">
                <div>طالب علم کا نام/Student Name: <span className="text-[#0f1b3d] font-black">{activeReportCard.student.name}</span></div>
                <div>ولدیت/Father Name: <span>{activeReportCard.student.fatherName}</span></div>
                <div>رول نمبر/Roll No: <span className="font-sans text-slate-500 font-bold">{activeReportCard.student.rollNo}</span></div>
                <div>کلاس/Class: <span>{activeReportCard.student.class}</span></div>
              </div>

              {/* Subject Breakdown Marks sheet table */}
              <div className="overflow-x-auto text-right">
                <table className="w-full text-xs text-right border">
                  <thead>
                    <tr className="bg-[#0f1b3d] text-white text-[11px] uppercase">
                      <th className="py-2.5 px-4 border text-right">مضمون Name (Subject)</th>
                      <th className="py-2.5 px-4 border text-center">کل فنڈ نمبر (Max)</th>
                      <th className="py-2.5 px-4 border text-center font-black">حاصل کردہ نمبر (Marks)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.keys(activeReportCard.record.subjects).map(sub => (
                      <tr key={sub} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 border text-right font-bold text-[#0f1b3d]">{sub}</td>
                        <td className="py-3 px-4 border text-center font-mono">100</td>
                        <td className="py-3 px-4 border text-center font-mono font-bold text-slate-800">{activeReportCard.record.subjects[sub]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary calculations total percentage grade */}
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-700">
                <div>حاصل کردہ نمبر / Aggregate: <span className="text-[#0f1b3d] font-black">{activeReportCard.record.total} Marks</span></div>
                <div>فیصدی موازنہ / Percentage: <span className="font-sans text-slate-600 font-bold">{activeReportCard.record.percentage}%</span></div>
                <div>حتمی گریڈ / Final Grade: <span className="px-3 py-1 bg-[#00c896]/10 text-emerald-800 rounded font-black text-sm">{activeReportCard.record.grade}</span></div>
              </div>

              {/* Teacher Remarks block */}
              {activeReportCard.record.remarks && (
                <div className="p-4 border rounded-xl bg-[#00c896]/5 text-xs text-[#0f1b3d] leading-relaxed">
                  <span className="font-bold block mb-1">خصوصی تاثرات اساتذہ (Consulting Remarks):</span>
                  {activeReportCard.record.remarks}
                </div>
              )}
            </div>

            {/* School principal visual stamp section */}
            <div className="pt-12 flex justify-between text-xs font-bold text-slate-400 no-print border-t mt-4">
              <span className="border-t border-dashed border-slate-350 pt-2 px-6">کلاس انچارج انگوٹھا (Class Teacher)</span>
              <span className="border-t border-dashed border-slate-350 pt-2 px-6">مہر پرنسپل اسکول (Principal stamp)</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINT DIALOG: PAYROLL SALARY SLIP POPUP */}
      {activeSalarySlip && (
        <div className="fixed inset-0 z-50 bg-white md:bg-slate-900/60 overflow-y-auto flex items-center justify-center p-0 md:p-6" id="salary-slip-overlay">
          <div className="bg-white max-w-md w-full p-8 md:rounded-3xl shadow-2xl relative text-right font-sans border-2 flex flex-col justify-between" id="printable-slip-body">
            
            <div className="flex justify-between items-center pb-4 border-b mb-6 no-print">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0f1b3d] text-white font-bold text-xs rounded-xl hover:bg-[#00c896] flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>پرنٹ تنخواہ سلپ / Print Slip</span>
              </button>
              
              <button onClick={() => setActiveSalarySlip(null)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {profile?.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img src={profile.logoUrl} alt="School Logo" className="h-16 w-16 object-contain rounded-full border border-slate-100 p-1" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold text-[#0f1b3d]">{profile?.name}</h2>
                <h3 className="text-xs uppercase font-bold text-[#00c896] tracking-widest">ماہانہ ادائیگی تنخواہ سلپ / Salary Slip</h3>
                <span className="text-[10px] text-slate-400 block font-mono">Month Period: {activeSalarySlip.record.month}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
                <div>ملازم نام/Name: <span className="font-bold text-[#0f1b3d]">{activeSalarySlip.staff.name}</span></div>
                <div>بنیادی عہدہ/Role: <span>{activeSalarySlip.staff.role} ({activeSalarySlip.staff.subject || '—'})</span></div>
                <div>شناختی ID: <span className="font-mono text-slate-400">{activeSalarySlip.staff.id.slice(0, 8)}</span></div>
              </div>

              <div className="space-y-2 text-xs border rounded-xl overflow-hidden">
                <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-500">
                  <span>تفصیلات</span>
                  <span>رقم (PKR)</span>
                </div>
                
                <div className="flex justify-between p-3">
                  <span>بنیادی تنخواہ (Basic Pay)</span>
                  <span className="font-bold">PKR {activeSalarySlip.record.basic}</span>
                </div>

                <div className="flex justify-between p-3 border-t">
                  <span>میٹ بونفس بونس (Incentives / Bonus)</span>
                  <span className="font-bold text-green-600">PKR {activeSalarySlip.record.bonus}</span>
                </div>

                <div className="flex justify-between p-3 border-t">
                  <span>بنیادی کٹوتیاں (Deductions)</span>
                  <span className="font-bold text-red-500">PKR {activeSalarySlip.record.deductions}</span>
                </div>

                <div className="flex justify-between p-3 bg-[#0f1b3d] text-[#00c896] font-black text-sm">
                  <span>کُل حاصل ادائیگی (Net Disbursed)</span>
                  <span>PKR {activeSalarySlip.record.net}</span>
                </div>
              </div>
            </div>

            <div className="pt-12 text-center text-[10px] font-bold text-slate-400 space-y-1">
              <p>کمپیوٹرائزڈ تیار کردہ سرکاری رسید — دستخط کی ضرورت نہیں</p>
              <p className="no-print">© {t('appName')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINT DIALOG: STUDENT FEE VOUCHER POPUP */}
      {activeFeeVoucher && (
        <div className="fixed inset-0 z-50 bg-white md:bg-slate-900/60 overflow-y-auto flex items-center justify-center p-0 md:p-6" id="fee-voucher-overlay">
          <div className="bg-white max-w-md w-full p-8 md:rounded-3xl shadow-2xl relative text-right font-sans border-2 flex flex-col justify-between animate-in fade-in-50 duration-200" id="printable-voucher-body">
            
            <div className="flex justify-between items-center pb-4 border-b mb-6 no-print">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0f1b3d] text-white font-bold text-xs rounded-xl hover:bg-[#00c896] flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>پرنٹ واؤچر / Print Voucher</span>
              </button>
              
              <button onClick={() => setActiveFeeVoucher(null)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Optional school brand logo */}
              {profile?.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img src={profile.logoUrl} alt="School Logo" className="h-16 w-16 object-contain rounded-full border border-slate-100 p-1" referrerPolicy="no-referrer" />
                </div>
              )}

              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold text-[#0f1b3d]">{profile?.name}</h2>
                <h3 className="text-xs uppercase font-bold text-[#00c896] tracking-widest">فیس ادائیگی رسید / Student Fee Slip</h3>
                <span className="text-[10px] text-slate-400 block font-mono">Billing Month: May 2026</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
                <div>طالب علم کا نام/Student Name: <span className="font-bold text-[#0f1b3d]">{activeFeeVoucher.student.name}</span></div>
                <div>رول نمبر/Roll No: <span className="font-mono font-bold">{activeFeeVoucher.student.rollNo}</span></div>
                <div>کلاس/Class: <span className="font-bold">{activeFeeVoucher.student.class}</span></div>
                <div>ولدیت/Father's Name: <span>{activeFeeVoucher.student.fatherName}</span></div>
              </div>

              <div className="space-y-2 text-xs border rounded-xl overflow-hidden animate-in">
                <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-500">
                  <span>تفصیلاتِ فیس</span>
                  <span>رقم (PKR)</span>
                </div>
                
                <div className="flex justify-between p-3">
                  <span>مقررہ ماہانہ فیس (Monthly Tuition Fee)</span>
                  <span className="font-mono">PKR {profile?.classFees?.[activeFeeVoucher.student.class] || 2500}</span>
                </div>

                <div className="flex justify-between p-3 border-t">
                  <span>وصول شدہ رقم (Paid Amount)</span>
                  <span className="font-mono text-emerald-600 font-bold">PKR {activeFeeVoucher.record?.paid || 0}</span>
                </div>

                <div className="flex justify-between p-3 border-t bg-slate-50">
                  <span>بقایا واجب الادا (Remaining Balance)</span>
                  <span className="font-mono text-rose-600 font-bold">PKR {activeFeeVoucher.record ? activeFeeVoucher.record.balance : (profile?.classFees?.[activeFeeVoucher.student.class] || 2500)}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 text-center text-[10px] font-bold text-slate-400 space-y-1 border-t mt-6">
              <p>کمپیوٹرائزڈ تیار کردہ اسکول ریکارڈ واؤچر — دستخط کی ضرورت نہیں</p>
              <p className="no-print">© {t('appName')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PRINT DIALOG: EXAM DATE SHEET POPUP */}
      {activeDateSheetClass && (() => {
        const dateSheetItems = examSchedules
          .filter(item => activeDateSheetClass === 'All Classes' || item.class === activeDateSheetClass)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return (
          <div className="fixed inset-0 z-50 bg-white md:bg-slate-900/60 overflow-y-auto flex items-center justify-center p-0 md:p-6" id="date-sheet-overlay">
            <div className="bg-white max-w-2xl w-full p-8 md:rounded-3xl shadow-2xl relative text-right font-sans border-2 flex flex-col justify-between animate-in fade-in-50 duration-200" id="printable-datesheet-body">
              
              <div className="flex justify-between items-center pb-4 border-b mb-6 no-print">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>ڈیٹ شیٹ پرنٹ کریں / Print Date Sheet</span>
                </button>
                
                <button onClick={() => setActiveDateSheetClass(null)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {profile?.logoUrl && (
                  <div className="flex justify-center mb-1">
                    <img src={profile.logoUrl} alt="School Logo" className="h-16 w-16 object-contain rounded-full border border-slate-100 p-1" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-[#0f1b3d]">{profile?.name || 'School ERP'}</h2>
                  <h3 className="text-xs uppercase font-extrabold text-[#00c896] tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">امتحانی نظام الاوقات (ڈیٹ شیٹ) / Official Exam Date Sheet</h3>
                  {activeDateSheetClass !== 'All Classes' && (
                    <p className="text-xs font-bold text-slate-700 mt-2">کلاس / Class: <span className="text-indigo-700 font-extrabold">{activeDateSheetClass}</span></p>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b border-slate-200 text-slate-700">
                        <th className="py-3 px-4 text-right">تاریخ / Date</th>
                        <th className="py-3 px-4 text-center font-bold">دن / Day</th>
                        <th className="py-3 px-4 text-center font-bold">کلاس / Class</th>
                        <th className="py-3 px-4 text-center font-bold">پرچہ / Subject</th>
                        <th className="py-3 px-4 text-center font-bold">وقت / Timing</th>
                        <th className="py-3 px-4 text-center font-bold">کمرہ نمبر / Room</th>
                        <th className="py-3 px-4 text-center font-bold">نمبرات / Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold font-sans">
                      {dateSheetItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">کوئی امتحانی شیڈول تاحال موجود نہیں ہے</td>
                        </tr>
                      ) : (
                        dateSheetItems.map((sched, index) => {
                          const schedDate = new Date(sched.date);
                          const dayName = schedDate.toLocaleDateString('ur-PK', { weekday: 'long' }) + ' / ' + schedDate.toLocaleDateString('en-US', { weekday: 'long' });
                          return (
                            <tr key={index} className="hover:bg-slate-50/40">
                              <td className="py-3.5 px-4 font-mono text-right text-slate-600">{sched.date}</td>
                              <td className="py-3.5 px-4 text-center text-[10px] text-slate-500">{dayName}</td>
                              <td className="py-3.5 px-4 text-center"><span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-sans font-bold">{sched.class}</span></td>
                              <td className="py-3.5 px-4 text-center text-slate-850 font-bold">{sched.subject}</td>
                              <td className="py-3.5 px-4 text-center font-sans font-semibold">{sched.startTime} - {sched.endTime}</td>
                              <td className="py-3.5 px-4 text-center text-slate-500 font-mono">{sched.roomNo || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{sched.totalMarks || 100}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 text-slate-600 font-bold text-right">
                  <div className="border border-dashed p-3 rounded-xl space-y-1 bg-slate-50 text-right">
                    <p className="text-[#0f1b3d] font-extrabold text-[11px] text-right">امیدواروں کے لیے اہم ہدایات / Important Instructions:</p>
                    <ul className="list-decimal list-inside text-[10px] text-slate-500 space-y-1 leading-relaxed text-right">
                      <li>تمام طلباء کا امتحانی کارڈ ہمراہ لانا لازمی ہے۔</li>
                      <li>امتحان شروع ہونے سے ۱۵ منٹ قبل رپورٹ کریں۔</li>
                      <li>موبائل فون یا ممنوعہ الیکٹرانک اشیاء لانا سخت منع ہے۔</li>
                    </ul>
                  </div>

                  <div className="flex flex-col justify-end items-center pb-2 border border-dashed rounded-xl p-3 bg-slate-50">
                    <div className="w-28 border-b-2 border-slate-300 h-8"></div>
                    <span className="text-[10px] text-slate-500 mt-2 font-black">دستخط پرنسپل / Principal Signature</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 text-center text-[10px] font-bold text-slate-400 space-y-1 border-t mt-6">
                <p>مصدقہ اسکول مینجمنٹ پورٹل ڈیٹ شیٹ — برائے سالانہ / میعاد امتحانات ۲۰۲۶</p>
                <p className="no-print">© {t('appName')}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EXAM SCHEDULE ADD/EDIT MODAL OVERLAY */}
      {examScheduleModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 border shadow-2xl relative text-right">
            <button onClick={() => setExamScheduleModal({ open: false })} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-base mb-6 text-center">
              {examScheduleModal.editItem ? 'امتحانی شیڈول تبدیل کریں / Edit Exam Schedule' : 'نیا امتحان شیڈول کریں / Create Exam Schedule'}
            </h3>
            
            <form onSubmit={handleSaveExamSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">امتحان کا نام / Exam Name *</label>
                  <input 
                    type="text" 
                    value={examScheduleForm.examName}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, examName: e.target.value }))}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    placeholder="مثال: Final Exams 2026"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">کلاس / Class *</label>
                  <select 
                    value={examScheduleForm.class}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 cursor-pointer text-right"
                    required
                  >
                    {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">مضمون / Subject *</label>
                  <input 
                    type="text" 
                    value={examScheduleForm.subject}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    placeholder="مثال: Mathematics"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">تاریخ امتحانات / Exam Date *</label>
                  <input 
                    type="date" 
                    value={examScheduleForm.date}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">شروع وقت / Start Time *</label>
                  <input 
                    type="time" 
                    value={examScheduleForm.startTime}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">ختم وقت / End Time *</label>
                  <input 
                    type="time" 
                    value={examScheduleForm.endTime}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">کُل نمبرات / Total Marks *</label>
                  <input 
                    type="number" 
                    value={examScheduleForm.totalMarks}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">کمرہ نمبر / Room No</label>
                  <input 
                    type="text" 
                    value={examScheduleForm.roomNo}
                    onChange={(e) => setExamScheduleForm(prev => ({ ...prev, roomNo: e.target.value }))}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    placeholder="مثال: Room A"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setExamScheduleModal({ open: false })}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  منسوخ کریں / Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-[#0f1b3d] hover:bg-opacity-90 text-[#00c896] font-bold text-xs rounded-xl"
                >
                  محفوظ کریں / Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK EXAM SCHEDULE MODAL OVERLAY */}
      {bulkExamScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 border shadow-2xl relative text-right">
            <button onClick={() => setBulkExamScheduleModal(false)} className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-base mb-2 text-center flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span>ایک ساتھ تمام کلاسز کا امتحان شیڈول کریں / Create Bulk Exam Schedule</span>
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">ایک ہی بار میں آپ اپنی منتخب کردہ تمام کلاسوں کے لیے امتحانی نظام الاوقات تیار کر سکتے ہیں</p>
            
            <form onSubmit={handleSaveBulkExamSchedule} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">امتحان کا نام / Exam name (e.g. Final Exams) *</label>
                  <input 
                    type="text" 
                    value={bulkExamForm.examName}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, examName: e.target.value }))}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right font-sans"
                    placeholder="مثال: Final Exams 2026"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">شروع کرنے کی تاریخ / Start Date *</label>
                  <input 
                    type="date" 
                    value={bulkExamForm.startDate}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 text-right block">مضامین / پرچوں کی فہرست (کوما سے الگ کریں) / Subjects List (Comma separated) *</label>
                  <textarea 
                    value={bulkExamForm.subjects}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, subjects: e.target.value }))}
                    rows={3}
                    className="w-full text-xs font-bold p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right leading-relaxed font-sans"
                    placeholder="مثال: English, Urdu, Mathematics, Science, Islamiat, Computer"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block text-right">ہر مضمون الگ دن پر شیڈول ہوگا، اتوار کا دن خود بخود چھوڑ دیا جائے گا</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">شروع وقت / Start Time *</label>
                  <input 
                    type="time" 
                    value={bulkExamForm.startTime}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">ختم وقت / End Time *</label>
                  <input 
                    type="time" 
                    value={bulkExamForm.endTime}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 text-right block">کُل نمبرات / Total Marks *</label>
                  <input 
                    type="number" 
                    value={bulkExamForm.totalMarks}
                    onChange={(e) => setBulkExamForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                    className="w-full text-xs font-bold font-sans p-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:border-indigo-400 text-right"
                    required
                  />
                </div>
              </div>

              {/* Class selector checklist */}
              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-bold text-indigo-950 text-right block">کلاسز منتخب کریں / Target Classes *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-right">
                  {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => {
                    const isChecked = bulkExamForm.classes.includes(cls);
                    return (
                      <label key={cls} className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkExamForm(prev => ({ ...prev, classes: [...prev.classes, cls] }));
                            } else {
                              setBulkExamForm(prev => ({ ...prev, classes: prev.classes.filter(c => c !== cls) }));
                            }
                          }}
                          className="h-3 w-3 accent-indigo-600 rounded-md"
                        />
                        <span>{cls}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t">
                <button 
                  type="button" 
                  onClick={() => setBulkExamScheduleModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  منسوخ کریں / Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>سب کلاسز کا شیڈول جنریٹ کریں / Generate All Schedules</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
