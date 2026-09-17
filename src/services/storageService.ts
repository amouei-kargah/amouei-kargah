import { AuthSession, DailyReport, ReportItem } from '../types';
import { normalizeDigits } from '../utils/persianDate';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

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

// Default seed users
const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: 'usr_seed_1',
    fullName: 'محمدابراهیم محمدی',
    phone: '09119995002',
    password: '1234',
    role: 'production',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'usr_seed_2',
    fullName: 'مهندس رضایی',
    phone: '09121234567',
    password: '1234',
    role: 'production',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'usr_seed_3',
    fullName: 'پرسنل و مدیر کارگاه تولید',
    phone: 'tolid',
    password: '1234',
    role: 'production',
    createdAt: '2026-09-15T12:00:00.000Z',
  },
];

// Error handling helper as required by Firebase specification
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -----------------------------------------------------------------------------
// LOCAL CACHE ACCESSORS
// -----------------------------------------------------------------------------

export function getLocalUsers(): StaffAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return DEFAULT_STAFF;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STAFF;
  } catch {
    return DEFAULT_STAFF;
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
// MULTI-TIER CLOUD SYNC ENGINE (FIRESTORE <-> SERVER API <-> CLIENT STORAGE)
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

  const reportsMap = new Map<string, DailyReport>();
  localReports.forEach((r) => reportsMap.set(r.id, r));
  if (extraReports) {
    extraReports.forEach((r) => reportsMap.set(r.id, r));
  }

  const usersMap = new Map<string, StaffAccount>();
  localUsers.forEach((u) => {
    const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
    usersMap.set(p, u);
  });
  if (extraUsers) {
    extraUsers.forEach((u) => {
      const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
      usersMap.set(p, u);
    });
  }

  let isOnline = false;
  let email = localStorage.getItem(TARGET_EMAIL_KEY) || 'Mm.moj9267@gmail.com';

  // 1. Fetch and Sync from Google Cloud Firestore (Primary Persistent Database)
  try {
    // Sync Users from Firestore
    const usersPath = 'users';
    try {
      const usersSnap = await getDocs(collection(db, usersPath));
      usersSnap.forEach((docSnap) => {
        const u = docSnap.data() as StaffAccount;
        if (u && u.phone) {
          const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
          usersMap.set(p, {
            ...u,
            phone: p,
          });
        }
      });
      isOnline = true;
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.LIST, usersPath);
      }
    }

    // Sync Reports from Firestore
    const reportsPath = 'reports';
    try {
      const reportsSnap = await getDocs(collection(db, reportsPath));
      reportsSnap.forEach((docSnap) => {
        const r = docSnap.data() as DailyReport;
        if (r && r.id && r.reportDate) {
          reportsMap.set(r.id, r);
        }
      });
      isOnline = true;
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        handleFirestoreError(e, OperationType.LIST, reportsPath);
      }
    }
  } catch (firestoreErr) {
    console.warn('Firestore sync note:', firestoreErr);
  }

  // 2. Secondary Sync with Express Server (for Email Notifications and Server Fallback)
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reports: Array.from(reportsMap.values()),
        users: Array.from(usersMap.values()),
      }),
    });

    if (res.ok) {
      isOnline = true;
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.reports)) {
          data.reports.forEach((r: DailyReport) => {
            if (r && r.id) reportsMap.set(r.id, r);
          });
        }
        if (Array.isArray(data.users)) {
          data.users.forEach((u: StaffAccount) => {
            if (u && u.phone) {
              const p = normalizeDigits(u.phone).replace(/[\s-]/g, '');
              usersMap.set(p, u);
            }
          });
        }
        if (data.targetEmail) {
          email = data.targetEmail;
          localStorage.setItem(TARGET_EMAIL_KEY, email);
        }
      }
    }
  } catch (serverErr) {
    // If Express API is temporarily unavailable, Firestore was already contacted
  }

  // Final consolidated state
  const mergedReports = Array.from(reportsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  saveLocalReports(mergedReports);

  const mergedUsers = Array.from(usersMap.values());
  saveLocalUsers(mergedUsers);
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

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

  const newAccount: StaffAccount = {
    id: `usr_${cleanPhone}`,
    fullName: cleanFullName,
    phone: cleanPhone,
    password: cleanPassword,
    role: 'production',
    createdAt: new Date().toISOString(),
  };

  // 1. Direct Persistent Write to Google Cloud Firestore
  try {
    const userDocRef = doc(db, 'users', cleanPhone);
    await setDoc(userDocRef, newAccount);
  } catch (fsErr: any) {
    console.warn('Firestore register write note:', fsErr);
    if (fsErr?.code === 'permission-denied') {
      handleFirestoreError(fsErr, OperationType.WRITE, `users/${cleanPhone}`);
    }
  }

  // 2. Also Post to Express Server API
  try {
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: cleanFullName,
        phone: cleanPhone,
        password: cleanPassword,
      }),
    });
  } catch (serverErr) {
    console.log('Server register note:', serverErr);
  }

  // 3. Cache in Local Storage
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
  const rawU = (params.username || '').toString().trim();
  const rawP = (params.password || '').toString().trim();

  const normU = normalizeDigits(rawU).toLowerCase().replace(/[\s-]/g, '');
  const normP = normalizeDigits(rawP).replace(/[\s-]/g, '');

  // 1. Management Check (Admin / Amouei)
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

  // 2. Query Google Cloud Firestore Directly for Registered Phone
  try {
    const userDocRef = doc(db, 'users', normU);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as StaffAccount;
      const storedPass = normalizeDigits(userData.password || '').replace(/[\s-]/g, '');
      if (storedPass === normP || userData.password === rawP) {
        // Cache locally for offline resilience
        saveLocalUser(userData);
        return {
          role: 'production',
          username: userData.phone,
          displayName: userData.fullName,
          phone: userData.phone,
        };
      } else {
        throw new Error('رمز عبور وارد شده نادرست است.');
      }
    }
  } catch (fsErr: any) {
    if (fsErr.message && fsErr.message.includes('رمز عبور')) {
      throw fsErr;
    }
    console.warn('Firestore login check note:', fsErr);
  }

  // 3. Try Express Server API Login
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normU, password: normP }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success) {
        saveLocalUser({
          id: `usr_${normU}`,
          fullName: data.displayName || 'پرسنل کارگاه',
          phone: data.phone || normU,
          password: normP,
          role: 'production',
          createdAt: new Date().toISOString(),
        });
        return {
          role: data.role,
          username: data.username,
          displayName: data.displayName,
          phone: data.phone,
        };
      }
    }
  } catch (serverErr) {
    // Offline or server rebooting
  }

  // 4. Check Local Device Cache
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

  // 5. Default Demo / Seed Accounts
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
// REPORTS STORAGE (FIRESTORE + EMAIL DISPATCH + CACHE)
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

  // 1. Immediately Save to Local Cache (Offline guarantee)
  const current = getLocalReports();
  const updated = [newReport, ...current.filter((r) => r.id !== newReport.id)];
  saveLocalReports(updated);

  // 2. Direct Persistent Write to Google Cloud Firestore
  try {
    const reportDocRef = doc(db, 'reports', newReport.id);
    await setDoc(reportDocRef, newReport);
  } catch (fsErr: any) {
    console.warn('Firestore report write note:', fsErr);
    if (fsErr?.code === 'permission-denied') {
      handleFirestoreError(fsErr, OperationType.WRITE, `reports/${newReport.id}`);
    }
  }

  // 3. Post to Express Server to Trigger Email Dispatch
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newReport.id,
        managerName: newReport.managerName,
        managerPhone: newReport.managerPhone,
        reportDate: newReport.reportDate,
        notes: newReport.notes,
        items: newReport.items,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.report?.emailStatus) {
        newReport.emailStatus = data.report.emailStatus;
        const finalLocal = [newReport, ...current.filter((r) => r.id !== newReport.id)];
        saveLocalReports(finalLocal);
      }
    }
  } catch (serverErr) {
    console.log('Server dispatch note:', serverErr);
  }

  // 4. Background Sync
  syncWithServer([], [newReport]).catch((e) => console.log('Post-submit sync note:', e));

  return newReport;
}

