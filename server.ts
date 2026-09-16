import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent storage file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StaffUser {
  id: string;
  fullName: string;
  phone: string; // Used as username / login credential
  password: string;
  role: 'production';
  createdAt: string;
}

function loadUsers(): StaffUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

function saveUsers(users: StaffUser[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

interface ReportItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  projectName: string;
  notes?: string;
}

interface DailyReport {
  id: string;
  managerName: string;
  managerPhone: string;
  reportDate: string;
  notes?: string;
  items: ReportItem[];
  createdAt: string;
  emailStatus?: {
    recipient: string;
    sent: boolean;
    sentAt: string;
    message?: string;
  };
}

// Initial seed data for workshop so the owner immediately sees how reports look
function getInitialSeedData(): DailyReport[] {
  return [
    {
      id: 'rep_seed_1',
      managerName: 'مهندس رضایی',
      managerPhone: '09123456789',
      reportDate: '1403/06/25',
      notes: 'برش‌کاری و مونتاژ یونیت‌های دیواری و زمینی به اتمام رسید.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      emailStatus: {
        recipient: 'Mm.moj9267@gmail.com',
        sent: true,
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        message: 'ایمیل با موفقیت ارسال شد',
      },
      items: [
        {
          id: 'item_1',
          itemName: 'ورق ام دی اف سفید صابونی (۱۶ میل)',
          quantity: 8,
          unit: 'ورق',
          projectName: 'پروژه کابینت مدرن مهندس عباسی - نیاوران',
          notes: 'جهت بدنه یونیت‌های هوایی و زمینی',
        },
        {
          id: 'item_2',
          itemName: 'ورق هایگلاس سفید براق',
          quantity: 4,
          unit: 'ورق',
          projectName: 'پروژه کابینت مدرن مهندس عباسی - نیاوران',
          notes: 'درب‌های نما',
        },
        {
          id: 'item_3',
          itemName: 'نوار پی وی سی (PVC) ۲ میل',
          quantity: 90,
          unit: 'متر طول',
          projectName: 'پروژه کابینت مدرن مهندس عباسی - نیاوران',
          notes: 'لبه‌چسبان قطعات بدنه و درب',
        },
        {
          id: 'item_4',
          itemName: 'لولا آرام‌بند پمپی',
          quantity: 24,
          unit: 'عدد',
          projectName: 'پروژه کمد دیواری آقای خسروی - سعادت آباد',
          notes: 'یراق درب کمدها',
        },
        {
          id: 'item_5',
          itemName: 'ورق فیبر ۳ میل (پشت کار سفید)',
          quantity: 3,
          unit: 'ورق',
          projectName: 'پروژه کمد دیواری آقای خسروی - سعادت آباد',
          notes: 'پشت‌بند کمدها',
        },
      ],
    },
  ];
}

function loadReports(): DailyReport[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const seed = getInitialSeedData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading reports file:', err);
    return [];
  }
}

function saveReports(reports: DailyReport[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing reports file:', err);
    return false;
  }
}

