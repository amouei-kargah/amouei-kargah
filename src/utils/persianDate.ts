/**
 * Utility functions for Persian (Jalali / Solar Hijri) date formatting and calculations
 */

export function toPersianDigits(n: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

// Convert Gregorian date to Jalali date string (YYYY/MM/DD)
export function getTodayJalaliString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === 'year')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';

    // Convert Persian numbers back to English digits for standard input format (e.g. 1403/06/26)
    const toEnDigits = (str: string) =>
      str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));

    const y = toEnDigits(year);
    const m = toEnDigits(month).padStart(2, '0');
    const d = toEnDigits(day).padStart(2, '0');

    return `${y}/${m}/${d}`;
  } catch {
    return '1403/07/01';
  }
}

export function formatTimeFa(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function isValidJalaliDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const clean = dateStr.trim();
  // Expect format like 1403/06/26 or 1403-06-26
  return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(clean);
}
