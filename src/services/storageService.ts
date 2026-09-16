import { AuthSession, DailyReport, ReportItem } from '../types';

export interface StaffAccount {
  id: string;
  fullName: string;
  phone: string;
  password: string;
  role: 'production';
  createdAt: string;
}

const REGISTERED_USERS_KEY = 'amouei_registered_users';
const LOCAL_REPORTS_KEY = 'amouei_local_reports';

// Helper to safely parse JSON from a fetch response without crashing on HTML 404
async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// USER ACCOUNTS & AUTH
// -----------------------------------------------------------------------------

export function getLocalUsers(): StaffAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalUser(user: StaffAccount): void {
  try {
    const users = getLocalUsers();
    const cleanPhone = user.phone.replace(/[\s-]/g, '');
    const filtered = users.filter((u) => u.phone.replace(/[\s-]/g, '') !== cleanPhone);
    filtered.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
}

export async function registerUser(params: {
  fullName: string;
  phone: string;
  password: string;
}): Promise<AuthSession> {
  const cleanPhone = params.phone.trim().replace(/[\s-]/g, '');
  const cleanFullName = params.fullName.trim();
  const password = params.password.trim();

  // 1. First attempt to call the backend server API
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: cleanFullName,
        phone: cleanPhone,
        password,
      }),
    });

    const data = await safeJsonParse(res);

    if (res.ok && data?.success) {
      const session: AuthSession = {
        role: 'production',
        username: data.username || cleanPhone,
        displayName: data.displayName || cleanFullName,
        phone: data.phone || cleanPhone,
      };
      // Backup to localStorage
      saveLocalUser({
        id: `usr_${Date.now()}`,
        fullName: cleanFullName,
        phone: cleanPhone,
        password,
        role: 'production',
        createdAt: new Date().toISOString(),
      });
      return session;
    }

    // If server responded with a deliberate error (like phone already registered)
    if (!res.ok && data?.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    // If it was a deliberate error from the server (e.g. user already exists), rethrow
    if (err.message && !err.message.includes('Unexpected') && !err.message.includes('fetch')) {
      throw err;
    }
    // Otherwise it was a network error or 404 (Vercel static deploy), continue to local storage
  }

  // 2. Fallback / Client-side persistence for Vercel Static Deployments
  const localUsers = getLocalUsers();
  const existing = localUsers.find((u) => u.phone.replace(/[\s-]/g, '') === cleanPhone);
  if (existing) {
    throw new Error('این شماره موبایل قبلاً در سامانه ثبت‌نام شده است. لطفاً از تب «ورود با شماره موبایل» وارد شوید.');
  }

  const newAccount: StaffAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName: cleanFullName,
    phone: cleanPhone,
    password,
    role: 'production',
    createdAt: new Date().toISOString(),
  };

  saveLocalUser(newAccount);

  return {
    role: 'production',
    username: cleanPhone,
    displayName: cleanFullName,
    phone: cleanPhone,
  };
}

export async function loginUser(params: {
  username: string;
  password: string;
}): Promise<AuthSession> {
  const u = (params.username || '').toString().trim().toLowerCase().replace(/[\s-]/g, '');
  const p = (params.password || '').toString().trim();

  // 1. First attempt to call the backend server API
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });

    const data = await safeJsonParse(res);

    if (res.ok && data?.success) {
      return {
        role: data.role,
        username: data.username,
        displayName: data.displayName,
        phone: data.phone,
      };
    }

    if (!res.ok && data?.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Unexpected') && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // 2. Fallback / Client-side authentication for Vercel Static Deployments
  // Admin check (Management / Amouei)
  if (
    (u === 'admin' || u === 'amouei' || u === 'عمویی' || u === 'مدیریت') &&
    (p === '1234' || p === 'amouei1234' || p === 'admin')
  ) {
    return {
      role: 'admin',
      username: 'amouei',
      displayName: 'مدیریت مجموعه (آقای عمویی)',
    };
  }

  // Check locally registered accounts by phone number
  const localUsers = getLocalUsers();
  const matched = localUsers.find((user) => {
    const userPhone = user.phone.replace(/[\s-]/g, '');
    return userPhone === u || userPhone.endsWith(u);
  });

  if (matched && matched.password === p) {
    return {
      role: 'production',
      username: matched.phone,
      displayName: matched.fullName,
      phone: matched.phone,
    };
  }

  // Fallback demo/workshop manager account
  if (
    (u === 'tolid' || u === 'kargah' || u === 'پرسنل' || u === 'مدیر تولید' || u === 'user') &&
    (p === '1234' || p === 'tolid1234' || p === 'kargah')
  ) {
    return {
      role: 'production',
      username: 'tolid',
      displayName: 'پرسنل و مدیر کارگاه تولید',
    };
  }

  throw new Error('شماره موبایل یا رمز عبور نادرست است.');
}

// -----------------------------------------------------------------------------
// REPORTS STORAGE (HYBRID CLOUD + LOCAL CACHE)
// -----------------------------------------------------------------------------

export function getLocalReports(): DailyReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReports(reports: DailyReport[]): void {
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save reports in localStorage:', err);
  }
}

export async function fetchAllReports(): Promise<{ reports: DailyReport[]; targetEmail: string }> {
  const localReports = getLocalReports();
  let serverReports: DailyReport[] = [];
  let email = 'Mm.moj9267@gmail.com';

  try {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await safeJsonParse(res);
      if (data?.reports && Array.isArray(data.reports)) {
        serverReports = data.reports;
      }
      if (data?.targetEmail) {
        email = data.targetEmail;
      }
    }
  } catch {
    // If backend unavailable (e.g. Vercel static), ignore and use local
  }

  // Merge unique reports by ID
  const map = new Map<string, DailyReport>();
  serverReports.forEach((r) => map.set(r.id, r));
  localReports.forEach((r) => {
    if (!map.has(r.id)) {
      map.set(r.id, r);
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  saveLocalReports(merged);
  return { reports: merged, targetEmail: email };
}

export async function submitDailyReport(reportData: {
  managerName: string;
  managerPhone: string;
  reportDate: string;
  notes: string;
  items: ReportItem[];
}): Promise<DailyReport> {
  const newReport: DailyReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    managerName: reportData.managerName,
    managerPhone: reportData.managerPhone,
    reportDate: reportData.reportDate,
    notes: reportData.notes,
    items: reportData.items,
    createdAt: new Date().toISOString(),
  };

  // 1. Immediately store in local cache so user never loses their data!
  const current = getLocalReports();
  const updated = [newReport, ...current];
  saveLocalReports(updated);

  // 2. Synchronize to server if available
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (res.ok) {
      const data = await safeJsonParse(res);
      if (data?.report) {
        return data.report;
      }
    }
  } catch {
    // Network or static deploy, locally saved report is already safe
  }

  return newReport;
}

export async function deleteReportById(id: string): Promise<void> {
  const current = getLocalReports();
  const updated = current.filter((r) => r.id !== id);
  saveLocalReports(updated);

  try {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  } catch {
    // Local deletion was already completed
  }
}