export async function deleteReportById(id: string): Promise<void> {
  // 1. Delete from Local Cache
  const current = getLocalReports();
  const updated = current.filter((r) => r.id !== id);
  saveLocalReports(updated);

  // 2. Delete from Google Cloud Firestore
  try {
    const reportDocRef = doc(db, 'reports', id);
    await deleteDoc(reportDocRef);
  } catch (fsErr: any) {
    console.warn('Firestore delete note:', fsErr);
    if (fsErr?.code === 'permission-denied') {
      handleFirestoreError(fsErr, OperationType.DELETE, `reports/${id}`);
    }
  }

  // 3. Delete from Express Server
  try {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  } catch {
    // Handled
  }
}

export async function deleteMultipleReports(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const idSet = new Set(ids);

  // 1. Local cache update
  const current = getLocalReports();
  const updated = current.filter((r) => !idSet.has(r.id));
  saveLocalReports(updated);

  // 2. Delete from Firestore
  try {
    const promises = ids.map((id) => deleteDoc(doc(db, 'reports', id)));
    await Promise.all(promises);
  } catch (fsErr: any) {
    console.warn('Firestore bulk delete note:', fsErr);
  }

  // 3. Delete from Express Server
  try {
    await fetch('/api/reports/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  } catch {
    // Handled
  }
}

export async function clearAllReports(): Promise<void> {
  // 1. Clear Local Cache
  saveLocalReports([]);

  // 2. Delete all from Google Cloud Firestore
  try {
    const reportsSnap = await getDocs(collection(db, 'reports'));
    const deletePromises = reportsSnap.docs.map((docSnap) =>
      deleteDoc(doc(db, 'reports', docSnap.id))
    );
    await Promise.all(deletePromises);
  } catch (fsErr: any) {
    console.warn('Firestore clear all note:', fsErr);
    if (fsErr?.code === 'permission-denied') {
      handleFirestoreError(fsErr, OperationType.DELETE, 'reports');
    }
  }

  // 3. Delete from Express Server
  try {
    await fetch('/api/reports', { method: 'DELETE' });
  } catch {
    // Handled
  }
}
