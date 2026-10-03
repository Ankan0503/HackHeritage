import React, { useState, useEffect } from 'react';
import {
  Waves,
  Compass,
  Activity,
  Globe,
  ShieldCheck,
  Satellite,
  SlidersHorizontal,
  BookOpen,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { LanguageCode } from '../types';
import { MULTILINGUAL_DICTIONARY } from '../data/coastalData';
import { OrcaWaveLogo } from './ui/OrcaWaveLogo';
import { OrcaWordmark } from './ui/OrcaWordmark';

type TabId = 'dashboard' | 'analysis' | 'satellite' | 'evidence' | 'simulator';

interface LeftNavbarProps {
  currentTab: TabId;
  setCurrentTab: (tab: TabId) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isProcessing?: boolean;
  /** Returns to the project brief. */
  onExit?: () => void;
}

const languages: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

const navItems: {
  id: TabId;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
    {
      id: 'dashboard',
      label: 'Mission Control',
      description: 'Advisory, telemetry and live chart',
      icon: Compass,
      badge: 'LIVE'
    },
    {
      id: 'analysis',
      label: 'Risk Drivers',
      description: 'Feature attribution behind the score',
      icon: Activity
    },
    {
      id: 'satellite',
      label: 'Satellite Passes',
      description: 'Copernicus Sentinel catalogue',
      icon: Satellite,
      badge: 'SAR'
    },
    {
      id: 'evidence',
      label: 'Authority Corpus',
      description: 'INCOIS, IMD and NDMA guidance',
      icon: BookOpen
    },
    {
      id: 'simulator',
      label: 'What-If Studio',
      description: 'Perturb conditions against the engine',
      icon: SlidersHorizontal
    }
  ];

/** ORCA-X wordmark: a sounding mark struck over a contour. */
const Wordmark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <OrcaWaveLogo size="md" variant="sidebar" className="shrink-0" />
    <div className="min-w-0 flex-1">
      <OrcaWordmark
        size="md"
        badge="v2.4"
        theme="light"
        subtitle={compact ? undefined : "OCEAN REASONING AI"}
      />
    </div>
  </div>
);

/**
 * The three sub-views below live at module scope on purpose. The sidebar
 * re-renders once a second to advance its clocks; declaring these inline would
 * hand React a new component type on every tick and remount the subtree,
 * closing the language `<select>` under the operator's cursor.
 */