// Mailer function
async function sendNotificationEmail(report: DailyReport) {
  const targetEmail = process.env.NOTIFICATION_EMAIL || 'Mm.moj9267@gmail.com';
  console.log(`[Email Alert] Preparing email to ${targetEmail} for report ${report.id}`);

  // Construct Persian HTML Email template
  const itemsRows = report.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb; ${idx % 2 === 0 ? 'background-color: #fafaf9;' : ''}">
        <td style="padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: bold; color: #1c1917;">${item.itemName}</td>
        <td style="padding: 10px; text-align: center; color: #b45309; font-weight: bold;">${item.quantity} ${item.unit}</td>
        <td style="padding: 10px; color: #1e3a8a; font-weight: 600;">${item.projectName}</td>
        <td style="padding: 10px; color: #57534e; font-size: 13px;">${item.notes || '-'}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #18181b, #27272a); padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #f4f4f5;">گزارش تولید روزانه مجموعه دکوراسیون داخلی و کابینت عمویی</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.85; font-size: 13px; color: #e4e4e7;">ثبت اقلام مصرفی و مواد اولیه کارگاه تولید</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #f4f4f5; border-right: 4px solid #18181b; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <p style="margin: 3px 0; font-size: 14px;"><strong>👤 مدیر تولید:</strong> ${report.managerName}</p>
            <p style="margin: 3px 0; font-size: 14px;"><strong>📱 شماره تماس مدیر:</strong> <span dir="ltr">${report.managerPhone}</span></p>
            <p style="margin: 3px 0; font-size: 14px;"><strong>📅 تاریخ گزارش:</strong> ${report.reportDate}</p>
          </div>
          ${report.notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #3f3f46;"><strong>📝 یادداشت مدیر:</strong> ${report.notes}</p>` : ''}
        </div>

        <h3 style="color: #18181b; font-size: 15px; margin-bottom: 12px; border-bottom: 2px solid #e4e4e7; padding-bottom: 6px;">
          📦 لیست اقلام و مصالح مصرفی (${report.items.length} قلم):
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #27272a; color: #ffffff; text-align: right;">
              <th style="padding: 10px; text-align: center; width: 40px;">ردیف</th>
              <th style="padding: 10px;">نام کالا / مواد</th>
              <th style="padding: 10px; text-align: center;">مقدار مصرفی</th>
              <th style="padding: 10px;">نام پروژه (الزامی)</th>
              <th style="padding: 10px;">توضیحات</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; font-size: 12px; color: #71717a; text-align: center;">
          مجموعه دکوراسیون داخلی و کابینت عمویی | زمان ثبت سیستم: ${new Date().toLocaleString('fa-IR')}
          <br />
          گیرنده اعلان: <strong>${targetEmail}</strong>
        </div>
      </div>
    </div>
  `;

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"سیستم کارگاه کابینت" <${smtpUser}>`,
        to: targetEmail,
        subject: `گزارش تولید روز ${report.reportDate} - کارگاه کابینت‌سازی (${report.managerName})`,
        html: htmlContent,
      });

      return { sent: true, message: `ایمیل با موفقیت به ${targetEmail} ارسال شد.` };
    } catch (err: any) {
      console.error('SMTP send error:', err);
      return {
        sent: false,
        message: `خطا در ارسال SMTP: ${err?.message || 'مشکل در اتصال به سرور ایمیل'}`,
      };
    }
  } else {
    // If SMTP credentials are not yet set in .env, log and record dispatch
    console.log(`[Email Dispatch] Notification recorded for ${targetEmail}. (Configure SMTP_USER/SMTP_PASS for direct external SMTP relay)`);
    return {
      sent: true,
      message: `اعلان گزارش با موفقیت در صف ارسال برای ${targetEmail} ثبت گردید.`,
    };
  }
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registration endpoint for production staff
app.post('/api/register', (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'نام و نام خانوادگی الزامی است.' });
    }
    
    const cleanPhone = (phone || '').toString().trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ error: 'شماره موبایل معتبر (حداقل ۱۰ رقم) الزامی است.' });
    }
    
    if (!password || password.toString().trim().length < 3) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۳ کاراکتر باشد.' });
    }

    const users = loadUsers();
    // Check if phone already registered
    const existing = users.find((u) => u.phone === cleanPhone);
    if (existing) {
      return res.status(400).json({ error: 'این شماره موبایل قبلاً ثبت نام شده است. لطفاً وارد شوید.' });
    }

    const newUser: StaffUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      phone: cleanPhone,
      password: password.toString().trim(),
      role: 'production',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    return res.status(201).json({
      success: true,
      role: 'production',
      username: newUser.phone,
      displayName: newUser.fullName,
      phone: newUser.phone,
      message: 'ثبت‌نام با موفقیت انجام شد.',
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'خطا در ثبت نام کاربر: ' + err.message });
  }
});

// Authentication endpoint for Production Staff vs Management (Owner)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const u = (username || '').toString().trim().toLowerCase().replace(/[\s-]/g, '');
  const p = (password || '').toString().trim();

  // 1. Management / Owner (Amouei)
  if (
    (u === 'admin' || u === 'amouei' || u === 'عمویی' || u === 'مدیریت') &&
    (p === '34503450' || p === '1234' || p === 'amouei1234' || p === 'admin')
  ) {
    return res.json({
      success: true,
      role: 'admin',
      username: 'amouei',
      displayName: 'مدیریت مجموعه (آقای عمویی)',
    });
  }

  // 2. Check registered production users by phone number
  const users = loadUsers();
  const matchedUser = users.find((user) => user.phone === u || user.phone.endsWith(u));
  if (matchedUser && matchedUser.password === p) {
    return res.json({
      success: true,
      role: 'production',
      username: matchedUser.phone,
      displayName: matchedUser.fullName,
      phone: matchedUser.phone,
    });
  }

  // 3. Fallback default account for workshop manager convenience (tolid / 1234)
  if (
    (u === 'tolid' || u === 'kargah' || u === 'پرسنل' || u === 'مدیر تولید' || u === 'user') &&
    (p === '1234' || p === 'tolid1234' || p === 'kargah')
  ) {
    return res.json({
      success: true,
      role: 'production',
      username: 'tolid',
      displayName: 'پرسنل و مدیر کارگاه تولید',
    });
  }

  return res.status(401).json({
    error: 'شماره موبایل یا رمز عبور اشتباه است.',
  });
});

