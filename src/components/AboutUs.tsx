import React from 'react';
import { motion } from 'motion/react';
import { 
  Linkedin, ExternalLink, Heart, Sparkles, Globe, 
  Award, ArrowLeft, Mail, CheckCircle, Code, ShieldCheck, HeartPulse
} from 'lucide-react';
import { Language } from '../types';
import tayyabPortrait from '../assets/images/tayyab_real_final_beauty.png';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AboutUsProps {
  currentLang: Language;
  onBack: () => void;
}

export default function AboutUs({ currentLang, onBack }: AboutUsProps) {
  const isRTL = currentLang === 'ur';

  const [customAvatar, setCustomAvatar] = React.useState<string | null>(null);

  // Sync custom avatar from global settings of super admin
  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.avatarUrl) {
          setCustomAvatar(data.avatarUrl);
        }
      }
    }, (error) => {
      console.warn("AboutUs avatar load error:", error);
    });
    return () => unsub();
  }, []);

  // Dynamically constructs the absolute URL at runtime based on the actual page loading context,
  // which works flawlessly for any host (including GitHub Pages custom domains, subfolders, or local testing).
  const getAbsoluteImageUrl = (filename: string) => {
    try {
      const origin = window.location.origin;
      let pathname = window.location.pathname;
      if (pathname.endsWith('.html')) {
        pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
      }
      if (!pathname.endsWith('/')) {
        pathname = pathname + '/';
      }
      const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
      return `${origin}${pathname}${cleanFilename}`;
    } catch (e) {
      return `./${filename}`;
    }
  };

  // Only use the golden-brown beauty portrait as requested ("yeh meri picture ha yehi lagao bas").
  // We attach a custom version suffix to bypass any stale cached 404 responses in the user's browser for this asset.
  const imageSources = [
    customAvatar,
    `${getAbsoluteImageUrl('tayyab_real_final_beauty.png')}?v=golden10`,
    tayyabPortrait ? `${tayyabPortrait}?v=golden10` : '',
    `./tayyab_real_final_beauty.png?v=golden10`,
    `tayyab_real_final_beauty.png?v=golden10`,
  ].filter(Boolean) as string[];

  const [imgSrc, setImgSrc] = React.useState<string>(imageSources[0] || '');
  const [attemptIndex, setAttemptIndex] = React.useState<number>(0);

  // Keep imgSrc updated when active dynamic uploader completes
  React.useEffect(() => {
    if (customAvatar) {
      setImgSrc(customAvatar);
    }
  }, [customAvatar]);

  // Fallback handler if any compiled asset fails to load
  const handleImgError = () => {
    const nextIndex = attemptIndex + 1;
    if (nextIndex < imageSources.length) {
      setImgSrc(imageSources[nextIndex]);
      setAttemptIndex(nextIndex);
    }
  };

  // Localized Dictionary for About Developer Page
  const d = {
    en: {
      backHome: "Back to Home",
      title: "About the Developer",
      tagline: "Crafting modern SaaS platforms with precision and purpose.",
      meetDeveloper: "Meet Muhammad Tayyab",
      role: "Lead Full-Stack AI Engineer & SaaS Developer",
      bio: "Highly passionate software engineer dedicated to building high-performance web applications and SaaS platforms that solve real-world community challenges. Specializes in advanced React, Node.js, AI integrations, and cloud architectures with pixel-perfect responsive designs.",
      vision: "Empowering local businesses and schools across Pakistan through seamless, low-cost digital transformation.",
      linkedinBtn: "Connect on LinkedIn",
      emailBtn: "Send Email",
      pastProjects: "Featured Masterpiece Project",
      medicareTitle: "Medicare Plus",
      medicareSubtitle: "Hospital Appointment & Smart Prescription Management Ecosystem",
      medicareDesc: "A complete patient-first medical portal designed to bridge the gap between clinics and patients. It automates doctor appointment scheduling, real-time consultation desk queues, and secure digital prescription issuance.",
      medicareLinkText: "View Live Project",
      keyFeaturesTitle: "Core Features Implemented",
      medicareFeat1: "Bilingual Medical Interface (Urdu/English)",
      medicareFeat2: "Real-time doctor appointment slots booking engine",
      medicareFeat3: "Digital smart prescription writer & automatic PDF downloader for patients",
      medicareFeat4: "Secure medical history vault & online lab report tracking",
      contactTitle: "Get In Touch",
      collabText: "Are you interested in digitizing your institution, building custom AI SaaS, or discussing custom integrations? Feel free to connect!"
    },
    ur: {
      backHome: "مرکزی صفحہ پر جائیں",
      title: "ڈویلپر کے بارے میں",
      tagline: "معیاری ٹیکنالوجی اور خوبصورت ڈیزائنز کا منفرد سنگم۔",
      meetDeveloper: "محمد طیب سے ملیں",
      role: "لیڈ فل سٹیک اے آئی انجینئر اور SaaS خالق",
      bio: "پاکستان میں سافٹ ویئر اور جدید ساس (SaaS) ٹیکنالوجی کو عام کرنے کے لیے پرعزم۔ ان کو جدید انٹرایکٹو ری ایکٹ (React)، سمارٹ ڈیٹا بیسز، اور کلاؤڈ کمپیوٹنگ میں مہارت حاصل ہے، جو پکسل پرفیکٹ خوبصورت متحرک ڈیزائنز بناتے ہیں۔",
      vision: "سادہ اور سستے ڈیجیٹل سسٹمز کے ذریعے پاکستان بھر کے اسکولوں اور اداروں کو ٹیکنالوجی کے ساتھ آراستہ کرنا۔",
      linkedinBtn: "LinkedIn پر رابطہ کریں",
      emailBtn: "ای میل بھیجیں",
      pastProjects: "ڈویلپر کا شاہکار پچھلا پروجیکٹ",
      medicareTitle: "میڈیکیئر پلس (MediCare Plus)",
      medicareSubtitle: "اسمارٹ ہسپتال اپائنٹمنٹ اور آن لائن نسخہ جات کا جدید پورٹل",
      medicareDesc: "ایک مکمل آن لائن ہسپتال مینجمنٹ سسٹم جو مریضوں اور ڈاکٹروں کے مابین رابطے کو بالکل آسان بناتا ہے۔ اس میں ڈاکٹرز اپائنٹمنٹ، لائیو شیڈولنگ، اور فزیشنز کی طرف سے فارماسٹ اور مریضوں کے لیے آن لائن اینکرپٹڈ اسمارٹ نسخہ جات (prescription) فراہم کرنا شامل ہے۔",
      medicareLinkText: "پروجیکٹ لائیو دیکھیں",
      keyFeaturesTitle: "آمدہ اہم خصوصیات",
      medicareFeat1: "ڈاکٹرز اور کلینکس کے لیے ریئل ٹائم بکنگ انجن",
      medicareFeat2: "سیکنڈوں میں آن لائن ڈیجیٹل اسمارٹ نسخہ کی تیاری (Online Prescription)",
      medicareFeat3: "مریضوں کے لیے نسخہ فوری طور پر PDF ڈاؤن لوڈ کرنے کی صلاحیت",
      medicareFeat4: "موبائل مطابقت اور آسان دو لسانی انٹرفیس تاکہ ہر کوئی باآسانی استعمال کر سکے",
      contactTitle: "رابطہ قائم کریں",
      collabText: "کیا آپ اپنے اسکول، ہسپتال یا کاروباری ادارے کو خودکار ڈیجیٹل سسٹم پر شفٹ کرنا چاہتے ہیں؟ محمد طیب سے براہِ راست رابطہ کریں!"
    }
  };

  const active = d[currentLang];

  return (
    <div className={`min-h-screen bg-[#f4f7ff] pb-24 pt-28 text-slate-800 ${isRTL ? 'text-right' : 'text-left'}`} id="about-us-container">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-[#0f1b3d] font-bold rounded-xl shadow-sm border border-slate-200/80 transition duration-300 cursor-pointer text-xs"
            id="back-home-button"
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{active.backHome}</span>
          </button>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1 bg-[#00c896]/10 text-[#00c896] px-4 py-1.5 rounded-full text-xs font-bold font-mono">
            <Sparkles className="h-4.5 w-4.5" />
            <span>EduTrack Author</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0f1b3d] leading-tight font-sans">
            {active.title}
          </h1>
          <p className="text-slate-500 font-sans text-base max-w-xl mx-auto leading-relaxed">
            {active.tagline}
          </p>
        </div>

        {/* Profile Card Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16" id="profile-card-grid">
          
          {/* Avatar and Info Card */}
          <div className="lg:col-span-5 bg-[#0f1b3d] text-white rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between shadow-xl">
            {/* Background Glow */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#00c896]/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="space-y-6 text-center lg:text-right relative z-10 flex-col flex items-center lg:items-end">
              {/* Profile Image with absolute precision matching reference photo coordinates */}
              <div className="relative group mb-2">
                <div className="absolute -inset-1.5 bg-[#00c896] rounded-3xl blur-md opacity-40 group-hover:opacity-100 transition duration-500" />
                <div className="relative w-44 h-56 rounded-2xl overflow-hidden border-4 border-white/90 bg-slate-800 shadow-2xl shrink-0 group">
                  <img 
                    src={imgSrc}
                    alt="Muhammad Tayyab portrait" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    id="developer-photo-avatar"
                    onError={handleImgError}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight">{active.meetDeveloper}</h2>
                <p className="text-[#00c896] text-xs font-bold mt-1 uppercase tracking-wider">{active.role}</p>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed font-sans max-w-md">
                {active.bio}
              </p>
            </div>

            <div className="pt-8 border-t border-white/10 mt-6 relative z-10 flex flex-col gap-3">
              <a 
                href="https://www.linkedin.com/in/asktayyab/" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="w-full py-3.5 bg-[#00c896] hover:bg-[#00b284] text-white font-bold text-center rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#00c896]/15 hover:scale-[1.02]"
              >
                <Linkedin className="h-4.5 w-4.5" />
                <span>{active.linkedinBtn}</span>
              </a>

              <a 
                href="mailto:seomtayyab@gmail.com" 
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-center rounded-xl transition flex items-center justify-center gap-2 border border-white/5"
              >
                <Mail className="h-4.5 w-4.5 text-slate-300" />
                <span>{active.emailBtn}</span>
              </a>
            </div>
          </div>

          {/* Vision and Past Work Showcase Card */}
          <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-200/80 p-8 md:p-10 shadow-sm flex flex-col justify-between" id="vision-showcase-panel">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-[#f4f7ff] text-[#0f1b3d] rounded-xl">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0f1b3d]">{active.pastProjects}</h3>
              </div>

              {/* Medicare Plus Card Layout */}
              <div className="bg-[#f4f7ff] border border-slate-200 rounded-2xl p-6 hover:shadow-md transition duration-300 relative group overflow-hidden">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Interactive System</span>
                </div>

                <div className="flex items-start gap-3.5 mb-4 max-w-[85%]">
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-xl shrink-0 group-hover:scale-110 transition duration-300">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[#0f1b3d] group-hover:text-[#00c896] transition">{active.medicareTitle}</h4>
                    <p className="text-slate-400 text-xs font-semibold">{active.medicareSubtitle}</p>
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-sans">
                  {active.medicareDesc}
                </p>

                {/* Sub Features Details list */}
                <div className="space-y-3 mb-6 bg-white border border-slate-200/50 p-4 rounded-xl">
                  <h5 className="text-[#0f1b3d] text-xs font-black">{active.keyFeaturesTitle}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-600 font-sans">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{active.medicareFeat1}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 font-sans">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{active.medicareFeat2}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 font-sans">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{active.medicareFeat3}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 font-sans">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{active.medicareFeat4}</span>
                    </div>
                  </div>
                </div>

                {/* Button Link */}
                <a 
                  href="https://tayyabprojects.github.io/medicare-project/" 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-1.5 px-5 py-3 bg-[#0f1b3d] text-white hover:bg-[#00c896] hover:text-[#0f1b3d] font-bold text-xs rounded-xl shadow-sm transition duration-300"
                >
                  <span>{active.medicareLinkText}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Footer Callout */}
            <div className="pt-6 border-t mt-6 bg-slate-50/80 -mx-8 -mb-8 p-8 rounded-b-[32px] border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-[#0f1b3d]/5 text-[#0f1b3d] rounded-full shrink-0">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0f1b3d]">{active.contactTitle}</h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-0.5">{active.collabText}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
