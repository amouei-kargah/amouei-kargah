import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ProductionForm } from './components/ProductionForm';
import { ReportsView } from './components/ReportsView';
import { AccountingSummary } from './components/AccountingSummary';
import { GoogleSheetsIntegration } from './components/GoogleSheetsIntegration';
import { AuthScreen } from './components/AuthScreen';
import { DailyReport, AuthSession, UserRole } from './types';
import { fetchAllReports, deleteReportById, clearAllReports, deleteMultipleReports, syncWithServer } from './services/storageService';

export default function App() {
  // Session authentication state
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('amouei_cabinet_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Query parameter role detection (e.g. ?role=admin or ?role=tolid)
  const initialRole = useMemo<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r === 'admin' || r === 'amouei' || r === 'عمویی' || r === 'مدیریت') return 'admin';
      if (r === 'tolid' || r === 'kargah' || r === 'پرسنل') return 'production';
    }
    return 'production';
  }, []);

  // Set active tab according to role: Management goes directly to 'reports', production to 'entry'
  const [activeTab, setActiveTab] = useState<'entry' | 'reports' | 'accounting' | 'googlesheets'>(() => {
    if (session?.role === 'admin') return 'reports';
    return 'entry';
  });

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [targetEmail, setTargetEmail] = useState<string>('Mm.moj9267@gmail.com');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState<boolean>(false);

  // Fetch reports safely with hybrid offline/online support
  const fetchReports = async () => {
    try {
      setIsSyncing(true);
      const result = await fetchAllReports();
      setReports(result.reports);
      setIsOnline(result.online);
      if (result.targetEmail) setTargetEmail(result.targetEmail);
      setFetchError(null);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      setFetchError(err.message || 'خطا در بارگذاری گزارشات');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Immediate background sync on app load so new devices get the latest registered users
    syncWithServer().catch(() => {});
    if (session) {
      fetchReports();
    }
  }, [session]);

  // Periodic background sync every 15 seconds + on window focus & online event
  useEffect(() => {
    if (!session) return;

    const runSync = async () => {
      try {
        setIsSyncing(true);
        const result = await fetchAllReports();
        setReports(result.reports);
        setIsOnline(result.online);
        if (result.targetEmail) setTargetEmail(result.targetEmail);
      } catch (err) {
        console.log('Background sync note:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    const interval = setInterval(runSync, 15000);
    window.addEventListener('focus', runSync);
    window.addEventListener('online', runSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', runSync);
      window.removeEventListener('online', runSync);
    };
  }, [session]);

  // Handle successful login
  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    // Directly direct role to the intended screen:
    if (newSession.role === 'admin') {
      setActiveTab('reports');
    } else {
      setActiveTab('entry');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('amouei_cabinet_session');
    setSession(null);
  };

  // Compute unique existing projects for auto-suggest in the form
  const existingProjects = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      r.items.forEach((it) => {
        if (it.projectName) set.add(it.projectName);
      });
    });
    return Array.from(set);
  }, [reports]);

  // Handle new report submission
  const handleReportSubmitted = (newReport: DailyReport) => {
    setReports((prev) => [newReport, ...prev]);

    // Check if user set a Google Sheet Webhook URL in localStorage to forward
    const webhookUrl = localStorage.getItem('google_sheet_webhook_url');
    if (webhookUrl) {
      try {
        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport),
        }).catch((e) => console.log('Webhook forward note:', e));
      } catch (e) {
        console.log('Webhook forward error:', e);
      }
    }
  };

  // Delete a report safely
  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReportById(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting report:', err);
    }
  };

  // Delete multiple reports (Management)
  const handleDeleteMultipleReports = async (ids: string[]) => {
    try {
      setIsSyncing(true);
      await deleteMultipleReports(ids);
      const idSet = new Set(ids);
      setReports((prev) => prev.filter((r) => !idSet.has(r.id)));
    } catch (err: any) {
      console.error('Error deleting multiple reports:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all reports (Management only - e.g. wiping test data before live operations)
  const handleClearAllReports = async () => {
    try {
      setIsSyncing(true);
      await clearAllReports();
      setReports([]);
    } catch (err: any) {
      console.error('Error clearing all reports:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // If not logged in, show the sleek AuthScreen
  if (!session) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} defaultRole={initialRole} />;
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col selection:bg-zinc-900 selection:text-white font-sans text-zinc-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportsCount={reports.length}
        session={session}
        onLogout={handleLogout}
        isHeaderHidden={isMobileHeaderHidden}
        onToggleHeader={() => setIsMobileHeaderHidden((prev) => !prev)}
        onRefresh={fetchReports}
        isSyncing={isSyncing}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-14">
        {isLoading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <div className="w-8 h-8 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-zinc-700">در حال دریافت اطلاعات سامانه عمویی...</p>
          </div>
        ) : (
          <>
            {fetchError && (
              <div className="max-w-5xl mx-auto px-4 mt-4">
                <div className="bg-zinc-200 border border-zinc-300 text-zinc-900 rounded-2xl p-3.5 text-xs flex items-center justify-between">
                  <span>اطلاعیه سیستم: {fetchError}</span>
                  <button
                    type="button"
                    onClick={fetchReports}
                    className="font-bold underline hover:text-black cursor-pointer"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'entry' && (
              <ProductionForm
                onReportSubmitted={handleReportSubmitted}
                existingProjects={existingProjects}
                isHeaderHidden={isMobileHeaderHidden}
                setIsHeaderHidden={setIsMobileHeaderHidden}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                reports={reports}
                onRefresh={fetchReports}
                onDeleteReport={handleDeleteReport}
                onDeleteMultipleReports={handleDeleteMultipleReports}
                onClearAllReports={handleClearAllReports}
                targetEmail={targetEmail}
                userRole={session.role}
              />
            )}

            {activeTab === 'accounting' && session.role === 'admin' && (
              <AccountingSummary reports={reports} />
            )}

            {activeTab === 'googlesheets' && session.role === 'admin' && (
              <GoogleSheetsIntegration targetEmail={targetEmail} />
            )}
          </>
        )}
      </main>

      {/* Bottom Footer - Dark theme with creator details */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-4 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">مجموعه دکوراسیون داخلی و کابینت عمویی</span>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="text-zinc-400">سامانه ثبت تولید کارگاه</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-zinc-500">تهیه کننده:</span>
              <strong className="text-white font-bold">محمدابراهیم محمدی</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">شماره تماس:</span>
              <a href="tel:09119995002" className="text-amber-400 font-mono font-bold hover:underline dir-ltr">
                ۰۹۱۱۹۹۹۵۰۰۲
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
