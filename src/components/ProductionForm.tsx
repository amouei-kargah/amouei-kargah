import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Send, CheckCircle2, AlertCircle, Sparkles, 
  Building2, Package, Calendar, User, Phone, FileText, Check,
  Eye, EyeOff, Smartphone
} from 'lucide-react';
import { ReportItem, CABINET_MATERIALS_SUGGESTIONS, CABINET_UNITS, DailyReport } from '../types';
import { getTodayJalaliString } from '../utils/persianDate';
import { submitDailyReport } from '../services/storageService';

interface ProductionFormProps {
  onReportSubmitted: (newReport: DailyReport) => void;
  existingProjects: string[];
  isHeaderHidden?: boolean;
  setIsHeaderHidden?: (hidden: boolean) => void;
}

export const ProductionForm: React.FC<ProductionFormProps> = ({
  onReportSubmitted,
  existingProjects,
  isHeaderHidden = false,
  setIsHeaderHidden,
}) => {
  // Banner collapse state for maximum viewport on mobile
  const [isBannerCollapsed, setIsBannerCollapsed] = useState<boolean>(false);

  // Focus handler to automatically hide the top black banner and header when typing (especially on mobile)
  const handleItemInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (window.innerWidth < 1024) {
      setIsBannerCollapsed(true);
      if (setIsHeaderHidden) {
        setIsHeaderHidden(true);
      }
    }
  };
  // 1. Manager Name (remembers from localStorage for convenience)
  const [managerName, setManagerName] = useState<string>(() => {
    return localStorage.getItem('amouei_manager_name') || '';
  });

  // 2. Manager Phone Number (MANDATORY - remembers from localStorage)
  const [managerPhone, setManagerPhone] = useState<string>(() => {
    return localStorage.getItem('amouei_manager_phone') || '';
  });

  // 3. Manual Date (user types manually as requested, with today's suggestion)
  const [reportDate, setReportDate] = useState<string>(() => {
    return getTodayJalaliString();
  });

  // General workshop notes
  const [notes, setNotes] = useState<string>('');

  // 4. Material Rows (multiple rows with mandatory project name)
  const [items, setItems] = useState<ReportItem[]>([
    {
      id: `item_${Date.now()}_1`,
      itemName: '',
      quantity: 1,
      unit: 'ورق',
      projectName: '',
      notes: '',
    },
  ]);

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<DailyReport | null>(null);

  // Save manager name & phone for subsequent visits
  useEffect(() => {
    if (managerName.trim()) {
      localStorage.setItem('amouei_manager_name', managerName.trim());
    }
  }, [managerName]);

  useEffect(() => {
    if (managerPhone.trim()) {
      localStorage.setItem('amouei_manager_phone', managerPhone.trim());
    }
  }, [managerPhone]);

  // Add a new row for multiple materials
  const handleAddItem = () => {
    const lastProject = items.length > 0 ? items[items.length - 1].projectName : '';
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length + 1}`,
        itemName: '',
        quantity: 1,
        unit: 'عدد',
        projectName: lastProject,
        notes: '',
      },
    ]);
  };

  // Remove a row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('حداقل باید یک ردیف کالا در فرم ثبت وجود داشته باشد.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update field in an item row
  const handleUpdateItem = (index: number, field: keyof ReportItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Manager Name
    if (!managerName.trim()) {
      setErrorMessage('لطفاً «نام و نام خانوادگی مدیر تولید» را وارد نمایید.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validation 2: Manager Phone (MANDATORY)
    const cleanPhone = managerPhone.trim();
    if (!cleanPhone) {
      setErrorMessage('وارد کردن «شماره موبایل مدیر تولید» الزامی است.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('لطفاً شماره موبایل معتبر مدیر تولید را به طور کامل وارد نمایید (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validation 3: Date
    if (!reportDate.trim()) {
      setErrorMessage('لطفاً «تاریخ گزارش» را به صورت دستی وارد نمایید.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validation 4: Items validation with MANDATORY project name check
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName.trim()) {
        setErrorMessage(`ردیف ${i + 1}: لطفاً نام کالا یا مصالح مصرفی را مشخص کنید.`);
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        setErrorMessage(`ردیف ${i + 1}: مقدار مصرفی برای «${it.itemName}» باید عددی بیشتر از صفر باشد.`);
        return;
      }
      if (!it.projectName.trim()) {
        setErrorMessage(
          `ردیف ${i + 1}: وارد کردن «نام پروژه» کاملاً اجباری است! لطفاً مشخص کنید کالای «${it.itemName}» برای کدام پروژه مصرف شده است.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const savedReport = await submitDailyReport({
        managerName: managerName.trim(),
        managerPhone: cleanPhone,
        reportDate: reportDate.trim(),
        notes: notes.trim(),
        items: items.map((it) => ({
          ...it,
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unit: it.unit.trim(),
          projectName: it.projectName.trim(),
          notes: it.notes?.trim() || '',
        })),
      });

      setSuccessReport(savedReport);
      onReportSubmitted(savedReport);

      // Reset items for next entry but keep manager name, phone, and date
      setItems([
        {
          id: `item_${Date.now()}_new`,
          itemName: '',
          quantity: 1,
          unit: 'ورق',
          projectName: '',
          notes: '',
        },
      ]);
      setNotes('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطای غیرمنتظره در ارسال اطلاعات به سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Top Banner with Collapsible View for Mobile */}
      {isBannerCollapsed ? (
        <div className="bg-zinc-950 text-white rounded-2xl p-3 sm:p-4 mb-5 shadow-lg border border-zinc-800 flex items-center justify-between gap-3 text-xs transition-all animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <span className="font-black text-sm text-white truncate">
              گزارش تولید روزانه مجموعه دکوراسیون داخلی و کابینت عمویی
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsBannerCollapsed(false);
              if (setIsHeaderHidden) setIsHeaderHidden(false);
            }}
            className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 cursor-pointer shrink-0 transition active:scale-95"
            title="نمایش مجدد سربرگ و جزئیات"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>نمایش کادر بالا</span>
          </button>
        </div>
      ) : (
        /* Full Top Banner with Hide Button */
        <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-zinc-800 relative overflow-hidden transition-all">
          {/* Subtle decorative grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800/90 text-zinc-300 border border-zinc-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>سامانه ثبت تولید کارگاه</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBannerCollapsed(true);
                    if (setIsHeaderHidden) setIsHeaderHidden(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-amber-400 hover:text-amber-300 border border-zinc-700 cursor-pointer transition active:scale-95"
                  title="مخفی‌سازی موقت جهت باز شدن فضای تایپ در گوشی"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>مخفی‌سازی کادر بالا (دید بهتر در گوشی)</span>
                </button>
              </div>

              {/* EXACT USER-REQUESTED TITLE */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                گزارش تولید روزانه مجموعه دکوراسیون داخلی و کابینت عمویی
              </h1>

              <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                مدیر و پرسنل محترم کارگاه؛ لطفاً مصالح و اقلام مصرفی شیفت کاری را با درج دقیق شماره موبایل و نام اجباری هر پروژه ثبت نمایید.
              </p>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 shrink-0 self-start md:self-auto">
              <div className="text-zinc-400 mb-1 font-medium">گیرنده مستقیم اعلان و حسابداری:</div>
              <div className="font-mono text-white font-bold dir-ltr text-sm">Mm.moj9267@gmail.com</div>
              <div className="text-emerald-400 mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                اتصال آنلاین فعال
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successReport && (
        <div className="bg-white border-2 border-emerald-600 rounded-2xl p-5 mb-6 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-zinc-900 text-lg">
                گزارش روزانه با موفقیت در سامانه ذخیره شد!
              </h3>
              <p className="text-zinc-600 text-sm mt-1">
                تعداد <strong>{successReport.items.length} قلم کالا</strong> به تاریخ{' '}
                <strong className="text-zinc-900">{successReport.reportDate}</strong> توسط{' '}
                <strong>{successReport.managerName}</strong> (شماره تماس: <span dir="ltr">{successReport.managerPhone}</span>) ثبت گردید.
              </p>
              <div className="mt-3 p-3 bg-zinc-50 rounded-xl text-xs text-zinc-800 border border-zinc-200 flex items-center justify-between flex-wrap gap-2">
                <span>
                  📩 وضعیت ارسال ایمیل به <strong>{successReport.emailStatus?.recipient || 'Mm.moj9267@gmail.com'}</strong>:
                </span>
                <span className="bg-zinc-900 text-white px-2.5 py-1 rounded-lg font-bold">
                  {successReport.emailStatus?.message || 'ارسال اعلان انجام شد'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessReport(null)}
              className="text-zinc-400 hover:text-zinc-700 font-bold text-sm px-2 py-1 rounded-md hover:bg-zinc-100 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 mb-6 text-rose-900 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Production Entry Form (سفید مایل به مشکی) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Header Details (Manager Name, Phone & Manual Date) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200">
          <h3 className="text-base font-black text-zinc-900 mb-5 pb-3 border-b border-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-800" />
            اطلاعات مدیر تولید و تاریخ گزارش
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Manager Name */}
            <div>
              <label htmlFor="manager-name" className="block text-xs font-bold text-zinc-800 mb-1.5">
                نام و نام خانوادگی مدیر تولید <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="manager-name"
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="مثال: مهندس رضایی"
                  className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm transition outline-none"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                نام در حافظه مرورگر سیستم ذخیره می‌ماند.
              </p>
            </div>

            {/* Manager Phone (MANDATORY AS REQUESTED) */}
            <div>
              <label htmlFor="manager-phone" className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center justify-between">
                <span>شماره موبایل مدیر تولید <span className="text-rose-600 font-black">* (الزامی)</span></span>
              </label>
              <div className="relative">
                <input
                  id="manager-phone"
                  type="tel"
                  required
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="مثال: 09121234567"
                  className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm font-mono dir-ltr text-right transition outline-none"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                جهت هماهنگی‌های کارگاهی و ارتباط فوری الزامی است.
              </p>
            </div>

            {/* Manual Date Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="report-date" className="block text-xs font-bold text-zinc-800">
                  تاریخ گزارش (دستی) <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setReportDate(getTodayJalaliString())}
                  className="text-[11px] text-zinc-600 hover:text-zinc-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3 h-3" /> تاریخ امروز
                </button>
              </div>
              <input
                id="report-date"
                type="text"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="1403/06/26"
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm font-mono dir-ltr text-right transition outline-none"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                ورود تاریخ به صورت دستی آزاد است.
              </p>
            </div>

          </div>

          {/* Optional Shift Notes */}
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <label htmlFor="general-notes" className="block text-xs font-bold text-zinc-700 mb-1.5">
              یادداشت یا توضیحات کلی شیفت کارگاه (اختیاری):
            </label>
            <input
              id="general-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: برش‌کاری یونیت‌های آشپزخانه پروژه نیاوران به پایان رسید..."
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-zinc-800 transition outline-none"
            />
          </div>
        </div>

        {/* Section 2: Consumed Materials & Mandatory Project Name Rows */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200">
          
          {/* Mobile Comfort Bar: Quick Toggle to Hide/Show Top Banners */}
          <div className="bg-zinc-100 border border-zinc-300/90 rounded-2xl p-3 mb-5 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-800 font-bold">
              <Smartphone className="w-4 h-4 text-zinc-700 shrink-0" />
              <span>دید باز در گوشی (مخفی‌سازی کادرهای بالا هنگام نوشتن نام کالا):</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !isBannerCollapsed;
                setIsBannerCollapsed(next);
                if (setIsHeaderHidden) setIsHeaderHidden(next);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-amber-400 hover:text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
            >
              {isBannerCollapsed ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>نمایش کادرهای بالای صفحه</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>مخفی‌سازی کادرهای بالا (دید کامل)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-5 border-b border-zinc-200 gap-2">
            <div>
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-800" />
                لیست اقلام و مصالح مصرفی کارگاه
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                برای هر ردیف، مشخص نمودن «نام پروژه» کاملاً <strong>اجباری</strong> می‌باشد.
              </p>
            </div>

            <div className="text-xs bg-zinc-100 text-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-300 font-bold self-start sm:self-auto">
              تعداد اقلام: <strong>{items.length}</strong> کالا
            </div>
          </div>

          {/* Rows List */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-zinc-50/80 border border-zinc-200 hover:border-zinc-400 rounded-2xl p-4 sm:p-5 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-200/80 text-xs">
                  <span className="font-bold text-zinc-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[11px] font-black">
                      {index + 1}
                    </span>
                    ردیف {index + 1}
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف این کالا
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  
                  {/* Item Name (5 cols) with Datalist for Cabinet suggestions */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      نام کالا / مواد مصرفی <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      list="cabinet-materials-list"
                      required
                      value={item.itemName}
                      onFocus={handleItemInputFocus}
                      onChange={(e) => handleUpdateItem(index, 'itemName', e.target.value)}
                      placeholder="مثال: ورق هایگلاس سفید، لولا آرام‌بند، چسب ۱۲۳..."
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2 text-zinc-900 text-sm outline-none transition"
                    />
                  </div>

                  {/* Quantity (2 cols) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      مقدار مصرفی <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      value={item.quantity}
                      onFocus={handleItemInputFocus}
                      onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3 py-2 text-zinc-900 text-sm font-bold text-center outline-none transition"
                    />
                  </div>

                  {/* Unit (2 cols) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      واحد سنجش
                    </label>
                    <select
                      value={item.unit}
                      onFocus={handleItemInputFocus}
                      onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-2.5 py-2 text-zinc-900 text-sm outline-none transition cursor-pointer"
                    >
                      {CABINET_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mandatory Project Name (3 cols) */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-700" />
                        نام پروژه <span className="text-rose-600 font-black text-xs">* (اجباری)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      list="existing-projects-list"
                      required
                      value={item.projectName}
                      onFocus={handleItemInputFocus}
                      onChange={(e) => handleUpdateItem(index, 'projectName', e.target.value)}
                      placeholder="مثال: کابینت مهندس عباسی"
                      className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm font-semibold outline-none transition ${
                        item.projectName.trim()
                          ? 'border-zinc-400 bg-white text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
                          : 'border-rose-400 bg-rose-50/20 text-zinc-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 placeholder:text-rose-300'
                      }`}
                    />
                  </div>

                </div>

                {/* Optional Item Specific Note */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500 whitespace-nowrap">توضیح فنی یا محل مصرف:</span>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onFocus={handleItemInputFocus}
                    onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                    placeholder="مثال: مربوط به باکس هود، بدنه کشوها، پشت‌بند کمد..."
                    className="w-full bg-transparent focus:bg-white border-0 focus:border focus:border-zinc-300 rounded-lg px-2 py-1 text-xs text-zinc-700 outline-none transition"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Datalists for fast autocomplete */}
          <datalist id="cabinet-materials-list">
            {CABINET_MATERIALS_SUGGESTIONS.map((mat) => (
              <option key={mat} value={mat} />
            ))}
          </datalist>

          <datalist id="existing-projects-list">
            {existingProjects.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          {/* Add Multiple Items Button */}
          <div className="mt-5 pt-3 flex items-center justify-between flex-wrap gap-3">
            <button
              id="btn-add-item"
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition border border-zinc-300 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-zinc-900" />
              افزودن ردیف کالای جدید (+ ردیف بعدی)
            </button>

            <span className="text-xs text-zinc-500">
              می‌توانید تمام اقلام مصرفی روزانه را در همین یک فرم ردیف به ردیف اضافه کنید.
            </span>
          </div>
        </div>

        {/* Section 3: Final Submit Button */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-xs text-zinc-600">
            <p className="font-bold text-zinc-900">
              با زدن دکمه ثبت گزارش:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-1 text-zinc-500">
              <li>گزارش در سرور ذخیره می‌شود و مدیریت در شهر دیگر فوراً آن را مشاهده می‌نماید.</li>
              <li>اعلان به ایمیل <strong>Mm.moj9267@gmail.com</strong> صادر می‌گردد.</li>
            </ul>
          </div>

          <button
            id="btn-submit-report"
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto min-w-[260px] px-8 py-3.5 rounded-2xl font-black text-white text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSubmitting
                ? 'bg-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 hover:bg-black active:scale-98 shadow-zinc-950/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ثبت اطلاعات...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 rotate-180" />
                <span>ثبت و ارسال گزارش روزانه کارگاه</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
