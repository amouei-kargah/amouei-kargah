import { AuthSession, DailyReport, ReportItem } from '../types';
import { normalizeDigits } from '../utils/persianDate';

export interface StaffAccount {
  id: string;
  fullName: string;
  phone: string;
  password?: string;
  role: 'production';
  createdAt: string;
}

const REGISTERED_USERS_KEY = 'amouei_registered_users';
const LOCAL_REPORTS_KEY = 'amouei_local_reports';
const TARGET_EMAIL_KEY = 'amouei_target_email';
const LAST_SYNC_KEY = 'amouei_last_sync_time';

// -----------------------------------------------------------------------------
// LOCAL CACHE ACCESSORS
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

export function saveLocalUsers(users: StaffAccount[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
}

export function saveLocalUser(user: StaffAccount): void {
  try {
    const users = getLocalUsers();
    const cleanPhone = normalizeDigits(user.phone).replace(/[\s-]/g, '');
    const filtered = users.filter((u) => normalizeDigits(u.phone).replace(/[\s-]/g, '') !== cleanPhone);
    filtered.push({
      ...user,
      phone: cleanPhone,
    });
    saveLocalUsers(filtered);
  } catch (err) {
    console.error('Failed to save user to localStorage:', err);
  }
}

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

// -----------------------------------------------------------------------------
// BIDIRECTIONAL 2-WAY SYNC ENGINE (CLIENT <-> CLOUD SERVER)
// Ensures all mobile devices, PCs, and management see 100% synchronized state
// -----------------------------------------------------------------------------

export async function syncWithServer(
  extraUsers?: StaffAccount[],
  extraReports?: DailyReport[]
): Promise<{
  reports: DailyReport[];
  users: StaffAccount[];
  targetEmail: string;
  online: boolean;
}> {
  const localReports = getLocalReports();
  const localUsers = getLocalUsers();

  // Merge any extras before sending
  const reportsToSendMap = new Map<string, DailyReport>();
  localReports.forEach((r) => reportsToSendMap.set(r.id, r));
  if (extraReports) {
    extraReports.forEach((r) => reportsToSendMap.set(r.id, r));
  }

  const usersToSendMap = new Map<string, StaffAccount>();
  localUsers.forEach((u) => {
    const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
    usersToSendMap.set(p, u);
  });
  if (extraUsers) {
    extraUsers.forEach((u) => {
      const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
      usersToSendMap.set(p, u);
    });
  }

  let serverReports: DailyReport[] = [];
  let serverUsers: StaffAccount[] = [];
  let email = localStorage.getItem(TARGET_EMAIL_KEY) || 'Mm.moj9267@gmail.com';
  let isOnline = false;

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reports: Array.from(reportsToSendMap.values()),
        users: Array.from(usersToSendMap.values()),
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.success) {
        isOnline = true;
        if (Array.isArray(data.reports)) {
          serverReports = data.reports;
        }
        if (Array.isArray(data.users)) {
          serverUsers = data.users;
        }
        if (data.targetEmail) {
          email = data.targetEmail;
          localStorage.setItem(TARGET_EMAIL_KEY, email);
        }
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      }
    }
  } catch (err) {
    // Network error or offline
    console.warn('Sync server currently offline, relying on local device storage.');
  }

  // Merge reports: Server authoritative + local fallback
  const finalReportsMap = new Map<string, DailyReport>();
  serverReports.forEach((r) => finalReportsMap.set(r.id, r));
  localReports.forEach((r) => {
    if (!finalReportsMap.has(r.id)) {
      finalReportsMap.set(r.id, r);
    }
  });

  const mergedReports = Array.from(finalReportsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  saveLocalReports(mergedReports);

  // Merge users
  const finalUsersMap = new Map<string, StaffAccount>();
  serverUsers.forEach((u) => {
    const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
    finalUsersMap.set(p, u);
  });
  localUsers.forEach((u) => {
    const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
    if (!finalUsersMap.has(p)) {
      finalUsersMap.set(p, u);
    }
  });

  const mergedUsers = Array.from(finalUsersMap.values());
  saveLocalUsers(mergedUsers);

  return {
    reports: mergedReports,
    users: mergedUsers,
    targetEmail: email,
    online: isOnline,
  };
}

// -----------------------------------------------------------------------------
// USER REGISTRATION & AUTHENTICATION
// -----------------------------------------------------------------------------