const StatusLamp: React.FC<{ isProcessing: boolean; language?: LanguageCode }> = ({ isProcessing, language = 'en' }) => {
  const dict = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY.en;
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {isProcessing && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${isProcessing ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
        />
      </span>
      <span className="font-mono text-[9.5px] font-semibold tracking-wider text-slate-500 uppercase">
        {isProcessing ? dict.running : dict.standingBy}
      </span>
    </span>
  );
};

const LanguageField: React.FC<{
  id: string;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}> = ({ id, language, setLanguage }) => {
  const dict = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY.en;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold"
      >
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-sky-600" />
          {dict.languageLabel}
        </span>
        <span className="text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">{language.toUpperCase()}</span>
      </label>
      <select
        id={id}
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 transition-colors hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-xs"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
            {lang.native} — {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const NavList: React.FC<{
  currentTab: TabId;
  setCurrentTab: (tab: TabId) => void;
  onNavigate?: () => void;
  language?: LanguageCode;
}> = ({ currentTab, setCurrentTab, onNavigate, language = 'en' }) => {
  const dict = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY.en;
  const labels: Record<TabId, string> = {
    dashboard: dict.missionTitle,
    analysis: dict.riskScore,
    satellite: dict.satelliteIntelligence,
    evidence: dict.evidenceGrounding,
    simulator: dict.whatIfSimulation
  };
  const descriptions: Record<TabId, string> = {
    dashboard: `${dict.recommendations}, ${dict.telemetryTitle}`,
    analysis: dict.factors,
    satellite: dict.satelliteLayer,
    evidence: dict.citations,
    simulator: dict.simulatorTitle
  };
  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            id={`left-nav-tab-${item.id}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              setCurrentTab(item.id);
              onNavigate?.();
            }}
            className={[
              'group relative flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-all duration-200 rounded-xl active:scale-[0.98] cursor-pointer',
              isActive
                ? 'bg-gradient-to-r from-sky-500/12 via-sky-500/8 to-cyan-500/5 text-sky-950 font-semibold border border-sky-300/70 shadow-xs shadow-sky-500/5'
                : 'border border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            ].join(' ')}
          >
            {isActive && (
              <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-sky-500 to-cyan-500 shadow-xs shadow-sky-500/50" />
            )}
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all shrink-0 ${
                isActive 
                  ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm shadow-sky-500/35' 
                  : 'bg-slate-100/90 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700'
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold leading-tight font-sans tracking-tight">
                  {labels[item.id]}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-slate-500 font-sans">
                  {descriptions[item.id]}
                </span>
              </span>
            </span>

            {item.badge && (
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider ${
                  isActive 
                    ? 'border-sky-300/80 bg-sky-100/80 text-sky-800' 
                    : 'border-slate-200/80 bg-slate-100/70 text-slate-500'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

/** Returns to the project brief. Shown in both the drawer and the sidebar. */
const BriefLink: React.FC<{ onExit: () => void; size?: 'sm' | 'xs'; language?: LanguageCode }> = ({
  onExit,
  size = 'xs',
  language = 'en'
}) => (
  <button
    onClick={onExit}
    className={`group flex items-center gap-2 font-mono ${size === 'sm' ? 'text-[10.5px]' : 'text-[10px]'
      } uppercase tracking-wider text-slate-500 transition-colors hover:text-sky-700 font-semibold`}
  >
    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1 text-sky-600" />
    {(MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY.en).projectBrief}
  </button>
);

export const LeftNavbar: React.FC<LeftNavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  isProcessing = false,
  onExit
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeIst, setTimeIst] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setTimeIst(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const dict = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY.en;

  /** The two clocks an operator works against. */
  const Clocks = (
    <>
      <div className="flex justify-between">
        <span className="font-semibold text-slate-500">IST</span>
        <span className="tabular-nums font-semibold text-slate-800">{timeIst}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold text-slate-400">UTC</span>
        <span className="tabular-nums text-slate-600">{timeUtc}</span>
      </div>
    </>
  );

  return (
    <>
      {/* ---- Mobile top bar --------------------------------------------- */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Wordmark compact />
        <div className="flex items-center gap-3">
          <StatusLamp isProcessing={isProcessing} language={language} />
          <button
            id="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:border-sky-300 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ---- Mobile drawer ---------------------------------------------- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="flex h-full w-72 max-w-[85vw] flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-7">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <Wordmark />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {onExit && (
                <BriefLink
                  size="sm"
                  language={language}
                  onExit={() => {
                    setMobileMenuOpen(false);
                    onExit();
                  }}
                />
              )}

              <NavList
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                language={language}
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <LanguageField
                id="drawer-language-selector"
                language={language}
                setLanguage={setLanguage}
              />
            </div>

            <div className="mt-8 space-y-1 border-t border-slate-200 pt-5 font-mono text-[10px] text-slate-500">
              {Clocks}
            </div>
          </div>
        </div>
      )}

      {/* ---- Mobile Sticky Bottom Thumb Navigation Dock (Section 2A) ---- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur-xl lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[52px] flex-1 py-1 px-1 rounded-xl transition-all btn-micro-interactive ${isActive
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 active:scale-95'
                }`}
            >
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-sky-600" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="text-[9.5px] tracking-tight mt-1 font-mono truncate max-w-[62px]">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
        {/* Mobile Compact Language Selector */}
        <div className="flex flex-col items-center justify-center min-h-[52px] px-1">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="bg-slate-50 text-sky-800 font-mono font-bold border border-slate-300 text-[10px] rounded-xl px-2 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-200 shadow-xs"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} className="bg-white text-slate-800">
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* ---- Desktop sidebar -------------------------------------------- */}
      <aside
        id="left-sidebar-navigation"
        className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto no-scrollbar border-r border-slate-200/80 bg-white/85 backdrop-blur-3xl lg:flex xl:w-72 shadow-[4px_0_30px_rgba(15,23,42,0.03)]"
      >
        <div className="space-y-6 p-5">
          <Wordmark />

          {onExit && <BriefLink onExit={onExit} language={language} />}

          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white/95 via-slate-50/80 to-sky-50/20 backdrop-blur-md p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="flex items-center justify-between">
              <StatusLamp isProcessing={isProcessing} language={language} />
              <span className="font-mono text-[8.5px] font-bold tracking-[0.14em] text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                LIVE FEED
              </span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-[10.5px] text-slate-600">
              {Clocks}
            </div>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5 pl-2">{dict.modules}</p>
            <NavList currentTab={currentTab} setCurrentTab={setCurrentTab} language={language} />
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-200/80 p-5 bg-slate-50/60 backdrop-blur-md">
          <LanguageField
            id="sidebar-language-selector"
            language={language}
            setLanguage={setLanguage}
          />

          <p className="text-[10.5px] leading-snug text-slate-500 font-sans">{dict.missionSubtitle}</p>

          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 font-mono text-[9.5px] tracking-wider text-slate-400">
            <span>INCOIS · IMD · NOAA</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
              <ShieldCheck className="h-3 w-3" />
              VERIFIED
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