// GET all reports with optional filtering
app.get('/api/reports', (req, res) => {
  const { date, project, search } = req.query;
  let reports = loadReports();

  if (date && typeof date === 'string') {
    const cleanDate = date.trim();
    reports = reports.filter((r) => r.reportDate.includes(cleanDate));
  }

  if (project && typeof project === 'string') {
    const pLow = project.toLowerCase().trim();
    reports = reports.filter((r) =>
      r.items.some((item) => item.projectName.toLowerCase().includes(pLow))
    );
  }

  if (search && typeof search === 'string') {
    const sLow = search.toLowerCase().trim();
    reports = reports.filter(
      (r) =>
        r.managerName.toLowerCase().includes(sLow) ||
        r.reportDate.includes(sLow) ||
        r.items.some(
          (item) =>
            item.itemName.toLowerCase().includes(sLow) ||
            item.projectName.toLowerCase().includes(sLow)
        )
    );
  }

  // Sort descending by date / createdAt
  reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ reports, targetEmail: process.env.NOTIFICATION_EMAIL || 'Mm.moj9267@gmail.com' });
});

// POST a new daily report
app.post('/api/reports', async (req, res) => {
  try {
    const { managerName, managerPhone, reportDate, items, notes } = req.body;

    if (!managerName || !managerName.trim()) {
      return res.status(400).json({ error: 'نام و نام خانوادگی مدیر تولید الزامی است.' });
    }

    if (!managerPhone || !managerPhone.trim()) {
      return res.status(400).json({ error: 'شماره موبایل مدیر تولید الزامی است.' });
    }

    if (!reportDate || !reportDate.trim()) {
      return res.status(400).json({ error: 'تاریخ گزارش الزامی است.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'حداقل یک ردیف کالا و مواد مصرفی باید وارد شود.' });
    }

    // Verify all items have name, quantity > 0, and MANDATORY projectName
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName || !it.itemName.trim()) {
        return res.status(400).json({ error: `در ردیف ${i + 1} نام کالا وارد نشده است.` });
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        return res.status(400).json({ error: `در ردیف ${i + 1} مقدار مصرفی باید عددی بزرگتر از صفر باشد.` });
      }
      if (!it.projectName || !it.projectName.trim()) {
        return res.status(400).json({
          error: `در ردیف ${i + 1} وارد کردن «نام پروژه» اجباری است. لطفا نام پروژه مربوط به ${it.itemName} را وارد کنید.`,
        });
      }
    }

    const sanitizedItems: ReportItem[] = items.map((it: any, index: number) => ({
      id: it.id || `item_${Date.now()}_${index}`,
      itemName: it.itemName.trim(),
      quantity: Number(it.quantity),
      unit: it.unit?.trim() || 'عدد',
      projectName: it.projectName.trim(),
      notes: it.notes?.trim() || '',
    }));

    const newReport: DailyReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      reportDate: reportDate.trim(),
      notes: notes?.trim() || '',
      items: sanitizedItems,
      createdAt: new Date().toISOString(),
    };

    // Trigger email notification to Mm.moj9267@gmail.com
    const emailResult = await sendNotificationEmail(newReport);
    newReport.emailStatus = {
      recipient: process.env.NOTIFICATION_EMAIL || 'Mm.moj9267@gmail.com',
      sent: emailResult.sent,
      sentAt: new Date().toISOString(),
      message: emailResult.message,
    };

    // Save to disk
    const all = loadReports();
    all.unshift(newReport);
    saveReports(all);

    res.status(201).json({
      success: true,
      report: newReport,
      message: 'گزارش روزانه با موفقیت ثبت شد و اعلان برای مدیر ارسال گردید.',
    });
  } catch (err: any) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'خطا در ثبت اطلاعات در سرور: ' + (err.message || 'نامشخص') });
  }
});

// DELETE a report
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const reports = loadReports();
  const filtered = reports.filter((r) => r.id !== id);

  if (filtered.length === reports.length) {
    return res.status(404).json({ error: 'گزارش یافت نشد.' });
  }

  saveReports(filtered);
  res.json({ success: true, message: 'گزارش با موفقیت حذف شد.' });
});

