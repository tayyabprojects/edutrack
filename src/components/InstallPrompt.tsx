import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, HelpCircle, Smartphone, ArrowRight, CornerRightUp, Play } from 'lucide-react';
import { Language } from '../types';

interface InstallPromptProps {
  currentLang: Language;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt({ currentLang }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect platforms
    const ua = navigator.userAgent;
    const isAndroidDevice = /Android/i.test(ua);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Auto-show banner if user is on mobile or Android
      const hasDismissed = localStorage.getItem('pwa-dismissed') === 'true';
      if (!hasDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If PWA is already installed, do not show
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      console.log('EduTrack was successfully installed on target device!');
    });

    // Fallback: Show the banner after 5.5 seconds for Mobile/Android users even if event has not fired yet,
    // so they can see manual install guide instructions.
    const timer = setTimeout(() => {
      const hasDismissed = localStorage.getItem('pwa-dismissed') === 'true';
      if (!hasDismissed && (isAndroidDevice || isIOSDevice)) {
        setIsVisible(true);
      }
    }, 5500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Support manual instruction reveal if native event not captured
      setShowGuide(true);
      return;
    }
    // Show native browser install banner prompt
    await deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember preference for 7 days to not annoy user
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!isVisible) return null;

  const isRTL = currentLang === 'ur';

  return (
    <AnimatePresence>
      <div 
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 font-sans" 
        dir={isRTL ? 'rtl' : 'ltr'}
        id="android-install-prompt"
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="bg-[#0f1b3d] text-white border border-slate-800 rounded-3xl p-5 shadow-2xl relative text-right overflow-hidden"
        >
          {/* Subtle decoration light glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          {/* Header Title with PWA badge */}
          <div className="flex items-center gap-3 mb-3 justify-start">
            <div className="bg-[#00c896]/10 p-2.5 rounded-2xl text-[#00c896]">
              <Smartphone className="h-6 w-6 animate-pulse" />
            </div>
            <div className="text-left w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs tracking-wider bg-[#00c896] text-[#0f1b3d] font-bold px-2 py-0.5 rounded-md">
                  PWA APP
                </span>
                <h4 className="font-extrabold text-sm text-slate-200">
                  {isRTL ? 'اینڈرائیڈ موبائل پر انسٹال کریں' : 'Install EduTrack on Android'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRTL ? 'پانی کی طرح تیز رفتار استعمال کا تجربہ حاصل کریں!' : 'Get a seamless, app-like responsive experience!'}
              </p>
            </div>

            {/* Close Cross icon Button */}
            <button 
              onClick={handleDismiss}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Quick Benefits lists */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 text-right pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1 justify-end">
                <span>{isRTL ? 'پیپر لیس حاضری' : 'Fast Attendance'}</span>
                <span className="text-[#00c896]">✓</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span>{isRTL ? 'واٹس ایپ نوٹیفکیشن الرٹ' : 'WhatsApp Alerts'}</span>
                <span className="text-[#00c896]">✓</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span>{isRTL ? 'آسان فیس کلیکشن' : 'Easy Fees Track'}</span>
                <span className="text-[#00c896]">✓</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span>{isRTL ? 'بغیر انٹرنیٹ رسائی' : 'Smoother Loading'}</span>
                <span className="text-[#00c896]">✓</span>
              </div>
            </div>

            {/* Action Group Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-3 bg-[#00c896] hover:bg-[#00b284] text-[#0f1b3d] font-extrabold rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>{isRTL ? 'ابھی ایپ انسٹال کریں' : 'Install App Now'}</span>
              </button>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="py-3 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                title={isRTL ? 'طریقہ کار سیکھیں' : 'How to install guide'}
              >
                <HelpCircle className="h-4 w-4" />
                <span>{isRTL ? 'طریقہ کار' : 'Guide'}</span>
              </button>
            </div>

            {/* Expandable Manual guide container */}
            {showGuide && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="p-4 bg-slate-900 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-3"
              >
                <h5 className="font-extrabold text-white text-center border-b border-slate-800 pb-2">
                  {isRTL ? 'دستی انسٹال کرنے کا طریقہ' : 'Manual Installation Steps'}
                </h5>

                {/* Android Steps */}
                <div className="space-y-2">
                  <p className="font-bold text-[#00c896] flex items-center gap-1.5 justify-end">
                    <span>{isRTL ? 'اینڈرائیڈ فون (Google Chrome)' : 'Android Mobile (Google Chrome)'} :</span>
                    <Smartphone className="h-3.5 w-3.5" />
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pr-2 text-right">
                    <li>{isRTL ? 'اپنے براؤزر کے اوپر دائیں کونے میں 3 نقطوں (●●●) پر ٹیپ کریں۔' : 'Tap the 3 dots (three-dot menu) in your browser top-right.'}</li>
                    <li>{isRTL ? 'مینو کی فہرست میں سے "Add to Home screen" یا "Install app" پر کلک کریں۔' : 'Select "Add to Home screen" or "Install App".'}</li>
                    <li>{isRTL ? 'تصدیق پر کلک کریں۔ ایپ اسکرین پر آئیکن کے ساتھ ظاہر ہو جائے گی۔' : 'Confirm addition. The app icon will appear on your desktop screen.'}</li>
                  </ol>
                </div>

                {/* iOS / Safari Steps fallback */}
                <div className="space-y-2 pt-2 border-t border-slate-800/50">
                  <p className="font-bold text-sky-400 flex items-center gap-1.5 justify-end">
                    <span>{isRTL ? 'آئی فون سفاری (Apple iOS)' : 'iPhone - Apple iOS (Safari)'} :</span>
                    <Smartphone className="h-3.5 w-3.5" />
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pr-2 text-right">
                    <li>{isRTL ? 'براؤزر کے نیچے موجود "شیئر" (Share Box w/ Arrow) والے آئیکن پر ٹیپ کریں۔' : 'Tap the "Share" icon (square with action arrow) on the bottom panel.'}</li>
                    <li>{isRTL ? 'اسکرول ڈاؤن کریں اور پھر "Add to Home Screen" پر کلک کریں۔' : 'Scroll down and tap "Add to Home Screen".'}</li>
                    <li>{isRTL ? 'کونے میں موجود "Add" بٹن پر کلک کریں۔' : 'Tap "Add" in the top right to complete.'}</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
