import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, onSnapshot, query, orderBy
} from 'firebase/firestore';
import { Language, SchoolProfile, Complaint } from '../types';
import tayyabPortrait from '../assets/images/tayyab_real_final_beauty.png';
import tayyabAlternative1 from '../assets/images/muhammad_tayyab_1779779674101_1779781067546.png';
import tayyabAlternative2 from '../assets/images/muhammad_tayyab_1779779674101.png';
import { 
  GraduationCap, LogOut, Users, MessageSquare, CheckCircle, Clock, 
  Search, ShieldAlert, Award, Globe, ToggleLeft, ToggleRight, Loader2, Sparkles, AlertTriangle, X
} from 'lucide-react';

interface AdminDashboardProps {
  currentLang: Language;
  onToggleLang: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({ currentLang, onToggleLang, onLogout }: AdminDashboardProps) {
  const [schools, setSchools] = useState<SchoolProfile[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'schools' | 'applications' | 'complaints'>('schools');
  
  const basePrefix = import.meta.env.BASE_URL || './';
  const cleanBase = basePrefix.endsWith('/') ? basePrefix : basePrefix + '/';

  const imageSources = [
    tayyabPortrait,
    tayyabAlternative1,
    tayyabAlternative2,
    `${cleanBase}tayyab_real_final_beauty.png`,
    'tayyab_real_final_beauty.png',
  ];

  const [imgSrc, setImgSrc] = useState<string>(imageSources[0]);
  const [attemptIndex, setAttemptIndex] = useState<number>(0);

  const handleImgError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < imageSources.length) {
      setImgSrc(imageSources[nextIndex]);
      setAttemptIndex(nextIndex);
    }
  };
  
  // Complaint Reply Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [complaintStatus, setComplaintStatus] = useState<'Pending' | 'In Progress' | 'Resolved'>('In Progress');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // Load registered schools and complaints from Firestore
  useEffect(() => {
    setLoading(true);
    
    // Realtime listener for schools
    const schoolsPath = 'schools';
    const unsubSchools = onSnapshot(collection(db, schoolsPath), (snapshot) => {
      const list: SchoolProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as SchoolProfile;
        list.push({
          ...data,
          schoolId: doc.id
        });
      });
      setSchools(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, schoolsPath);
    });

