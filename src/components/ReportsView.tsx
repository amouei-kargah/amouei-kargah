import React, { useState, useMemo } from 'react';
import { 
  Download, Filter, Search, Calendar, RefreshCw, 
  Trash2, Mail, ExternalLink, Printer, Building2, 
  PackageCheck, Layers, Eye, CheckCircle2, AlertTriangle, ArrowUpDown, Phone
} from 'lucide-react';
import { DailyReport } from '../types';
import { toPersianDigits, formatTimeFa } from '../utils/persianDate';

interface ReportsViewProps {
  reports: DailyReport[];
  onRefresh: () => void;
  onDeleteReport: (id: string) => void;
  targetEmail: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  onRefresh,
  onDeleteReport,
  targetEmail,
}) => {
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Extract unique dates and projects
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(reports.map((r) => r.reportDate))).filter(Boolean);
    return dates.sort().reverse();
  }, [reports]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    reports.forEach((r) => {
      r.items.forEach((item) => {
        if (item.projectName) projects.add(item.projectName);
      });
    });
    return Array.from(projects).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Date match
      if (selectedDate && !report.reportDate.includes(selectedDate)) {
        return false;
      }
      // Project match
      if (selectedProject) {
        const hasProject = report.items.some((it) =>
          it.projectName.toLowerCase().includes(selectedProject.toLowerCase())
        );
        if (!hasProject) return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesManager = report.managerName.toLowerCase().includes(q) || (report.managerPhone && report.managerPhone.includes(q));
        const matchesDate = report.reportDate.includes(q);
        const matchesNotes = report.notes?.toLowerCase().includes(q);
        const matchesItem = report.items.some(
          (it) =>
            it.itemName.toLowerCase().includes(q) ||
            it.projectName.toLowerCase().includes(q) ||
            it.notes?.toLowerCase().includes(q)
        );
        if (!matchesManager && !matchesDate && !matchesNotes && !matchesItem) {
          return false;
        }
      }
      return true;
    });
  }, [reports, selectedDate, selectedProject, searchQuery]);

  // Quick statistics
  const totalItemsCount = useMemo(() => {
    return filteredReports.reduce((sum, r) => sum + r.items.length, 0);
  }, [filteredReports]);

  // Handle Excel download
  const handleDownloadExcel = () => {
    const params = new URLSearchParams();
    if (selectedDate) params.append('date', selectedDate);
    if (selectedProject) params.append('project', selectedProject);
    window.location.href = `/api/reports/excel?${params.toString()}`;
  };

  // Print current view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Top Banner (سفید مایل به مشکی) for Remote Owner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-300 inline-block">
              میز کار مدیریت مجموعه (آقای عمویی)
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">
              گزارشات روزانه و اسناد مصرف کارگاه
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
              مشاهده آنلاین مصرف روزانه کارگاه برای ثبت اسناد حسابداری، بررسی موجودی انبار و دریافت مستقیم فایل اکسل
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer border border-zinc-300"
              title="بروزرسانی اطلاعات"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer border border-zinc-300"
              title="چاپ گزارش"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600" />
              چاپ برگه
            </button>

            <button
              id="btn-download-excel"
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black bg-zinc-950 hover:bg-black text-white shadow-lg shadow-zinc-950/20 transition active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              دریافت فایل اکسل (.xlsx)
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-700" />
              تعداد گزارشات ثبت شده
            </div>
            <div className="text-xl font-black text-zinc-900 mt-1">
              {toPersianDigits(filteredReports.length)} <span className="text-xs font-medium text-zinc-500">گزارش</span>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-700" />
              تعداد ردیف کالاهای مصرفی
            </div>
            <div className="text-xl font-black text-zinc-900 mt-1">
              {toPersianDigits(totalItemsCount)} <span className="text-xs font-medium text-zinc-500">قلم کالا</span>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-700" />
              پروژه‌های فعال در کارگاه
            </div>
            <div className="text-xl font-black text-zinc-900 mt-1">
              {toPersianDigits(uniqueProjects.length)} <span className="text-xs font-medium text-zinc-500">پروژه</span>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-700" />
              ایمیل متصل
            </div>
            <div className="text-xs font-mono font-bold text-zinc-900 mt-2 truncate dir-ltr" title={targetEmail}>
              {targetEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar: Date & Project & Search */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 mb-6">
        <div className="text-xs font-bold text-zinc-800 mb-3 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-zinc-700" />
          فیلترهای هوشمند استخراج اسناد حسابداری:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* 1. Date Filter */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              فیلتر تاریخ روزانه:
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="مثال: 1403/06/25 یا تایپ تاریخ"
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs font-mono outline-none transition"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 rounded-xl text-xs font-bold text-zinc-800 cursor-pointer"
                  title="پاک کردن فیلتر تاریخ"
                >
                  ✕
                </button>
              )}
            </div>
            {uniqueDates.length > 0 && (
              <div className="flex gap-1 overflow-x-auto mt-1.5 pb-1">
                {uniqueDates.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono transition whitespace-nowrap cursor-pointer ${
                      selectedDate === d
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Project Filter */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              فیلتر بر اساس نام پروژه:
            </label>
            <div className="flex gap-1.5">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs outline-none transition cursor-pointer"
              >
                <option value="">همه پروژه‌ها</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {selectedProject && (
                <button
                  type="button"
                  onClick={() => setSelectedProject('')}
                  className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 rounded-xl text-xs font-bold text-zinc-800 cursor-pointer"
                  title="پاک کردن فیلتر پروژه"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Global Search */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              جستجوی آزاد (نام کالا، مدیر، شماره تماس):
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تایپ عبارت برای جستجو..."
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl pr-3 pl-8 py-2 text-xs outline-none transition"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Active Filters Tag Bar */}
        {(selectedDate || selectedProject || searchQuery) && (
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">فیلترهای فعال:</span>
              {selectedDate && (
                <span className="bg-zinc-100 text-zinc-900 border border-zinc-300 px-2 py-0.5 rounded-lg font-mono text-xs">
                  تاریخ: {selectedDate}
                </span>
              )}
              {selectedProject && (
                <span className="bg-zinc-100 text-zinc-900 border border-zinc-300 px-2 py-0.5 rounded-lg text-xs">
                  پروژه: {selectedProject}
                </span>
              )}
              {searchQuery && (
                <span className="bg-zinc-100 text-zinc-900 border border-zinc-300 px-2 py-0.5 rounded-lg text-xs">
                  جستجو: {searchQuery}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setSelectedProject('');
                setSearchQuery('');
              }}
              className="text-zinc-900 hover:text-black font-bold hover:underline cursor-pointer"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        )}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-sm">
          <PackageCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">گزارشی با این مشخصات یافت نشد</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            می‌توانید فیلترها را تغییر دهید یا به بخش «فرم ثبت تولید» بروید و گزارش جدید ثبت نمایید.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-zinc-200 hover:border-zinc-400 transition-all shadow-xs overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50/60 border-b border-zinc-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      📅
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-zinc-900 text-base">
                          {report.reportDate}
                        </span>
                        <span className="text-xs bg-zinc-200 text-zinc-800 font-bold px-2.5 py-0.5 rounded-lg">
                          مدیر: {report.managerName}
                        </span>
                        {report.managerPhone && (
                          <a
                            href={`tel:${report.managerPhone}`}
                            className="text-xs font-mono text-zinc-800 bg-white border border-zinc-300 px-2 py-0.5 rounded-lg flex items-center gap-1 dir-ltr hover:bg-zinc-100 transition"
                            title="تماس با مدیر تولید"
                          >
                            <Phone className="w-3 h-3 text-zinc-500" />
                            {report.managerPhone}
                          </a>
                        )}
                        <span className="text-xs bg-zinc-100 text-zinc-900 font-black px-2 py-0.5 rounded-lg border border-zinc-200">
                          {report.items.length} قلم کالا
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>زمان ثبت: {formatTimeFa(report.createdAt)}</span>
                        {report.notes && (
                          <span className="text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded truncate max-w-xs">
                            توضیح: {report.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {report.emailStatus && (
                      <span
                        className="text-[11px] bg-zinc-100 text-zinc-800 border border-zinc-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                        title={`اعلان به ${report.emailStatus.recipient} ارسال شده است.`}
                      >
                        <Mail className="w-3 h-3 text-zinc-600" />
                        اعلان ایمیل ارسال شد
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition cursor-pointer flex items-center gap-1 border border-zinc-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isExpanded ? 'بستن جزئیات' : 'مشاهده اقلام'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`آیا از حذف گزارش تاریخ ${report.reportDate} اطمینان دارید؟`)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="حذف این گزارش"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                <div className={`transition-all ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-100/70 text-zinc-700 border-b border-zinc-200">
                          <th className="py-2.5 px-4 font-bold text-center w-12">#</th>
                          <th className="py-2.5 px-4 font-bold">نام کالا / مواد مصرفی</th>
                          <th className="py-2.5 px-4 font-bold text-center">مقدار مصرف</th>
                          <th className="py-2.5 px-4 font-bold text-center">واحد</th>
                          <th className="py-2.5 px-4 font-bold text-zinc-900">نام پروژه (اجباری)</th>
                          <th className="py-2.5 px-4 font-bold text-zinc-500">یادداشت فنی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {report.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-2.5 px-4 text-center font-mono text-zinc-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-zinc-900">
                              {item.itemName}
                            </td>
                            <td className="py-2.5 px-4 text-center font-black text-zinc-900 font-mono text-sm">
                              {toPersianDigits(item.quantity)}
                            </td>
                            <td className="py-2.5 px-4 text-center text-zinc-600">
                              {item.unit}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                                {item.projectName}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-zinc-500">
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
