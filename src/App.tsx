import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { translations } from './translations';
import { Language, SchoolProfile } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { 
  GraduationCap, X, AlertTriangle, HelpCircle, 
  Mail, Lock, User as UserIcon, MapPin, Users, Phone 
} from 'lucide-react';

export default function App() {
  // Persistence Language Toggle state
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'ur';
  });

  const t = (key: keyof typeof translations['en'] | any) => {
    return translations[currentLang][key as keyof typeof translations['en']] || key;
  };

  const isRTL = currentLang === 'ur';

  // Toggle Action
  const handleToggleLang = () => {
    const nextLang = currentLang === 'en' ? 'ur' : 'en';
    setCurrentLang(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  // Sync document direction
  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRTL]);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Modal controllers
  const [authModal, setAuthModal] = useState<{ open: boolean; view: 'login' | 'register' }>({
    open: false,
    view: 'login'
  });

  // Modal input buffers
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regStudentCount, setRegStudentCount] = useState('100-250');

  // Client errors
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Monitor Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          // Fetch associated school Firestore profile
          const profDoc = await getDoc(doc(db, 'schools', firebaseUser.uid));
          if (profDoc.exists()) {
            setSchoolProfile(profDoc.data() as SchoolProfile);
          } else {
            // Self healing - Auto generate fallback profile if DB reference missing
            const fallbackProfile: SchoolProfile = {
              schoolId: firebaseUser.uid,
              name: regSchoolName || firebaseUser.email?.split('@')[0] || 'My Academy',
              ownerName: regOwnerName || 'Owner Coordinator',
              city: regCity || 'Multan',
              studentsCount: regStudentCount || '100-250',
              phone: '+92 300 0000000',
              address: 'School main campus building campus',
              classFees: {
                'Class 1': 2000, 'Class 2': 2000, 'Class 3': 2200, 'Class 4': 2200, 'Class 5': 2500,
                'Class 6': 2500, 'Class 7': 2800, 'Class 8': 2800, 'Class 9': 3500, 'Class 10': 3500
              },
              trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'schools', firebaseUser.uid), fallbackProfile);
            setSchoolProfile(fallbackProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `schools/${firebaseUser.uid}`);
        }
      } else {
        setCurrentUser(null);
        setSchoolProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [regSchoolName, regOwnerName, regCity, regStudentCount]);

  // LOGIN HANLDER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!loginEmail || !loginPassword) {
      setFormError('تمام خانے پُر کرنا لازمی ہے / E-mail and password are required.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setFormSuccess('لاگ ان کامیاب رہا۔ بوجھ کیا جا رہا ہے... / Login successful!');
      setTimeout(() => {
        setAuthModal({ open: false, view: 'login' });
        // Clear forms
        setLoginEmail('');
        setLoginPassword('');
      }, 1000);
    } catch (error: any) {
      console.error(error);
      if (loginEmail === 'tayyab@adminedutrack.com' && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')) {
        // Self healing - Auto register super admin if missing or wrong password on local dev instance
        try {
          await createUserWithEmailAndPassword(auth, 'tayyab@adminedutrack.com', 'tayyabedutrack');
          setFormSuccess('سپر ایڈمن اکاؤنٹ کامیابی سے مربوط ہو گیا۔ / Admin account linked successfully!');
          setTimeout(() => {
            setAuthModal({ open: false, view: 'login' });
            setLoginEmail('');
            setLoginPassword('');
          }, 1000);
          return;
        } catch (regErr) {
          console.error("Super Admin registration fallback failed:", regErr);
        }
      }
      setFormError(error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' 
        ? t('invalidCredentials') 
        : error.message);
    }
  };

  // REGISTER AND 1 MONTH TRIAL CREATOR HANDLER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!regSchoolName || !regOwnerName || !regEmail || !regPassword || !regCity) {
      setFormError('برائے مہربانی تمام نشان زدہ فیلڈز پُر کریں / Please fill up all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setFormError('پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے / Password must be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const uid = userCredential.user.uid;

      // Calculate 30-day free trial end date
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const trialEndDate = new Date(Date.now() + thirtyDaysInMs).toISOString();

      // Setup initial data structure with default key dictionary structure
      const initialProfile: SchoolProfile = {
        schoolId: uid,
        name: regSchoolName,
        ownerName: regOwnerName,
        city: regCity,
        studentsCount: regStudentCount,
        phone: '+92 300 0000000',
        address: 'School street, City Hub, Pakistan',
        classFees: {
          'Class 1': 2000, 'Class 2': 2000, 'Class 3': 2200, 'Class 4': 2200, 'Class 5': 2500,
          'Class 6': 2500, 'Class 7': 2800, 'Class 8': 2800, 'Class 9': 3500, 'Class 10': 3500
        },
        trialEndDate,
        createdAt: new Date().toISOString()
      };

      // Write to Firestore db
      await setDoc(doc(db, 'schools', uid), initialProfile);

      setFormSuccess('رجسٹریشن کامیاب رہی! ٹرائل شروع ہو چکا ہے۔ / Registration successful! Trial started.');
      setTimeout(() => {
        setAuthModal({ open: false, view: 'login' });
        // Clean fields
        setRegSchoolName('');
        setRegOwnerName('');
        setRegEmail('');
        setRegPassword('');
        setRegCity('');
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setFormError(error.code === 'auth/email-already-in-use' ? t('emailExists') : error.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check Trial status
  const isTrialExpired = schoolProfile 
    ? new Date(schoolProfile.trialEndDate).getTime() < Date.now() 
    : false;

  return (
    <div className={`min-h-screen bg-[#f4f7ff] text-slate-800 font-sans selection:bg-[#00c896]/30 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`} id="app-root">
      
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 font-sans" id="app-loading">
          <div className="text-center space-y-4">
            <div className="bg-[#0f1b3d] text-[#00c896] p-4 rounded-3xl shadow-xl animate-bounce">
              <GraduationCap className="h-10 w-10 mx-auto" />
            </div>
            <span>{t('loading')}</span>
          </div>
        </div>
      ) : currentUser ? (
        currentUser.email === 'tayyab@adminedutrack.com' ? (
          <AdminDashboard 
            currentLang={currentLang}
            onToggleLang={handleToggleLang}
            onLogout={handleLogout}
          />
        ) : isTrialExpired ? (
          <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900/90 text-white font-sans text-center" id="trial-expired-panel">
            <div className="bg-white text-slate-900 max-w-md p-8 md:p-10 rounded-3xl space-y-6 shadow-2xl relative border-t-8 border-red-500 text-center">
              <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto animate-pulse" />
              <h2 className="text-2xl font-black text-rose-600">آپ کا آزمائشی پیکیج ختم ہو چکا ہے</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Dear school administrator, your 30-day Free Trial period of EduTrack SaaS has ended. 
                Kindly upgrade to a premium plan to restore access to students records, marks, fees and AI strategic reviews.
              </p>
              
              <div className="p-4 bg-slate-50 border rounded-2xl text-xs space-y-1.5 font-bold text-slate-700 text-right">
                <p>اسکول کا شناختی ID / School ID: {currentUser.uid.slice(0, 8)}</p>
                <p>رابطہ نمبر: +92 300 4504088</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <a 
                  href="https://wa.me/923004504088" 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-600 transition flex items-center justify-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  <span>پریمیم چالو کروائیں (WhatsApp)</span>
                </a>

                <button 
                  onClick={handleLogout}
                  className="px-6 py-3 bg-[#0f1b3d] text-white font-bold rounded-xl text-sm hover:scale-[1.02] transition"
                >
                  لاگ آؤٹ کریں / Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Dashboard 
            schoolId={currentUser.uid}
            currentLang={currentLang}
            onToggleLang={handleToggleLang}
            onLogout={handleLogout}
            schoolProfile={schoolProfile}
          />
        )
      ) : (
        // RENDER GUEST MARKETING LANDING PAGE
        <LandingPage 
          currentLang={currentLang}
          onToggleLang={handleToggleLang}
          onOpenAuth={(view) => setAuthModal({ open: true, view })}
        />
      )}

      {/* PORTAL-STYLE MODAL SIGN IN & REGISTER OVERLAY */}
      <AnimatePresence>
        {authModal.open && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" id="auth-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 md:p-10 border shadow-2xl relative text-right"
            >
              {/* Close Button top-left */}
              <button 
                onClick={() => setAuthModal({ open: false, view: 'login' })}
                className="absolute top-4 left-4 p-1 rounded-full text-slate-400 hover:bg-slate-150 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="bg-[#0f1b3d] p-2 text-[#00c896] rounded-xl">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="font-bold font-sans text-xl text-[#0f1b3d]">{t('appName')}</span>
              </div>

              {/* Toast messages inside Auth modal */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-emerald-800 text-xs font-bold rounded-xl border border-green-100">
                  {formSuccess}
                </div>
              )}

              {/* TAB SELECTION SIGNIN / REGISTER */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
                <button 
                  onClick={() => {
                    setAuthModal({ open: true, view: 'login' });
                    setFormError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${authModal.view === 'login' ? 'bg-white text-[#0f1b3d] shadow-sm' : 'text-slate-500'}`}
                >
                  {t('signIn')}
                </button>
                <button 
                  onClick={() => {
                    setAuthModal({ open: true, view: 'register' });
                    setFormError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition ${authModal.view === 'register' ? 'bg-white text-[#0f1b3d] shadow-sm' : 'text-slate-500'}`}
                >
                  {t('register')}
                </button>
              </div>

              {/* LOGIN VIEW */}
              {authModal.view === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1 justify-end">ای میل ایڈرس / Email * <Mail className="h-3 w-3 text-slate-400" /></label>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. principal@school.com"
                      className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-sans text-sm tracking-wide text-left"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1 justify-end">سیکورٹی پاس ورڈ / Password * <Lock className="h-3 w-3 text-slate-400" /></label>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 bg-slate-50 border rounded-xl outline-none font-sans text-sm tracking-wide text-left"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#0f1b3d] text-white font-bold rounded-xl text-sm hover:bg-[#00c896] hover:text-[#0f1b3d] hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer shadow-sm text-center"
                  >
                    میں داخل ہوں / Enter Portal
                  </button>
                </form>
              )}

              {/* REGISTER VIEW */}
              {authModal.view === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans text-right">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 flex justify-end">اسکول کا نام (School) *</label>
                      <input 
                        type="text" 
                        value={regSchoolName}
                        onChange={(e) => setRegSchoolName(e.target.value)}
                        placeholder="e.g. Army Public Campus"
                        className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 flex justify-end">مالک کا نام (Owner) *</label>
                      <input 
                        type="text" 
                        value={regOwnerName}
                        onChange={(e) => setRegOwnerName(e.target.value)}
                        placeholder="e.g. Salim Hassan"
                        className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 flex justify-end">اسکول کا شہر / City *</label>
                      <input 
                        type="text" 
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g. Rawalpindi"
                        className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 flex justify-end">متوقع طلبہ تعداد *</label>
                      <select 
                        value={regStudentCount}
                        onChange={(e) => setRegStudentCount(e.target.value)}
                        className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs font-bold"
                      >
                        <option value="100-250">100 to 250 {t('students')}</option>
                        <option value="250-500">250 to 500 {t('students')}</option>
                        <option value="500+">500+ {t('students')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 flex justify-end">ای میل ایڈرس / Email *</label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. info@yourschool.com"
                      className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs tracking-wide text-left"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 flex justify-end">سیکورٹی پاس ورڈ (min 6 chars) *</label>
                    <input 
                      type="password" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 bg-slate-50 border rounded-xl outline-none text-xs tracking-wide text-left"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#00c896] hover:bg-[#00b284] text-white font-bold rounded-xl text-sm hover:scale-[1.01] active:scale-[0.99] transition shadow-md text-center cursor-pointer"
                  >
                    نیا اسکول رجسٹر کریں (Free Month)
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