    // Realtime listener for complaints
    const complaintsPath = 'complaints';
    const unsubComplaints = onSnapshot(
      query(collection(db, complaintsPath), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            ...doc.data()
          } as Complaint);
        });
        setComplaints(list);
        setLoading(false);
      }, 
      (error) => {
        // Fallback if complaints collection is not yet deployed or permissions block it
        console.warn("Retrying claims or setting fallback empty logs", error);
        setLoading(false);
      }
    );

    return () => {
      unsubSchools();
      unsubComplaints();
    };
  }, []);

  // Update School Plan (Premium License vs Free Trial duration toggle)
  const handleTogglePlan = async (schoolId: string, currentPlan: 'free' | 'premium' | string | undefined) => {
    const nextPlan = currentPlan === 'premium' ? 'free' : 'premium';
    const profileRef = doc(db, 'schools', schoolId);
    
    try {
      await updateDoc(profileRef, {
        plan: nextPlan,
        // If updating to premium, extend trial/licence by 10 years, else reset to standard
        trialEndDate: nextPlan === 'premium' 
          ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (e) {
      console.error("Error setting pricing license:", e);
    }
  };

  // Submit Complaint Reply by Muhammad Tayyab
  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdatingTicket(true);

    try {
      const complaintRef = doc(db, 'complaints', selectedComplaint.id);
      await updateDoc(complaintRef, {
        status: complaintStatus,
        reply: adminReply,
        repliedAt: new Date().toISOString()
      });
      setSelectedComplaint(null);
      setAdminReply('');
    } catch (err) {
      console.error("Failed to post solution support update:", err);
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Localized English / Urdu strings
  const t = {
    en: {
      panelTitle: "EduTrack Super Admin Panel",
      welcomeAdmin: "Welcome, Muhammad Tayyab",
      role: "Platform Creator & Lead Systems Engineer",
      dashboardStats: "Platform Real-time Health Metrics",
      schoolsTab: "Registered Schools",
      appTab: "Trial License Applications",
      ticketsTab: "Support Tickets & Complaints",
      totalSchools: "Active SaaS Users",
      trialCount: "Trial Registrants",
      complaintsCount: "Pending Support Requests",
      searchHint: "Filter schools by name, city or email address...",
      schoolName: "School Identity",
      owner: "Owner & Representative Address",
      city: "City Node",
      contact: "Hotline Contact Details",
      license: "License plan",
      expiry: "Licence Expiry Point",
      premiumBtn: "Promote Premium Status",
      freeBtn: "Demote to Demo Account",
      noResults: "No registered schools matching filters set.",
      subject: "Subject Matter",
      status: "Ticket State",
      created: "Inception Timestamp",
      response: "Admin Solution Log",
      resolveBtn: "Engage Support",
      replyModalTitle: "Formulate Solution Ticket response",
      replyLbl: "Write response solution explicitly",
      statusLbl: "Define Resolution Status",
      saveBtn: "Commit Support Frame",
      registeredAt: "Signup Date",
      appDesc: "These are initial onboarding registrations requesting verification setup:"
    },
    ur: {
      panelTitle: "ایڈیوٹریک سُپر ایڈمن کنٹرول پینل",
      welcomeAdmin: "خوش آمدید، محمد طیب",
      role: "پلیٹ فارم کے بانی اور لیڈ سسٹمز انجینئر",
      dashboardStats: "پلیٹ فارم کی مجموعی کارکردگی اور ڈیٹا لنکس",
      schoolsTab: "رجسٹرڈ اسکولز کی معلومات",
      appTab: "ٹرائل لائسنس درخواستات",
      ticketsTab: "شکایات اور تکنیکی معاونت",
      totalSchools: "رجسٹرڈ ملٹی سکول سسٹم",
      trialCount: "زیر التواء ایپلی کیشنز",
      complaintsCount: "غیر حل شدہ شکایات",
      searchHint: "نام، شہر یا ای میل ایڈریس سے اسکول تلاش کریں...",
      schoolName: "اسکول کی معلومات",
      owner: "پرنسپل / نمائندہ فون اور پتہ",
      city: "مقام / شہر",
      contact: "رابطہ ای میل اور واٹس ایپ",
      license: "لائسنس پلان",
      expiry: "بقا کی لمیٹیڈ تاریخ",
      premiumBtn: "پریمیم لائسنس جاری کریں",
      freeBtn: "مفت ٹرائل پر فوراً منتقل کریں",
      noResults: "مطلوبہ تلاش کا کوئی اسکول نہیں ملا۔",
      subject: "شکایت کا موضوع",
      status: "ٹکٹ کی موجودہ حالت",
      created: "شروع ہونے کا وقت",
      response: "ایڈمن کا جواب / حل",
      resolveBtn: "جواب فراہم کریں",
      replyModalTitle: "اصلاح و مدد کا مشاورتی جواب لکھیں",
      replyLbl: "اپنا تفصیلی تحریری جواب دیں",
      statusLbl: "فالو اپ اور اسٹیٹس تبدیل کریں",
      saveBtn: "جواب رجسٹر کریں",
      registeredAt: "رجسٹرڈ ہونے کی تاریخ",
      appDesc: "کلاؤڈ سسٹمز پر نئے رجسٹرڈ اسکول جن کا لائیو ڈیٹا مانیٹر کیا جا رہا ہے:"
    }
  };

  const isRTL = currentLang === 'ur';
  const str = t[currentLang];

  // Filters
  const filteredSchools = schools.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const trialApplications = schools.filter(s => s.plan === 'free' || !s.plan);
  const pendingComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans ${isRTL ? 'text-right' : 'text-left'}`} id="admin-panel-viewport">
      
      {/* NAVBAR */}
      <nav className="bg-[#0f1b3d] text-white py-4 px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-[#00c896] text-[#0f1b3d] p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>{str.panelTitle}</span>
                <span className="bg-[#00c896]/20 text-[#00c896] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#00c896]/30 uppercase font-bold">Host Root</span>
              </h1>
              <p className="text-slate-400 text-xs font-semibold">{str.welcomeAdmin} (tayyab@adminedutrack.com)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang switcher */}
            <button 
              onClick={onToggleLang}
              className="py-2 px-3 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 cursor-pointer text-slate-200"
            >
              <Globe className="h-4 w-4 text-[#00c896]" />
              <span>{currentLang === 'ur' ? 'English' : 'اردو'}</span>
            </button>

            {/* Logout button */}
            <button 
              onClick={onLogout}
              className="py-2 px-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow space-y-8">
        
        {/* Creator Bio Header banner card */}
        <div className="bg-gradient-to-r from-[#0f1b3d] to-[#1a2d5e] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/5 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#00c896]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10 flex-col sm:flex-row text-center sm:text-right">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-[#00c896] rounded-2xl blur opacity-30" />
              <img 
                src={imgSrc} 
                alt="Muhammad Tayyab Headshot" 
                className="relative w-20 h-24 object-cover rounded-xl border-2 border-white/90 shadow-lg"
                referrerPolicy="no-referrer"
                onError={handleImgError}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-[#00c896]/10 text-[#00c896] px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>EduTrack Developer & Architect</span>
              </div>
              <h2 className="text-2xl font-black text-white">{str.welcomeAdmin}</h2>
              <p className="text-slate-300 text-xs font-semibold mt-0.5">{str.role}</p>
              
              <p className="text-slate-400 text-xs max-w-xl mt-3 leading-relaxed font-sans">
                Active systems controller for Pakistani school digitization. 
                Manage pricing tiers, registered user entities, trial starts, and resolve support requests dynamically.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5 border-dashed relative z-10 text-center sm:text-right">
            <div>
              <p className="text-[10px] text-[#00c896] font-bold uppercase tracking-wider">Previous Masterpiece</p>
              <h4 className="text-sm font-bold text-white mt-1">MediCare Plus hospital app</h4>
              <a 
                href="https://seomtayyab-cell.github.io/medicare-project/" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="text-slate-300 hover:text-[#00c896] text-xs font-mono font-bold flex items-center gap-1.5 mt-2 justify-center sm:justify-start"
              >
                <span>seomtayyab-cell.github.io</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 rounded-md">Live Link</span>
              </a>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <section className="space-y-3" id="admin-stats-overview">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span>{str.dashboardStats}</span>
            <span className="h-1.5 w-1.5 bg-[#00c896] rounded-full animate-ping" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stat 1 */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-[#00c896] group-hover:bg-[#00b284] transition" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{str.totalSchools}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-[#0f1b3d] font-mono">{schools.length}</span>
                <Users className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500 group-hover:bg-indigo-600 transition" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{str.appTab}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-[#0f1b3d] font-mono">{trialApplications.length}</span>
                <Clock className="h-5 w-5 text-slate-300" />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 group-hover:bg-rose-600 transition" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{str.complaintsCount}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-black text-[#0f1b3d] font-mono">{pendingComplaintsCount}</span>
                <MessageSquare className="h-5 w-5 text-slate-300 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* TAB NAVIGATION CONTROL */}
        <div className="border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center space-x-1 space-x-reverse">
            <button 
              onClick={() => setActiveTab('schools')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${activeTab === 'schools' ? 'border-[#00c896] text-[#0f1b3d] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
            >
              {str.schoolsTab}
            </button>
            <button 
              onClick={() => setActiveTab('applications')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${activeTab === 'applications' ? 'border-[#00c896] text-[#0f1b3d] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
            >
              {str.appTab} ({trialApplications.length})
            </button>
            <button 
              onClick={() => setActiveTab('complaints')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'complaints' ? 'border-[#00c896] text-[#0f1b3d] font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
            >
              <span>{str.ticketsTab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-mono ${pendingComplaintsCount > 0 ? 'bg-rose-500' : 'bg-slate-400'}`}>{pendingComplaintsCount}</span>
            </button>
          </div>

          <div className="mb-2 max-w-sm w-full relative">
            <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder={str.searchHint}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs p-2.5 pr-10 border rounded-xl outline-none bg-white font-sans"
            />
          </div>
        </div>

        {/* LOADING STATE DISPLAY */}
        {loading ? (
          <div className="p-20 text-center space-y-4" id="admin-dashboard-loading">
            <Loader2 className="h-10 w-10 text-[#00c896] animate-spin mx-auto" />
            <p className="text-slate-500 text-xs font-bold font-sans">Connecting to live Edutrack cloud database nodes...</p>
          </div>
        ) : (
          <section id="module-admin-main-panel">
            
            {/* TAB CONTAINER 1: REGISTERED SCHOOLS */}
            {activeTab === 'schools' && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" id="tab-registered-schools">
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-[#f4f7ff] text-[#0f1b3d] uppercase font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">{str.schoolName}</th>
                        <th className="p-4">{str.owner}</th>
                        <th className="p-4">{str.city}</th>
                        <th className="p-4">{str.contact}</th>
                        <th className="p-4">{str.license}</th>
                        <th className="p-4">{str.expiry}</th>
                        <th className="p-4 text-center">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600 font-sans">
                      {filteredSchools.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 font-bold leading-relaxed">
                            {str.noResults}
                          </td>
                        </tr>
                      ) : (
                        filteredSchools.map((s, index) => {
                          const isPremium = s.plan === 'premium';
                          // Parse dates beautifully
                          const expiryDate = s.trialEndDate ? new Date(s.trialEndDate).toLocaleDateString() : 'N/A';
                          return (
                            <tr key={s.schoolId || index} className="hover:bg-slate-50/50 transition">
                              <td className="p-4">
                                <span className="font-extrabold text-[#0f1b3d] block text-sm">{s.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">UID: {s.schoolId?.slice(0, 8)}...</span>
                              </td>
                              <td className="p-4 font-normal">
                                <span className="font-semibold text-slate-705 block">{s.ownerName || 'Representative'}</span>
                                <span className="text-[10px] text-slate-400">{s.address || 'Address unprovided'}</span>
                              </td>
                              <td className="p-4">
                                <span className="bg-slate-100 text-[#0f1b3d] px-2.5 py-1 rounded-md text-[10px] font-bold border">{s.city || 'Pakistan'}</span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="block text-slate-700 font-mono font-semibold">{s.phone}</span>
                                <span className="text-[10px] text-indigo-600 font-mono font-medium block">{s.email || 'no-email@edutrack.com'}</span>
                              </td>
                              <td className="p-4">
                                {isPremium ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                                    <Award className="h-3 w-3" />
                                    <span>Premium SaaS Access</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                                    <Clock className="h-3 w-3" />
                                    <span>Demolink / Free Trial</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-4 font-mono font-semibold">
                                {expiryDate}
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleTogglePlan(s.schoolId || '', s.plan)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition cursor-pointer flex items-center gap-1.5 ${isPremium ? 'bg-amber-100 hover:bg-amber-150 text-amber-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/10'}`}
                                  >
                                    {isPremium ? (
                                      <>
                                        <ToggleLeft className="h-3.5 w-3.5" />
                                        <span>{str.freeBtn}</span>
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="h-3.5 w-3.5" />
                                        <span>{str.premiumBtn}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTAINER 2: TRIAL APPLICATIONS */}
            {activeTab === 'applications' && (
              <div className="space-y-4" id="tab-onboarding-applications">
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-3 text-indigo-900">
                  <ShieldAlert className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">{str.appTab} Overview</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed font-sans mt-0.5">{str.appDesc}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-[#f4f7ff] text-[#0f1b3d] uppercase font-black border-b">
                        <tr>
                          <th className="p-4">{str.schoolName}</th>
                          <th className="p-4">{str.city}</th>
                          <th className="p-4">{str.contact}</th>
                          <th className="p-4">{str.registeredAt}</th>
                          <th className="p-4 text-center">Status Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600 font-sans">
                        {trialApplications.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                              No active trial-phase applications currently logged.
                            </td>
                          </tr>
                        ) : (
                          trialApplications.map((s, idx) => (
                            <tr key={s.schoolId || idx} className="hover:bg-slate-50/50 transition">
                              <td className="p-4 font-bold text-[#0f1b3d] text-sm">
                                {s.name}
                                <span className="block text-[10px] text-slate-300 font-semibold">{s.ownerName || 'Free User Account'}</span>
                              </td>
                              <td className="p-4 font-bold">{s.city || 'Pakistan'}</td>
                              <td className="p-4">
                                <span className="block font-mono font-semibold">{s.phone}</span>
                                <span className="block font-mono text-[10px] text-slate-400">{s.email}</span>
                              </td>
                              <td className="p-4 font-mono font-semibold">
                                {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center">
                                  <button 
                                    onClick={() => handleTogglePlan(s.schoolId || '', 'free')}
                                    className="px-3.5 py-1.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-[10px] rounded-xl shadow-sm cursor-pointer hover:scale-102 transition"
                                  >
                                    Verify & Issue Premium License
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
            )}

            {/* TAB CONTAINER 3: COMPLAINTS / TICKETS */}
            {activeTab === 'complaints' && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" id="tab-support-tickets">
                <div className="bg-slate-50 border-b p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-rose-500" />
                    <h3 className="font-extrabold text-[#0f1b3d] text-sm">{str.ticketsTab}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#0f1b3d] bg-[#00c896]/10 text-[#00c896] px-2.5 py-1 border border-[#00c896]/20 rounded-full font-mono">
                    System Control Loop
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-[#f4f7ff] text-[#0f1b3d] font-black border-b border-slate-200">
                      <tr>
                        <th className="p-4">Issuer Institution</th>
                        <th className="p-4">{str.subject}</th>
                        <th className="p-4">Ticket Description</th>
                        <th className="p-4">{str.status}</th>
                        <th className="p-4">{str.created}</th>
                        <th className="p-4">{str.response}</th>
                        <th className="p-4 text-center">Action Desk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-600 font-sans">
                      {complaints.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-16 text-center text-slate-400 font-bold">
                            All support pipelines are fully clear! No tickets currently registered.
                          </td>
                        </tr>
                      ) : (
                        complaints.map((c) => {
                          const isPending = c.status === 'Pending';
                          const isResolved = c.status === 'Resolved';
                          
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4">
                                <span className="font-extrabold text-[#0f1b3d] text-sm block">{c.schoolName}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">Mail: {c.email}</span>
                              </td>
                              <td className="p-4 text-sm font-semibold text-slate-700">
                                {c.subject}
                              </td>
                              <td className="p-4 font-normal text-slate-500 max-w-xs truncate" title={c.description}>
                                {c.description}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isResolved 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                    : isPending 
                                      ? 'bg-rose-50 text-rose-700 border border-rose-150 animate-pulse'
                                      : 'bg-amber-50 text-amber-700 border border-amber-150'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isResolved ? 'bg-emerald-500' : isPending ? 'bg-rose-500' : 'bg-amber-500'
                                  }`} />
                                  <span>{c.status}</span>
                                </span>
                              </td>
                              <td className="p-4 font-mono font-semibold text-slate-500 leading-snug">
                                {c.createdAt ? new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                              </td>
                              <td className="p-4">
                                {c.reply ? (
                                  <div className="bg-[#f4f7ff] border border-slate-200/60 p-2 rounded-xl text-left font-sans text-[11px] max-w-xs">
                                    <span className="text-[#00c896] font-bold block mb-0.5">Tayyab Solution:</span>
                                    <p className="text-slate-500 italic font-medium">{c.reply}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Solution pending...</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center">
                                  <button 
                                    onClick={() => {
                                      setSelectedComplaint(c);
                                      setAdminReply(c.reply || '');
                                      setComplaintStatus(c.status);
                                    }}
                                    className="px-3.5 py-1.5 bg-[#0f1b3d] hover:bg-[#00c896] text-white hover:text-[#0f1b3d] font-bold text-[10px] rounded-xl shadow transition duration-200 cursor-pointer"
                                  >
                                    {str.resolveBtn}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </section>
        )}

      </main>

      {/* COMPLAINTS DIALOG POPUP / MODAL REPLY */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" id="support-solution-modal">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 border shadow-2xl relative text-right">
            
            <button 
              onClick={() => setSelectedComplaint(null)} 
              className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-[#0f1b3d] text-lg mb-4 text-center">{str.replyModalTitle}</h3>
            
            <div className="bg-slate-50 border p-4 rounded-2xl text-xs space-y-2 mb-6">
              <div className="flex justify-between border-b pb-1">
                <span className="font-extrabold text-slate-500">Issuer School:</span>
                <span className="font-semibold text-[#0f1b3d]">{selectedComplaint.schoolName}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-extrabold text-slate-500">Subject:</span>
                <span className="font-semibold text-[#0f1b3d]">{selectedComplaint.subject}</span>
              </div>
              <div className="space-y-1 block text-right">
                <span className="font-extrabold text-slate-500 block">Description:</span>
                <p className="text-slate-600 bg-white border p-3 rounded-xl italic font-normal">{selectedComplaint.description}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateComplaint} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-500 block">{str.replyLbl}</label>
                <textarea 
                  rows={4}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Insert solution suggestions or updates..."
                  className="w-full text-sm p-3.5 bg-slate-50 border rounded-xl outline-none font-sans focus:ring-1 focus:ring-[#00c896]"
                  required
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-500 block">{str.statusLbl}</label>
                <select 
                  value={complaintStatus}
                  onChange={(e) => setComplaintStatus(e.target.value as any)}
                  className="w-full text-sm p-3.5 bg-slate-50 border rounded-xl outline-none font-bold text-slate-700"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="flex justify-end pt-3 gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedComplaint(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingTicket}
                  className="px-5 py-2.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  {updatingTicket && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{str.saveBtn}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
