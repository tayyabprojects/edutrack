import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Check, HelpCircle, Phone, ArrowRight, Menu, X, 
  Globe, DollarSign, Users, Calendar, Award, FileText, Sparkles, 
  Layers, CheckCircle2, ChevronDown, ChevronUp, LucideIcon 
} from 'lucide-react';
import { translations } from '../translations';
import { Language } from '../types';
import AboutUs from './AboutUs';

interface LandingPageProps {
  currentLang: Language;
  onToggleLang: () => void;
  onOpenAuth: (view: 'login' | 'register') => void;
}

export default function LandingPage({ currentLang, onToggleLang, onOpenAuth }: LandingPageProps) {
  const t = (key: keyof typeof translations['en'] | any) => {
    return translations[currentLang][key as keyof typeof translations['en']] || key;
  };

  const isRTL = currentLang === 'ur';

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoActiveTab, setDemoActiveTab] = useState<'fees' | 'attendance' | 'results' | 'students'>('fees');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'landing' | 'about'>('landing');

  // Monitor Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scrolling Cities Ticker Info
  const cities = [
    t('cityLahore'), t('cityKarachi'), t('cityRawalpindi'), t('cityFaisalabad'), 
    t('cityMultan'), t('cityPeshawar'), t('cityQuetta'), t('citySialkot'), 
    t('cityGujranwala'), t('cityHyderabad')
  ];

  const featuredCards = [
    {
      title: t('feeCollection'),
      desc: t('feeCollectionDesc'),
      icon: DollarSign,
    },
    {
      title: t('reducePaperwork'),
      desc: t('reducePaperworkDesc'),
      icon: Layers,
    },
    {
      title: t('instantResults'),
      desc: t('instantResultsDesc'),
      icon: Award,
    },
    {
      title: t('easyBilingual'),
      desc: t('easyBilingualDesc'),
      icon: Globe,
    }
  ];

  const featuresTwelve = [
    { title: t('students'), desc: "رول نمبر، ولدیت، کلاس ریکارڈز، ایڈریس اور سرٹیفکیٹس کا مکمل ریکارڈ" },
    { title: t('feesTab'), desc: "بقایا جات، رسیدیں، ادا شدہ و پینڈنگ فیسوں کے سمارٹ ٹیبلز اور ماہانہ رپورٹس" },
    { title: t('attendanceTab'), desc: "موبائل فون سے یک کلک پر روزانہ کی حاضری لگائیں اور ڈیٹا بیس محفوظ کریں" },
    { title: t('reportCard'), desc: "پرچوں کے حاصل نمبر ڈالیں، فیصد گریڈ فارمولا خودکار لاگو کر کے رپورٹ کارڈ بنائیں" },
    { title: t('reports'), desc: "آرٹیفیشل انٹیلیجنس کے ذریعے اسکول کی مجموعی کارکردگی کا موازنہ اور مشورے" },
    { title: "واٹس ایپ الرٹس", desc: "بچوں کی غیر حاضری اور فیس کی یاد دہانی کے خودکار الرٹس واٹس ایپ نمبر پر" },
    { title: "تنخواہ", desc: "اساتذہ اور ملازمین کی بنیادی تنخواہ، بونس اور کٹوتیوں کی تفصیلی لاگ شیٹ" },
    { title: t('expenses'), desc: "اسکول کے آپریشنل، بلوں، اور یوٹیلیٹی اخراجات کو کیٹیگری کے مطابق مانیٹر کریں" },
    { title: "مفت اسکول ویب سائٹ", desc: "آپ کے اسکول کی ایک خوبصورت اور جدید پورٹل ویب سائٹ جو خودکار تیار ہوگی" },
    { title: "اردو + انگریزی", desc: "پاکستانی ماحول کے مطابق سلیس اور آسان اردو میں مکمل طور پر تبدیل ہونے کی صلاحیت" },
    { title: "موبائل اور ٹیبلٹ مطابقت", desc: "موبائل فون، گولیوں، اور لیپ ٹاپ تکیوں پر انتہائی تیزی سے کام کرنے والا نظام" },
    { title: "واٹس ایپ سپورت", desc: "ڈیٹا اپلوڈ کرنے اور اسکول آن بورڈنگ میں ہماری ٹیم کا واٹس ایپ سپورٹ بالکل مفت" }
  ];

  const faqItems = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    { q: t('faqQ4'), a: t('faqQ4Ans') },
    { q: t('faqQ5'), a: t('faqQ5Ans') },
  ];

  return (
    <div className={`min-h-screen bg-[#f4f7ff] text-slate-800 font-sans selection:bg-[#00c896]/30 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`} id="landing-root">
      
      {/* SECTION 1: STICKY NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              onClick={() => setActiveTab('landing')}
              className="flex items-center space-x-2 space-x-reverse cursor-pointer"
            >
              <div className="bg-[#0f1b3d] text-[#00c896] p-2 rounded-xl shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="font-sans font-bold text-2xl tracking-tight text-[#0f1b3d]">{t('appName')}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              <a 
                href="#features" 
                onClick={() => setActiveTab('landing')}
                className="text-[#0f1b3d]/80 hover:text-[#00c896] font-medium transition-colors"
              >
                {t('features')}
              </a>
              <a 
                href="#demo" 
                onClick={() => setActiveTab('landing')}
                className="text-[#0f1b3d]/80 hover:text-[#00c896] font-medium transition-colors"
              >
                ڈیمو
              </a>
              <a 
                href="#faq" 
                onClick={() => setActiveTab('landing')}
                className="text-[#0f1b3d]/80 hover:text-[#00c896] font-medium transition-colors"
              >
                {t('faq')}
              </a>
              <button 
                onClick={() => {
                  setActiveTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`text-[#0f1b3d]/80 hover:text-[#00c896] font-medium transition-colors cursor-pointer ${activeTab === 'about' ? 'text-[#00c896] font-bold border-b-2 border-[#00c896]' : ''}`}
              >
                {currentLang === 'ur' ? 'ڈویلپر کے بارے میں' : 'About Creator'}
              </button>
            </div>

            {/* Right CTAs */}
            <div className="hidden md:flex items-center space-x-4 space-x-reverse">
              <button 
                onClick={onToggleLang}
                className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
              >
                <Globe className="h-4 w-4 text-[#00c896]" />
                <span className="text-sm font-semibold">{currentLang === 'en' ? 'اردو' : 'EN'}</span>
              </button>

              <span className="px-3 py-1 bg-emerald-50 text-[#00c896] text-xs font-bold rounded-full border border-emerald-200">
                {t('oneMonthFreeBadge')}
              </span>

              <button 
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2 text-sm font-semibold bg-[#0f1b3d] text-white rounded-xl hover:bg-[#0f1b3d]/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                {t('signIn')}
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-[#0f1b3d] focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200"
            >
              <div className="px-4 pt-2 pb-6 space-y-3">
                <a 
                  href="#features" 
                  onClick={() => {
                    setActiveTab('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  {t('features')}
                </a>
                <a 
                  href="#demo" 
                  onClick={() => {
                    setActiveTab('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  EduTrack عمل میں دیکھیں
                </a>
                <a 
                  href="#faq" 
                  onClick={() => {
                    setActiveTab('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  {t('faq')}
                </a>
                <button 
                  onClick={() => {
                    setActiveTab('about');
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-right px-3 py-2 text-base font-semibold hover:bg-slate-50 rounded-lg text-slate-700 transition ${activeTab === 'about' ? 'text-[#00c896] bg-slate-50' : ''}`}
                >
                  {currentLang === 'ur' ? 'ڈویلپر کے بارے میں' : 'About Creator'}
                </button>
                
                <hr className="border-slate-100" />

                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-sm font-semibold text-slate-500">مفت ٹرائل پیکیج :</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {t('oneMonthFreeBadge')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => {
                      onToggleLang();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-slate-200 text-slate-700"
                  >
                    <Globe className="h-4 w-4 text-[#00c896]" />
                    <span className="text-sm font-semibold">{currentLang === 'en' ? 'اردو' : 'English'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 bg-[#0f1b3d] text-white font-semibold text-sm rounded-xl text-center"
                  >
                    {t('signIn')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {activeTab === 'landing' ? (
        <>
          {/* SECTION 2: HERO */}
          <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-b from-[#f4f7ff] to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 bg-[#00c896]/10 text-emerald-800 rounded-full border border-emerald-200/30">
                <Sparkles className="h-4 w-4 text-[#00c896] animate-pulse" />
                <span className="text-xs font-bold">{t('monthFreeOffer')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-sans tracking-tight text-[#0f1b3d] leading-tight">
                {currentLang === 'ur' ? (
                  <>
                    پاکستانی اسکولوں کا پہلا{' '}
                    <span className="text-[#00c896]">AI مینجمنٹ سسٹم</span>
                  </>
                ) : (
                  <>
                    Pakistan’s Premier{' '}
                    <span className="text-[#00c896]">AI Management System</span>
                  </>
                )}
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
                {t('heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#00c896] text-white hover:bg-[#00b284] font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  {t('getStartedFree')}
                </button>
                <a 
                  href="#demo"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#0f1b3d] hover:bg-slate-50 font-bold text-lg rounded-xl border border-slate-300 transition-all text-center"
                >
                  {t('seeDemo')}
                </a>
              </div>

              {/* Trust Badge Lists */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 pt-4 text-slate-500 text-sm">
                <span className="flex items-center space-x-1.5 space-x-reverse">
                  <CheckCircle2 className="h-4 w-4 text-[#00c896]" />
                  <span>{t('noCreditCard')}</span>
                </span>
                <span className="flex items-center space-x-1.5 space-x-reverse">
                  <CheckCircle2 className="h-4 w-4 text-[#00c896]" />
                  <span>{t('threeMinSetup')}</span>
                </span>
                <span className="flex items-center space-x-1.5 space-x-reverse">
                  <CheckCircle2 className="h-4 w-4 text-[#00c896]" />
                  <span>{t('urduAndEnglish')}</span>
                </span>
              </div>
            </div>

            {/* Right Dashboard Mockup Column */}
            <div className="lg:col-span-5 relative">
              {/* Decorative Glow */}
              <div className="absolute -inset-10 bg-gradient-to-tr from-[#00c896]/20 to-blue-500/20 blur-2xl rounded-full" />

              {/* Animated CSS Mockup */}
              <div className="relative border border-slate-200/80 bg-white p-4 rounded-3xl shadow-2xl overflow-hidden self-center hover:-translate-y-1 transition duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  </div>
                  <span className="text-xs text-slate-400">{t('appName')} Interactive Live Dashboard</span>
                </div>

                <div className="pt-4 space-y-4">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 block block-reverse">آج کی حاضری / Attendance</span>
                      <span className="text-lg font-bold text-[#0f1b3d] flex items-center gap-1.5">
                        94.3%
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded-md">Excellent</span>
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 block">وصول شدہ فیس / Collected Fees</span>
                      <span className="text-lg font-bold text-slate-800">PKR 2.4 M</span>
                    </div>
                  </div>

                  {/* Sample Graph block */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f1b3d]">طالب علم حاضری / Daily School Attendance</span>
                      <span className="text-[10px] text-slate-400">7-Day Analysis</span>
                    </div>
                    <div className="h-20 flex items-end justify-between px-2 pt-2 gap-1.5">
                      <div className="w-full bg-slate-300 h-[65%] rounded-t-md hover:bg-[#00c896] transition" />
                      <div className="w-full bg-slate-300 h-[75%] rounded-t-md hover:bg-[#00c896] transition" />
                      <div className="w-full bg-slate-200 h-[50%] rounded-t-md hover:bg-[#00c896] transition" />
                      <div className="w-full bg-[#00c896] h-[92%] rounded-t-md cursor-pointer" />
                      <div className="w-full bg-slate-300 h-[85%] rounded-t-md hover:bg-[#00c896] transition" />
                      <div className="w-full bg-slate-300 h-[80%] rounded-t-md hover:bg-[#00c896] transition" />
                    </div>
                  </div>

                  {/* Student Status Records Mock table */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs px-1 text-slate-400">
                      <span>طالب علم (Student)</span>
                      <span>کلاس (Class)</span>
                      <span>واجبات (Status)</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 rounded-xl bg-[#f4f7ff] border border-slate-100 text-xs">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="w-6 h-6 rounded-full bg-[#0f1b3d] text-white flex items-center justify-center text-[10px] font-bold">AH</span>
                        <span className="text-[#0f1b3d] font-bold">Ahmed Hassan</span>
                      </div>
                      <span className="text-slate-500">Grade 10</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{t('paid')}</span>
                    </div>

                    <div className="flex justify-between items-center p-2 rounded-xl bg-[#f4f7ff] border border-slate-100 text-xs">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">ZS</span>
                        <span className="text-[#0f1b3d] font-bold">Zainab Sajjad</span>
                      </div>
                      <span className="text-slate-500">Grade 8</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{t('overdue')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* City Scrolling Ticker */}
        <div className="w-full bg-[#0f1b3d] py-3.5 mt-20 border-y border-slate-800 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee">
            <div className="flex space-x-12 space-x-reverse text-slate-300 font-medium tracking-wide">
              {cities.map((city, idx) => (
                <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                  <span className="w-2 h-2 bg-[#00c896] rounded-full" />
                  <span>اسکولز ان {city}</span>
                </div>
              ))}
              {/* Duplicate for seamless scrolling */}
              {cities.map((city, idx) => (
                <div key={`dup-${idx}`} className="flex items-center space-x-2 space-x-reverse">
                  <span className="w-2 h-2 bg-[#00c896] rounded-full" />
                  <span>اسکولز ان {city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SOCIAL PROOF STATS BAR */}
      <section className="bg-[#0f1b3d] text-white py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[#00c896]">{t('schoolsRegistered')}</div>
              <div className="text-slate-400 text-sm md:text-base font-medium">سائنڈ اپ اور کارآمد اسکولز</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[#00c896]">{t('studentsServed')}</div>
              <div className="text-slate-400 text-sm md:text-base font-medium">زیر تعلیم طلبہ و طالبات</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[#00c896]">{t('fastSetup')}</div>
              <div className="text-slate-400 text-sm md:text-base font-medium">اسکول سیٹ اپ اور رجسٹریشن</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-sans font-extrabold text-[#00c896]">{t('bilingualSupport')}</div>
              <div className="text-slate-400 text-sm md:text-base font-medium">اردو اور عربی رسم الخط اسپورٹ</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY US — 4 FEATURE CARDS */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b3d]">{t('seeEduTrackInAction')}</h2>
            <p className="text-slate-600 font-sans text-base">پاکستان کے تمام پرائمری، ہائی اسکولز، اور اکیڈمیوں کے انتظامی اخراجات کو 360 ڈگری ڈیجیٹل کرنے کا واحد حل۔</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div 
                  key={idx} 
                  className="p-6 bg-[#f4f7ff] rounded-2xl border border-slate-200/50 hover:border-[#00c896] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="bg-white text-[#00c896] w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-md border border-slate-100 group-hover:bg-[#0f1b3d] group-hover:text-[#00c896] transition-colors duration-300">
                    <IconComp className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0f1b3d] mb-3">{card.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: PRODUCT TABS DEMO */}
      <section id="demo" className="py-24 bg-[#f4f7ff] border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-sm font-bold text-[#00c896] tracking-widest uppercase block mb-1">Interactive Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b3d]">خصوصی پروڈکٹ کی ہینڈ آن ڈیمو</h2>
          </div>

          {/* Interactive tabs bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-white/60 p-2 rounded-2xl border border-slate-200/60 max-w-3xl mx-auto">
            <button 
              onClick={() => setDemoActiveTab('fees')}
              className={`flex-1 min-w-[120px] px-5 py-2.5 font-bold rounded-xl transition ${demoActiveTab === 'fees' ? 'bg-[#0f1b3d] text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('feesTab')}
            </button>
            <button 
              onClick={() => setDemoActiveTab('attendance')}
              className={`flex-1 min-w-[120px] px-5 py-2.5 font-bold rounded-xl transition ${demoActiveTab === 'attendance' ? 'bg-[#0f1b3d] text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('attendanceTab')}
            </button>
            <button 
              onClick={() => setDemoActiveTab('results')}
              className={`flex-1 min-w-[120px] px-5 py-2.5 font-bold rounded-xl transition ${demoActiveTab === 'results' ? 'bg-[#0f1b3d] text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('resultsTab')}
            </button>
            <button 
              onClick={() => setDemoActiveTab('students')}
              className={`flex-1 min-w-[120px] px-5 py-2.5 font-bold rounded-xl transition ${demoActiveTab === 'students' ? 'bg-[#0f1b3d] text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t('studentsTab')}
            </button>
          </div>

          {/* Tab Screen HTML Canvas Mockups */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xl max-w-4xl mx-auto">
            {demoActiveTab === 'fees' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-150">
                    <span className="text-xs text-slate-500 block mb-1">کل جمع شدہ فیس</span>
                    <span className="text-xl font-bold text-slate-800">PKR 480,000</span>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-150">
                    <span className="text-xs text-slate-500 block mb-1">واجب الادا بقایا جات</span>
                    <span className="text-xl font-bold text-slate-800">PKR 125,000</span>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-150">
                    <span className="text-xs text-slate-500 block mb-1">نادہندگان (Defaulters)</span>
                    <span className="text-xl font-bold text-rose-700">14 طلبہ</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 bg-slate-50">
                        <th className="py-2 px-4">طالب علم</th>
                        <th className="py-2 px-4">کلاس</th>
                        <th className="py-2 px-4">رقم</th>
                        <th className="py-2 px-4">حالت فیس</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0f1b3d]">حافظ بلال رحمان</td>
                        <td className="py-3 px-4">Class 9</td>
                        <td className="py-3 px-4">PKR 3,500</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">ادا شدہ (Paid)</span></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-[#0f1b3d]">مریم ساجد اعوان</td>
                        <td className="py-3 px-4">Class 10</td>
                        <td className="py-3 px-4">PKR 4,000</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">تاخیر بقایا (Due)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {demoActiveTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#0f1b3d]">کلاس: 10th-Grade حاضری شیٹ</span>
                  <span className="text-slate-500">منگل، 26 مئی 2026</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-sans font-semibold text-slate-800">1. محمد کامران عباسی</span>
                    <div className="flex space-x-1.5 space-x-reverse">
                      <span className="px-3 py-1.5 bg-[#00c896] text-white rounded-lg font-bold text-xs cursor-pointer">حاضر (P)</span>
                      <span className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer">A</span>
                      <span className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer">L</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-sans font-semibold text-slate-800">2. عائشہ صدیقہ اقبال</span>
                    <div className="flex space-x-1.5 space-x-reverse">
                      <span className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer">P</span>
                      <span className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-bold text-xs cursor-pointer">غیر حاضر (A)</span>
                      <span className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-50 cursor-pointer">L</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button className="px-6 py-2.5 bg-[#00c896] text-white hover:bg-[#00b284] font-bold rounded-xl shadow transition">
                    محفوظ کریں / Save Progress
                  </button>
                </div>
              </div>
            )}

            {demoActiveTab === 'results' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <h4 className="text-sm font-bold text-[#0f1b3d] mb-1">پہلا سمسٹر سالانہ امتحانی نتیجہ</h4>
                  <span className="text-xs text-slate-400">Class 10 - Science Group</span>
                </div>

                <div className="overflow-x-auto text-xs text-right">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-indigo-100 text-slate-400 bg-slate-50">
                        <th className="py-2 px-3">طالب علم</th>
                        <th className="py-2 px-3">مضامین نمبر</th>
                        <th className="py-2 px-3">کل حاصل رقم</th>
                        <th className="py-2 px-3">گریڈ (Grade)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-3 font-bold text-[#0f1b3d]">بلال احمد چوہدری</td>
                        <td className="py-3 px-3">انگریزی: 88 · ریاضی: 95 · اردو: 91</td>
                        <td className="py-3 px-3">274 / 300 (91%)</td>
                        <td className="py-3 px-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">A+</span></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-bold text-[#0f1b3d]">مناہل مائیک فاطمہ</td>
                        <td className="py-3 px-3">انگریزی: 72 · ریاضی: 65 · اردو: 80</td>
                        <td className="py-3 px-3">217 / 300 (72%)</td>
                        <td className="py-3 px-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">B</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {demoActiveTab === 'students' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50 flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-full bg-[#0f1b3d] text-[#00c896] text-sm font-bold flex items-center justify-center">
                    SF
                  </div>
                  <div>
                    <h5 className="font-bold text-[#0f1b3d]">سلمان فاروق فاروقی</h5>
                    <span className="text-xs text-slate-500">بنیادی عہدہ: ہیڈ پرنسپل</span>
                    <span className="block text-[10px] text-slate-400">تاریخ شمولیت: 14 جنوری 2021</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50 flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center">
                    KN
                  </div>
                  <div>
                    <h5 className="font-bold text-[#0f1b3d]">کلثوم ناز رسول</h5>
                    <span className="text-xs text-slate-500">بنیادی عہدہ: سینئر ٹیچر (اسلامیات)</span>
                    <span className="block text-[10px] text-slate-400">تاریخ شمولیت: 10 مارچ 2023</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: BILINGUAL LIVE TOGGLE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[#00c896] font-bold text-sm tracking-wider uppercase">{t('madeForRealSchools')}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b3d]">بغیر کسی انگریزی مجبوری کے</h2>
              <p className="text-slate-600 leading-relaxed font-sans">{t('bilingualToggleShowcase')}</p>
              
              <div className="flex justify-start">
                <button 
                  onClick={onToggleLang}
                  className="px-6 py-3 bg-[#0f1b3d] text-white hover:bg-[#00c896] hover:text-white font-bold rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <Globe className="h-5 w-5" />
                  <span>زبان انگریزی / اردو تبدیل کریں</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                  <span className="font-sans font-bold text-lg text-[#0f1b3d]">{t('appName')}</span>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold">{t('oneMonthFreeBadge')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="block text-2xl font-bold text-slate-800">245</span>
                    <span className="text-[10px] text-slate-400">{t('totalStudents')}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="block text-2xl font-bold text-slate-800">94%</span>
                    <span className="text-[10px] text-slate-400">{t('attendancePercentage')}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="block text-2xl font-bold text-slate-800">12</span>
                    <span className="text-[10px] text-slate-400">{t('staffCount')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: MOBILE FIRST BRIEF */}
      <section className="py-24 bg-[#0f1b3d] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left mock mobile */}
            <div className="flex justify-center">
              <div className="w-[280px] h-[550px] bg-slate-900 border-[8px] border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col">
                {/* Speaker pill top */}
                <div className="h-5 bg-slate-900 flex justify-center items-center">
                  <div className="w-16 h-2 bg-slate-800 rounded-full" />
                </div>

                <div className="flex-1 bg-[#f4f7ff] p-3 text-slate-800 space-y-4 text-xs overflow-y-auto">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-[#0f1b3d] font-sans">EduTrack Attendance</span>
                    <span className="text-[9px] text-[#00c896] font-bold">LIVE</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[11px]">مریم اعجاز</span>
                        <span className="text-[9px] text-slate-400">Roll: #12</span>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <span className="px-2.5 py-1 bg-emerald-500 text-white rounded font-bold text-[9px]">حاضر</span>
                        <span className="px-2.5 py-1 bg-slate-150 text-slate-500 rounded font-bold text-[9px]">A</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[11px]">فاروق اقبال</span>
                        <span className="text-[9px] text-slate-400">Roll: #13</span>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <span className="px-2.5 py-1 bg-slate-150 text-slate-500 rounded font-bold text-[9px]">P</span>
                        <span className="px-2.5 py-1 bg-rose-500 text-white rounded font-bold text-[9px]">غیر حاضر</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[#00c896] font-bold text-sm tracking-widest uppercase block">Mobile-First Strategy</span>
              <h2 className="text-3xl md:text-5xl font-bold">آپ کا پورا اسکول آپ کے ہاتھ کی مٹھی میں</h2>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="bg-[#00c896]/20 p-1.5 rounded-lg mt-1 text-[#00c896]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">سر درد کے بغیر روزانہ فیس ٹریکنگ</h4>
                    <p className="text-slate-400 text-sm">موبائل سے واٹس ایپ پر واجبات کا میسج بھیجیں اور فیس وصول کریں۔</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="bg-[#00c896]/20 p-1.5 rounded-lg mt-1 text-[#00c896]">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">پیپر لیس رزلٹ کارڈز</h4>
                    <p className="text-slate-400 text-sm">اساتذہ اپنے فون پر ہی حاصل کردہ نمبر درج کر سکتے ہیں۔</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FREE 1 MONTH OFFER BANNER */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-tr from-[#0f1b3d] to-[#1e3472] text-white p-8 md:p-16 rounded-[32px] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 text-[#00c896]/10 pointer-events-none transform translate-x-12 -translate-y-12">
              <GraduationCap className="w-96 h-96" />
            </div>

            <div className="relative z-10 max-w-4xl space-y-6">
              <span className="px-3 py-1 bg-[#00c896] text-white text-xs font-bold rounded-full uppercase tracking-widest">مفت آزمائش</span>
              <h2 className="text-3xl md:text-5xl font-mono font-bold leading-tight">1 مہینہ بالکل مفت — تمام پریمیئم فیچرز کے ساتھ</h2>
              <p className="text-slate-300 font-sans max-w-2xl text-base">کوئی رجسٹریشن فیس نہیں، کوئی ہڈن چارجز نہیں۔ جب چاہیں آنلائن کینسل کریں۔ پاکستان میں تیار کردہ بہترین اسکول پورٹل سسٹم۔</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs font-bold pt-4 text-slate-200">
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ {t('students')}</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ فیس ٹریکنگ</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ روزانہ حاضری</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ رپورٹ کارڈز</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ AI تجزيات</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ تنخواہ اسائنمنٹ</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ واٹس ایپ الرٹس</div>
                <div className="flex items-center space-x-1.5 space-x-reverse">✓ اخراجات لاگ</div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => onOpenAuth('register')}
                  className="px-8 py-4 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-lg rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{t('getStartedFree')}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: TESTIMONIALS */}
      <section className="py-24 bg-[#f4f7ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#00c896] font-bold text-sm tracking-widest uppercase block">User Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b3d]">{t('testimonialBrief')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl shadow-md hover:-translate-y-1.5 transition duration-300 relative border border-slate-200/50">
              <span className="text-6xl text-[#00c896]/20 font-serif absolute top-4 left-4">“</span>
              <p className="text-slate-600 mb-6 relative z-10 leading-relaxed font-sans">{t('testimonial1Text')}</p>
              <div className="font-bold text-[#0f1b3d] text-sm">{t('testimonial1Title')}</div>
            </div>

            <div className="p-8 bg-white rounded-3xl shadow-md hover:-translate-y-1.5 transition duration-300 relative border border-slate-200/50">
              <span className="text-6xl text-[#00c896]/20 font-serif absolute top-4 left-4">“</span>
              <p className="text-slate-600 mb-6 relative z-10 leading-relaxed font-sans">{t('testimonial2Text')}</p>
              <div className="font-bold text-[#0f1b3d] text-sm">{t('testimonial2Title')}</div>
            </div>

            <div className="p-8 bg-white rounded-3xl shadow-md hover:-translate-y-1.5 transition duration-300 relative border border-slate-200/50">
              <span className="text-6xl text-[#00c896]/20 font-serif absolute top-4 left-4">“</span>
              <p className="text-slate-600 mb-6 relative z-10 leading-relaxed font-sans">{t('testimonial3Text')}</p>
              <div className="font-bold text-[#0f1b3d] text-sm">{t('testimonial3Title')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FEATURES GRID (12 Features) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b3d]">{t('allSchoolNeed')}</h2>
            <p className="text-slate-500 font-sans">جدید خصوصیات کا ایک تفصیلی گلدستہ جو ہر پاکستانی اسکول کے روایتی طریقوں کو تبدیل کرے گا۔</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresTwelve.map((feat, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-[#00c896] hover:bg-white transition duration-300">
                <div className="w-10 h-10 bg-[#00c896]/10 text-[#00c896] font-bold rounded-lg flex items-center justify-center mb-4">{idx + 1}</div>
                <h3 className="font-bold text-[#0f1b3d] mb-1.5 text-base">{feat.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-sans">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11: FAQ ACCORDION */}
      <section id="faq" className="py-24 bg-[#f4f7ff]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-[#0f1b3d]">{t('faqTitle')}</h2>
            <p className="text-slate-500">اگر آپ کا کوئی سوال ہے جس کا جواب ذیل میں نہیں ملا، تو ہمارے مینیجر سے بلا جھجھک واٹس ایپ پر رابطہ کریں۔</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition"
                >
                  <button 
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-right font-bold text-[#0f1b3d] focus:outline-none"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-[#00c896]" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 text-slate-600 text-sm leading-relaxed"
                      >
                        <hr className="border-slate-100 mb-4" />
                        {item.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 12: FINAL CTA BANNER */}
      <section className="py-24 bg-[#0f1b3d] text-white text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00c896]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-mono font-bold leading-tight">آج ہی مفت شروع کریں</h2>
          <p className="text-slate-300 text-lg">1 مہینہ تمام اداری فیچرز مفت — کریڈٹ کارڈ کی کوئی ضرورت نہیں ہے۔ 3 منٹ پر رجسٹریشن کریں۔</p>
          
          <div className="pt-4">
            <button 
              onClick={() => onOpenAuth('register')}
              className="px-8 py-4 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-xl rounded-xl shadow-lg transition transform hover:scale-[1.03]"
            >
              ابھی اسکول رجسٹر کریں
            </button>
          </div>
        </div>
      </section>
        </>
      ) : (
        <AboutUs currentLang={currentLang} onBack={() => setActiveTab('landing')} />
      )}

      {/* SECTION 13: FOOTER */}
      <footer className="bg-[#0b132b] text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse text-white">
              <div className="bg-[#00c896] text-white p-1.5 rounded-lg">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">{t('appName')}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">{t('tagline')}</p>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-widest">{t('features')}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition">{t('feesTab')}</a></li>
              <li><a href="#features" className="hover:text-white transition">{t('attendanceTab')}</a></li>
              <li><a href="#features" className="hover:text-white transition">{t('resultsTab')}</a></li>
              <li><a href="#features" className="hover:text-white transition">{t('studentsTab')}</a></li>
              <li>
                <button 
                  onClick={() => {
                    setActiveTab('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition cursor-pointer font-semibold text-[#00c896]"
                >
                  {currentLang === 'ur' ? 'ڈویلپر کے بارے میں' : 'About Developer'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-widest">{t('faqTitle')}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#faq" className="hover:text-white transition">کیا مفت ہے؟</a></li>
              <li><a href="#faq" className="hover:text-white transition">سیکورٹی اصول</a></li>
              <li><a href="#faq" className="hover:text-white transition">واٹس ایپ الرٹس</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-widest">{t('contactUs')}</h4>
            <p className="text-xs text-slate-500">{currentLang === 'ur' ? 'لاہور، پاکستان' : 'Lahore, Pakistan'}</p>
            <div className="text-xs text-[#00c896] font-mono leading-relaxed">
              <span>{t('phoneLbl')}: +92 300 4504088</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
          <p>{t('madeWithLove')}</p>
        </div>
      </footer>
    </div>
  );
}