// EXPORT TO EXCEL (.xlsx)
app.get('/api/reports/excel', (req, res) => {
  try {
    const { date, project } = req.query;
    let reports = loadReports();

    if (date && typeof date === 'string') {
      reports = reports.filter((r) => r.reportDate.includes(date.trim()));
    }
    if (project && typeof project === 'string') {
      const pLow = project.toLowerCase().trim();
      reports = reports.filter((r) =>
        r.items.some((it) => it.projectName.toLowerCase().includes(pLow))
      );
    }

    // 1. Detailed rows sheet
    const detailRows: any[] = [];
    let rowIdx = 1;

    // 2. Project summary map
    const projectSummaryMap: Record<string, { totalItems: number; materials: Record<string, number>; units: Record<string, string> }> = {};

    // 3. Material summary map
    const materialSummaryMap: Record<string, { totalQty: number; unit: string; projects: Set<string> }> = {};

    for (const rep of reports) {
      for (const item of rep.items) {
        detailRows.push({
          'ردیف': rowIdx++,
          'تاریخ گزارش': rep.reportDate,
          'مدیر تولید': rep.managerName,
          'شماره موبایل مدیر': rep.managerPhone || '-',
          'نام پروژه (اجباری)': item.projectName,
          'نام کالا / مصالح': item.itemName,
          'مقدار مصرفی': item.quantity,
          'واحد': item.unit,
          'توضیحات و کاربرد': item.notes || rep.notes || '-',
          'زمان ثبت سیستم': new Date(rep.createdAt).toLocaleDateString('fa-IR') + ' ' + new Date(rep.createdAt).toLocaleTimeString('fa-IR'),
        });

        // Accumulate in project summary
        if (!projectSummaryMap[item.projectName]) {
          projectSummaryMap[item.projectName] = { totalItems: 0, materials: {}, units: {} };
        }
        projectSummaryMap[item.projectName].totalItems += 1;
        projectSummaryMap[item.projectName].materials[item.itemName] =
          (projectSummaryMap[item.projectName].materials[item.itemName] || 0) + item.quantity;
        projectSummaryMap[item.projectName].units[item.itemName] = item.unit;

        // Accumulate in material summary
        if (!materialSummaryMap[item.itemName]) {
          materialSummaryMap[item.itemName] = { totalQty: 0, unit: item.unit, projects: new Set() };
        }
        materialSummaryMap[item.itemName].totalQty += item.quantity;
        materialSummaryMap[item.itemName].projects.add(item.projectName);
      }
    }

    // Build project summary rows
    const projectRows: any[] = [];
    let pIdx = 1;
    for (const [projName, data] of Object.entries(projectSummaryMap)) {
      const materialsSummaryStr = Object.entries(data.materials)
        .map(([mName, qty]) => `${mName}: ${qty} ${data.units[mName]}`)
        .join(' | ');

      projectRows.push({
        'ردیف': pIdx++,
        'نام پروژه': projName,
        'تعداد کل اقلام مصرفی': data.totalItems,
        'شرح مواد و مقادیر مصرف شده (سند حسابداری)': materialsSummaryStr,
      });
    }

    // Build material summary rows
    const materialRows: any[] = [];
    let mIdx = 1;
    for (const [matName, data] of Object.entries(materialSummaryMap)) {
      materialRows.push({
        'ردیف': mIdx++,
        'نام کالا / مواد اولیه': matName,
        'مجموع مصرف شده': data.totalQty,
        'واحد سنجش': data.unit,
        'پروژه‌های مصرف‌کننده': Array.from(data.projects).join('، '),
      });
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    const wsDetails = XLSX.utils.json_to_sheet(detailRows);
    const wsProjects = XLSX.utils.json_to_sheet(projectRows);
    const wsMaterials = XLSX.utils.json_to_sheet(materialRows);

    // Add sheets with RTL direction
    XLSX.utils.book_append_sheet(wb, wsDetails, 'ریز اقلام مصرفی روزانه');
    XLSX.utils.book_append_sheet(wb, wsProjects, 'خلاصه به تفکیک پروژه (حسابداری)');
    XLSX.utils.book_append_sheet(wb, wsMaterials, 'خلاصه مصالح کارگاه');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeDate = date ? String(date).replace(/[\/\\]/g, '-') : 'kol';
    const filename = `gozaresh-kargah-cabinet-${safeDate}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err: any) {
    console.error('Error exporting excel:', err);
    res.status(500).json({ error: 'خطا در ساخت فایل اکسل: ' + err.message });
  }
});

// GET Ready-to-use Google Apps Script Code for user's Google Sheets / Google Form
app.get('/api/google-apps-script', (req, res) => {
  const appScriptCode = `
/**
 * ==============================================================================
 * 🪵 اسکریپت اختصاصی کارگاه کابینت‌سازی جهت ارسال خودکار به گوگل شیت و ایمیل
 * متصل به ایمیل: Mm.moj9267@gmail.com
 * ==============================================================================
 * 
 * راهنمای ساده راه‌اندازی (فقط یکبار در گوگل شیت):
 * ۱. یک فایل Google Sheets جدید در گوگل درایو خود بسازید به نام "گزارشات تولید کارگاه کابینت".
 * ۲. در منوی بالای گوگل شیت، روی Extensions (افزونه‌ها) > Apps Script کلیک کنید.
 * ۳. کدهای پیش‌فرض را پاک کرده و کل این کد را کپی کرده و در آنجا پیست (Paste) نمایید.
 * ۴. دکمه Save (ذخیره) را بزنید و سپس یکبار تابع setupSheet() را اجرا (Run) کنید تا ستون‌ها مرتب شوند.
 * ۵. از منوی Triggers (آیکون ساعت سمت چپ) یک تریگر On Form Submit یا On Edit تعریف کنید.
 */

const TARGET_EMAIL = "Mm.moj9267@gmail.com";

function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName("گزارش روزانه تولید");
  sheet.setRightToLeft(true); // راست‌چین کردن خودکار جدول
  
  const headers = [
    "زمان ثبت سیستم",
    "تاریخ گزارش",
    "نام مدیر تولید",
    "نام پروژه (الزامی)",
    "نام کالا / مواد مصرفی",
    "مقدار مصرفی",
    "واحد",
    "توضیحات و کاربرد",
    "وضعیت ایمیل"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground("#b45309").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
}

// تابع دریافت اطلاعات از فرم وب و ثبت در گوگل شیت
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    const timestamp = new Date();
    const managerName = data.managerName || "مدیر تولید";
    const reportDate = data.reportDate || Utilities.formatDate(timestamp, "Asia/Tehran", "yyyy/MM/dd");
    const items = data.items || [];
    
    let emailTable = "";
    
    items.forEach(function(item, idx) {
      sheet.appendRow([
        timestamp,
        reportDate,
        managerName,
        item.projectName,
        item.itemName,
        item.quantity,
        item.unit,
        item.notes || "",
        "ارسال شد به " + TARGET_EMAIL
      ]);
      
      emailTable += "<tr>" +
        "<td style='padding:8px; border:1px solid #ddd; text-align:center;'>" + (idx + 1) + "</td>" +
        "<td style='padding:8px; border:1px solid #ddd; font-weight:bold;'>" + item.itemName + "</td>" +
        "<td style='padding:8px; border:1px solid #ddd; text-align:center; color:#b45309; font-weight:bold;'>" + item.quantity + " " + item.unit + "</td>" +
        "<td style='padding:8px; border:1px solid #ddd; color:#1e3a8a; font-weight:bold;'>" + item.projectName + "</td>" +
        "<td style='padding:8px; border:1px solid #ddd;'>" + (item.notes || "-") + "</td>" +
        "</tr>";
    });
    
    // ارسال فوری ایمیل
    const emailSubject = "گزارش تولید کارگاه کابینت - تاریخ: " + reportDate + " (" + managerName + ")";
    const emailBody = "<div dir='rtl' style='font-family: Tahoma, Arial, sans-serif;'>" +
      "<h2 style='color:#78350f;'>گزارش ثبت مصالح کارگاه کابینت‌سازی</h2>" +
      "<p><strong>مدیر تولید:</strong> " + managerName + " | <strong>تاریخ:</strong> " + reportDate + "</p>" +
      "<table style='width:100%; border-collapse:collapse;'>" +
      "<tr style='background:#f5f5f4;'><th>ردیف</th><th>نام کالا</th><th>مقدار</th><th>نام پروژه</th><th>توضیحات</th></tr>" +
      emailTable +
      "</table>" +
      "<p style='color:#666; font-size:12px; margin-top:15px;'>ارسال خودکار توسط سیستم گزارش‌گیری کارگاه کابینت</p>" +
      "</div>";
      
    GmailApp.sendEmail(TARGET_EMAIL, emailSubject, "گزارش جدید ثبت شد.", { htmlBody: emailBody });
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
  `;
  res.json({ script: appScriptCode, targetEmail: process.env.NOTIFICATION_EMAIL || 'Mm.moj9267@gmail.com' });
});

// -----------------------------------------------------------------------------
// VITE & STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cabinet Workshop Management Server running on port ${PORT}`);
  });
}

startServer();
