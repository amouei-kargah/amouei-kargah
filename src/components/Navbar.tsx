import React, { useState } from 'react';
import { ClipboardList, BarChart3, FileSpreadsheet, Mail, ShieldCheck, LogOut, Copy, Check, User, Share2 } from 'lucide-react';
import { AuthSession } from '../types';

interface NavbarProps {
  activeTab: 'entry' | 'reports' | 'accounting' | 'googlesheets' | 'shareguide';
  setActiveTab: (tab: 'entry' | 'reports' | 'accounting' | 'googlesheets' | 'shareguide') => void;
  reportsCount: number;
  session: AuthSession;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reportsCount,
  session,
  onLogout,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="bg-zinc-950 text-white border-b border-zinc-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3.5 gap-4">
          
          {/* Brand & Workshop Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-inner font-black text-xl">
                🪵
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg text-white tracking-tight leading-none">
                  مجموعه دکوراسیون داخلی و کابینت عمویی
                </h1>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                  <span className="text-zinc-300 font-medium">سامانه یکپارچه گزارش تولید کارگاه</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-zinc-600"></span>
                  <span className="text-emerald-400">اتصال به Mm.moj9267@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Quick Share Link button for Mobile */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                title="کپی لینک سامانه جهت ارسال به پرسنل"
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation Tabs & User Controls */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            
            {/* Tabs */}
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none" aria-label="تب‌های سیستم">
              
              {/* Production Entry Tab */}
              <button
                id="tab-entry"
                type="button"
                onClick={() => setActiveTab('entry')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'entry'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>فرم ثبت تولید</span>
              </button>

              {/* Reports and Excel Tab */}
              <button
                id="tab-reports"
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'reports'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>گزارشات روزانه و اکسل</span>
                {reportsCount > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTab === 'reports' ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {reportsCount}
                  </span>
                )}
              </button>

              {/* Accounting Tab */}
              <button
                id="tab-accounting"
                type="button"
                onClick={() => setActiveTab('accounting')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'accounting'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تفکیک حسابداری پروژه‌ها</span>
              </button>

              {/* Share Visual Guide Tab */}
              <button
                id="tab-shareguide"
                type="button"
                onClick={() => setActiveTab('shareguide')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'shareguide'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-zinc-900 border border-amber-400/40'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>آموزش تصویری رفع ۴۰۳</span>
              </button>

              {/* Google Sheets Tab */}
              <button
                id="tab-googlesheets"
                type="button"
                onClick={() => setActiveTab('googlesheets')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'googlesheets'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>اتصال گوگل شیت</span>
              </button>
            </nav>

            {/* User Session & Logout */}
            <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800 w-full lg:w-auto justify-between lg:justify-end">
              
              {/* Copy App Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                title="کپی لینک برنامه جهت ارسال به پرسنل یا باز کردن در گوشی و کامپیوتر"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">لینک کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>کپی لینک برنامه</span>
                  </>
                )}
              </button>

              {/* Role badge */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  session.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
                <span className="font-bold text-zinc-200">{session.displayName}</span>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogout}
                title="خروج از حساب کاربری"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 text-zinc-400 text-xs transition border border-zinc-800 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