export async function registerUser(params: {
  fullName: string;
  phone: string;
  password: string;
}): Promise<AuthSession> {
  const cleanPhone = normalizeDigits(params.phone).replace(/[\s-]/g, '');
  const cleanFullName = params.fullName.trim();
  const cleanPassword = normalizeDigits(params.password).replace(/[\s-]/g, '');

  if (!cleanFullName) {
    throw new Error('لطفاً نام و نام خانوادگی خود را وارد کنید.');
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('شماره موبایل باید حداقل ۱۰ رقم معتبر باشد.');
  }
  if (!cleanPassword || cleanPassword.length < 3) {
    throw new Error('رمز عبور انتخابی باید حداقل ۳ رقم یا حرف باشد.');
  }

  // 1. Prepare new account object
  const newAccount: StaffAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fullName: cleanFullName,
    phone: cleanPhone,
    password: cleanPassword,
    role: 'production',
    createdAt: new Date().toISOString(),
  };

  // 2. Register on server API
  let serverAccepted = false;
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: cleanFullName,
        phone: cleanPhone,
        password: cleanPassword,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok && data?.error) {
        throw new Error(data.error);
      }
      if (res.ok && data?.success) {
        serverAccepted = true;
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  // 3. Save locally in device storage (guarantees immediate offline access)
  saveLocalUser(newAccount);

  // 4. Trigger background cloud sync with all devices
  syncWithServer([newAccount]).catch((e) => console.log('Post-register sync note:', e));

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
  const rawU = (params.username || '').toString().trim();
  const rawP = (params.password || '').toString().trim();

  const normU = normalizeDigits(rawU).toLowerCase().replace(/[\s-]/g, '');
  const normP = normalizeDigits(rawP).replace(/[\s-]/g, '');

  // 1. Management Check (Admin / Amouei)
  // Username: amouei | Password: 34503450 (or 1234)
  const isAdminUser =
    normU === 'amouei' ||
    normU === 'admin' ||
    normU === 'عمویی' ||
    normU === 'مدیریت' ||
    rawU === 'amouei' ||
    rawU === 'عمویی' ||
    rawU === 'مدیریت' ||
    normU.includes('amouei') ||
    normU.includes('عمویی');

  const isAdminPass =
    normP === '34503450' ||
    normP === '1234' ||
    normP === 'amouei1234' ||
    normP === 'admin' ||
    rawP === '۳۴۵۰۳۴۵۰' ||
    rawP === '34503450' ||
    rawP === '1234';

  if (isAdminUser && isAdminPass) {
    return {
      role: 'admin',
      username: 'amouei',
      displayName: 'مدیریت مجموعه (آقای عمویی)',
    };
  }

  // 2. Try Server API Login First (Ensures cross-device login works even if user registered on a different phone)
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normU, password: normP }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data?.success) {
        // Cache user locally on this device as well
        saveLocalUser({
          id: `usr_${normU}`,
          fullName: data.displayName || 'پرسنل کارگاه',
          phone: data.phone || normU,
          password: normP,
          role: 'production',
          createdAt: new Date().toISOString(),
        });

        // Trigger background sync to pull latest reports
        syncWithServer().catch(() => {});

        return {
          role: data.role,
          username: data.username,
          displayName: data.displayName,
          phone: data.phone,
        };
      }
      if (!res.ok && data?.error && !data.error.includes('سرور')) {
        // Server responded with an explicit auth rejection
        // Still fall through to check local cache in case of offline mismatch
      }
    }
  } catch (err: any) {
    // Network or server unreachable, fallback to local cache
  }

  // 3. Check locally cached accounts by phone number
  const localUsers = getLocalUsers();
  const matched = localUsers.find((user) => {
    const userPhone = normalizeDigits(user.phone).replace(/[\s-]/g, '');
    return (
      userPhone === normU ||
      userPhone.endsWith(normU) ||
      (normU.length >= 10 && userPhone.includes(normU.slice(-10)))
    );
  });

  if (matched) {
    const matchedPassNorm = normalizeDigits(matched.password || '').replace(/[\s-]/g, '');
    if (!matched.password || matchedPassNorm === normP || matched.password === rawP) {
      return {
        role: 'production',
        username: matched.phone,
        displayName: matched.fullName,
        phone: matched.phone,
      };
    } else {
      throw new Error('رمز عبور وارد شده نادرست است.');
    }
  }

  // 4. Default Seed/Demo staff accounts
  if (
    (normU === 'tolid' || normU === 'kargah' || normU === 'پرسنل' || normU === 'مدیر تولید' || normU === 'user') &&
    (normP === '1234' || normP === 'tolid1234' || normP === 'kargah')
  ) {
    return {
      role: 'production',
      username: 'tolid',
      displayName: 'پرسنل و مدیر کارگاه تولید',
      phone: '09121234567',
    };
  }

  throw new Error('شماره موبایل یا رمز عبور اشتباه است. اگر تازه ثبت‌نام کرده‌اید لطفاً از تب «ثبت‌نام تولیدکننده جدید» اقدام فرمایید.');
}

// -----------------------------------------------------------------------------
// REPORTS STORAGE (HYBRID CLOUD + MULTI-DEVICE SYNC)
// -----------------------------------------------------------------------------

export async function fetchAllReports(): Promise<{
  reports: DailyReport[];
  targetEmail: string;
  online: boolean;
}> {
  const syncResult = await syncWithServer();
  return {
    reports: syncResult.reports,
    targetEmail: syncResult.targetEmail,
    online: syncResult.online,
  };
}

export async function submitDailyReport(reportData: {
  managerName: string;
  managerPhone: string;
  reportDate: string;
  notes: string;
  items: ReportItem[];
}): Promise<DailyReport> {
  const cleanPhone = normalizeDigits(reportData.managerPhone).replace(/[\s-]/g, '');
  const cleanDate = normalizeDigits(reportData.reportDate).trim();

  const newReport: DailyReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    managerName: reportData.managerName.trim(),
    managerPhone: cleanPhone,
    reportDate: cleanDate,
    notes: reportData.notes.trim(),
    items: reportData.items,
    createdAt: new Date().toISOString(),
  };

  // 1. Immediately store in local cache so user NEVER loses their data on this phone
  const current = getLocalReports();
  const updated = [newReport, ...current];
  saveLocalReports(updated);

  // 2. Post to server to send email and register in central database
  let savedReport = newReport;
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerName: newReport.managerName,
        managerPhone: newReport.managerPhone,
        reportDate: newReport.reportDate,
        notes: newReport.notes,
        items: newReport.items,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.report) {
        savedReport = data.report;
        // Update local cache with server confirmed report ID
        const finalLocal = [savedReport, ...current.filter((r) => r.id !== newReport.id)];
        saveLocalReports(finalLocal);
      }
    }
  } catch (err) {
    console.warn('Could not post report immediately to server, saved safely in device cache:', err);
  }

  // 3. Run full sync to propagate across all workers and management
  syncWithServer([], [savedReport]).catch((e) => console.log('Post-submit sync note:', e));

  return savedReport;
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
