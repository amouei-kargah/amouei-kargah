import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Wrench, ChevronLeft, Sparkles, Building, Phone } from 'lucide-react';
import { AuthSession, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  defaultRole?: UserRole;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, defaultRole = 'production' }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [username, setUsername] = useState<string>(defaultRole === 'admin' ? 'amouei' : 'tolid');
  const [password, setPassword] = useState<string>('1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setUsername('amouei');
      setPassword('1234');
    } else {
      setUsername('tolid');
      setPassword('1234');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'نام کاربری یا رمز عبور نادرست است.');
      }

      const session: AuthSession = {
        role: data.role,
        username: data.username,
        displayName: data.displayName,
      };

      localStorage.setItem('amouei_cabinet_session', JSON.stringify(session));
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'خطا در احراز هویت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-6 text-zinc-100 selection:bg-zinc-700 selection:text-white relative overflow-hidden">
      
      {/* Background Architectural Accent lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 text-white shadow-xl mb-3 text-2xl font-black">
            🪵
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            مجموعه دکوراسیون داخلی و کابینت عمویی
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 font-medium">
            سامانه یکپارچه ورود پرسنل کارگاه و مدیریت
          </p>
        </div>

        {/* Auth Card (سفید مایل به مشکی) */}
        <div className="bg-white text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-8">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl mb-6 border border-zinc-200">
            <button
              type="button"
              onClick={() => handleRoleSelect('production')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'production'
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>پرسنل کارگاه تولید</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>مدیریت (آقای عمویی)</span>
            </button>
          </div>

          {/* Role Description Notice */}
          <div className="mb-5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
            {selectedRole === 'production' ? (
              <p>
                <strong>دسترسی پرسنل تولید:</strong> ورود به فرم ثبت اقلام و مصالح مصرفی روزانه کارگاه کابینت‌سازی با الزام شماره تماس و نام پروژه.
              </p>
            ) : (
              <p>
                <strong>دسترسی مدیریت (آقای عمویی):</strong> ورود مستقیم به میز کار گزارشات، فیلتر تاریخ روزانه، اسناد حسابداری و دانلود فایل اکسل.
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'amouei' : 'tolid'}
                  className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-sm font-black shadow-lg shadow-zinc-950/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {selectedRole === 'admin' ? 'ورود مستقیم به گزارشات مدیریت' : 'ورود به فرم ثبت تولید'}
                  </span>
                  <ChevronLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hints for Convenience */}
          <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-xs text-zinc-500">
            <div className="font-semibold text-zinc-700 mb-1">اطلاعات ورود پیش‌فرض:</div>
            <div className="flex justify-center items-center gap-3 font-mono text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
              <span>نام کاربری: <strong>{selectedRole === 'admin' ? 'amouei' : 'tolid'}</strong></span>
              <span>•</span>
              <span>رمز عبور: <strong>1234</strong></span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-500 mt-6">
          کلیه گزارشات با ارسال فوری به <strong>Mm.moj9267@gmail.com</strong> متصل می‌باشند.
        </p>

      </div>
    </div>
  );
};
