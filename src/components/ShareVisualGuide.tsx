import React, { useState } from 'react';
import { HelpCircle, ExternalLink, Check, Copy, AlertTriangle, ArrowLeft } from 'lucide-react';
import step1Img from '../assets/images/step1_share_btn_1789573137194.jpg';
import step2Img from '../assets/images/step2_modal_dialog_1789573151779.jpg';

export const ShareVisualGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const sharedUrl = 'https://ais-pre-wkvurowkh45jveukbpbxav-129857776515.europe-west2.run.app';

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-zinc-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-zinc-950 mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>راهنمای رفع قطعی خطای ۴۰۳</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          آموزش تصویری دریافت لینک عمومی (بدون فیلتر و بدون خطای ۴۰۳)
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
          دقیقاً ۲ مرحله زیر را روی صفحه مرورگر خود انجام دهید تا لینک اختصاصی و باز برای پرسنل کارگاه فعال شود:
        </p>
      </div>

      {/* STEP 1 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-sm">
            ۱
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900">
              مرحله اول: کلیک روی دکمه Share در بالاترین قسمت مرورگر
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              به گوشه سمت راست بالای صفحه هوش مصنوعی (خارج از این پنجره) نگاه کنید:
            </p>
          </div>
        </div>

        {/* Visual 1 */}
        <div className="rounded-2xl overflow-hidden border border-zinc-300 shadow-sm bg-zinc-950 mb-4">
          <img
            src={step1Img}
            alt="مرحله اول: کلیک روی دکمه Share"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
          <strong className="text-zinc-900">توضیح:</strong> دکمه‌ای به نام <strong>Share</strong> (با آیکون اشتراک‌گذاری) در نوار بالایی مرورگر قرار دارد. روی آن کلیک نمایید.
        </div>
      </div>

      {/* STEP 2 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-sm">
            ۲
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900">
              مرحله دوم: زدن دکمه Publish یا Create Link یا Copy Link
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              یک پنجره کوچک باز می‌شود که تصویر آن را در زیر مشاهده می‌کنید:
            </p>
          </div>
        </div>

        {/* Visual 2 */}
        <div className="rounded-2xl overflow-hidden border border-zinc-300 shadow-sm bg-zinc-950 mb-4">
          <img
            src={step2Img}
            alt="مرحله دوم: زدن کلید انتشار یا کپی لینک"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
          <strong className="text-zinc-900">توضیح:</strong> در این پنجره، دکمه آبی‌رنگ یا مشکی <strong>Publish</strong> یا <strong>Create Link</strong> یا <strong>Copy link</strong> را بزنید. وقتی این کار را کردید، لینک کپی شده دیگر هیچ‌وقت برای کارگاه خطای ۴۰۳ نخواهد داد.
        </div>
      </div>

      {/* Current App Link with Quick Copy */}
      <div className="bg-zinc-900 text-white rounded-3xl p-6 border border-zinc-800 shadow-lg">
        <h4 className="text-sm font-bold text-zinc-200 mb-2">
          لینک اشتراک فعلی شما:
        </h4>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-zinc-300 dir-ltr text-right select-all break-all">
            {sharedUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'کپی شد!' : 'کپی لینک'}
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 mt-2.5">
          به محض اینکه در مرحله ۲ بالا روی Share زده باشید، این آدرس برای همه بدون نیاز به جیمیل باز خواهد شد.
        </p>
      </div>

    </div>
  );
};
