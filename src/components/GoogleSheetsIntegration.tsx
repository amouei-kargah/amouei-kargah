import React, { useState, useEffect } from 'react';
import { Copy, Check, FileSpreadsheet, Mail, ExternalLink, ShieldCheck, HelpCircle, Code } from 'lucide-react';

interface GoogleSheetsIntegrationProps {
  targetEmail: string;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({ targetEmail }) => {
  const [scriptCode, setScriptCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [googleWebhookUrl, setGoogleWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('google_sheet_webhook_url') || '';
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/google-apps-script')
      .then((res) => res.json())
      .then((data) => {
        if (data.script) setScriptCode(data.script.trim());
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('google_sheet_webhook_url', googleWebhookUrl.trim());
    setSaveStatus('آدرس وب‌هوک با موفقیت در مرورگر شما ذخیره شد.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-900">
              اتصال دائمی به گوگل شیت و گوگل فرم (بدون نیاز به واسطه)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              شما می‌توانید از همین برنامه تحت وب مستقیماً استفاده کنید (مدیر کارگاه لینک را باز کرده و ثبت کند)، یا این اسکریپت را داخل یک فایل Google Sheets قرار دهید تا همزمان در گوگل شیت آنلاین شما ذخیره شده و اعلان‌ها به <strong>{targetEmail}</strong> ارسال گردد و دیگر به هیچ ابزار یا شخصی وابسته نباشید.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-6">
        <h3 className="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          راهنمای ۳ مرحله‌ای راه‌اندازی در Google Sheets:
        </h3>

        <div className="space-y-4 text-xs sm:text-sm text-stone-700">
          <div className="flex items-start gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              ۱
            </span>
            <div>
              <strong className="text-stone-900 block font-bold mb-0.5">
                ساخت فایل جدید در Google Sheets:
              </strong>
              وارد گوگل شیت (sheets.google.com) با اکانت خود شوید و یک فایل خالی با نام «گزارش تولید کارگاه کابینت» بسازید.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              ۲
            </span>
            <div>
              <strong className="text-stone-900 block font-bold mb-0.5">
                ورود به بخش Apps Script:
              </strong>
              از منوی بالای گوگل شیت، روی <strong>Extensions</strong> (افزونه‌ها) و سپس <strong>Apps Script</strong> کلیک کنید. صفحه ویرایشگر کد باز می‌شود.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              ۳
            </span>
            <div>
              <strong className="text-stone-900 block font-bold mb-0.5">
                پیست کردن کد زیر و ذخیره:
              </strong>
              کدهای پیش‌فرض را کاملاً پاک کنید. دکمه آبی «کپی تمام کدهای اسکریپت» در باکس پایین را بزنید و در آنجا Paste نمایید. سپس دکمه Save (آیکون فلاپی دیسک) را بزنید و یکبار تابع <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-emerald-800">setupSheet</code> را Run کنید تا ستون‌ها مرتب شوند.
            </div>
          </div>
        </div>
      </div>

      {/* Script Code Box */}
      <div className="bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-800 text-stone-200 mb-6">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-stone-100">
              کد آماده Google Apps Script (متصل به ایمیل {targetEmail})
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                کپی شد!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                کپی تمام کدهای اسکریپت
              </>
            )}
          </button>
        </div>

        <pre className="text-xs font-mono text-stone-300 bg-stone-950 p-4 rounded-xl overflow-x-auto max-h-96 leading-relaxed dir-ltr text-left">
          {scriptCode || '// در حال بارگذاری اسکریپت...'}
        </pre>
      </div>

      {/* Optional Webhook Forwarding */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-2">
          ارسال خودکار همزمان به گوگل شیت شما (اختیاری):
        </h3>
        <p className="text-xs text-stone-600 mb-4 leading-relaxed">
          اگر اسکریپت فوق را در گوگل شیت به‌صورت Web App مستقر (Deploy) کنید، یک آدرس URL به شما می‌دهد. با قرار دادن آن در کادر زیر، هر بار که مدیر کارگاه در این برنامه فرم را ثبت کند، علاوه بر دیتابیس برنامه و ایمیل، یک سطر خودکار به گوگل شیت شخصی شما نیز افزوده می‌شود:
        </p>

        <form onSubmit={handleSaveWebhook} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="url"
            value={googleWebhookUrl}
            onChange={(e) => setGoogleWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-mono dir-ltr outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            ذخیره آدرس وب‌هوک
          </button>
        </form>

        {saveStatus && (
          <p className="text-xs text-emerald-700 font-bold mt-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {saveStatus}
          </p>
        )}
      </div>

    </div>
  );
};
