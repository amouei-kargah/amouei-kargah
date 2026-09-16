import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Wrench, ChevronLeft, Phone, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { AuthSession, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  defaultRole?: UserRole;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, defaultRole = 'production' }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register form state
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setSuccessMsg(null);
    if (role === 'admin') {
      setAuthMode('login');
      setUsername('');
      setPassword('');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'اطلاعات ورود نادرست است.');
      }

      const session: AuthSession = {
        role: data.role,
        username: data.username,
        displayName: data.displayName,
        phone: data.phone,
      };

      localStorage.setItem('amouei_cabinet_session', JSON.stringify(session));
      if (data.displayName && data.role === 'production') {
        localStorage.setItem('amouei_manager_name', data.displayName);
      }
      if (data.phone && data.role === 'production') {
        localStorage.setItem('amouei_manager_phone', data.phone);
      }

      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (cleanPhone.length < 10) {
      setError('شماره موبایل وارد شده باید حداقل ۱۰ رقم باشد.');
      return;
    }

    if (regPassword.length < 3) {
      setError('رمز عبور باید حداقل ۳ کاراکتر باشد.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('تکرار رمز عبور با رمز وارد شده مطابقت ندارد.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت‌نام');
      }

      const session: AuthSession = {
        role: 'production',
        username: data.username,
        displayName: data.displayName,
        phone: data.phone,
      };

      localStorage.setItem('amouei_cabinet_session', JSON.stringify(session));
      localStorage.setItem('amouei_manager_name', data.displayName);
      localStorage.setItem('amouei_manager_phone', data.phone);

      setSuccessMsg('ثبت‌نام شما با موفقیت انجام شد! در حال ورود به سیستم...');
      setTimeout(() => {
        onLoginSuccess(session);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'خطا در فرایند ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-4 sm:p-6 text-zinc-100 selection:bg-zinc-700 selection:text-white relative overflow-hidden">
      
      {/* Background Architectural Accent lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 text-white shadow-xl mb-3 text-2xl font-black">
            🪵
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            مجموعه دکوراسیون داخلی و کابینت عمویی
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 font-medium">
            سامانه یکپارچه پرسنل کارگاه و مدیریت
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 p-6 sm:p-8">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl mb-5 border border-zinc-200">
            <button
              id="role-btn-production"
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
              id="role-btn-admin"
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

          {/* Sub-Tabs: Login vs Register (Only for production staff) */}
          {selectedRole === 'production' && (
            <div className="flex border-b border-zinc-200 mb-5">
              <button
                id="tab-sub-login"
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'login'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ورود با شماره موبایل</span>
              </button>

              <button
                id="tab-sub-register"
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'register'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>ثبت‌نام تولیدکننده جدید</span>
              </button>
            </div>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: Registration for staff */}
          {selectedRole === 'production' && authMode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  نام و نام خانوادگی تولیدکننده / استادکار <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  شماره موبایل شما <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 09121234567"
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">شماره موبایل، شناسه ورود شما خواهد بود.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    رمز عبور انتخابی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="رمز دلخواه"
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    تکرار رمز عبور <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز"
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>تکمیل ثبت‌نام و ورود به سامانه</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORM: Login */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  {selectedRole === 'admin' ? 'نام کاربری مدیریت' : 'شماره موبایل ثبت‌شده'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === 'admin' ? 'نام کاربری مدیریت' : 'مثال: 09121234567'}
                    className="w-full bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 rounded-xl px-3.5 py-2.5 text-zinc-900 text-sm outline-none transition font-mono dir-ltr text-right"
                  />
                  {selectedRole === 'admin' ? (
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  ) : (
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  )}
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
                      {selectedRole === 'admin' ? 'ورود به پنل مدیریت' : 'ورود به فرم ثبت تولید'}
                    </span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Toggle to register link for staff */}
              {selectedRole === 'production' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-zinc-600 hover:text-zinc-950 font-bold underline cursor-pointer"
                  >
                    حساب کاربری ندارید؟ اینجا ثبت‌نام کنید
                  </button>
                </div>
              )}
            </form>
          )}

        </div>

      </div>

      {/* Requested Black Footer with creator details & phone */}
      <footer className="w-full max-w-2xl mx-auto py-4 px-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-300 relative z-10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-zinc-400">تهیه کننده:</span>
          <strong className="text-white font-bold text-sm">محمدابراهیم محمدی</strong>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">شماره تماس:</span>
          <a
            href="tel:09119995002"
            className="text-amber-400 hover:text-amber-300 font-mono font-black text-sm tracking-wider dir-ltr"
          >
            ۰۹۱۱۹۹۹۵۰۰۲
          </a>
        </div>
      </footer>

    </div>
  );
};
