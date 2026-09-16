import React, { useState, useMemo } from 'react';
import { FileText, Copy, Check, Building2, Layers, Download, Calendar, ArrowRight } from 'lucide-react';
import { DailyReport, ProjectSummary } from '../types';
import { toPersianDigits } from '../utils/persianDate';

interface AccountingSummaryProps {
  reports: DailyReport[];
}

export const AccountingSummary: React.FC<AccountingSummaryProps> = ({ reports }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [copiedProject, setCopiedProject] = useState<string | null>(null);

  // Unique dates for filter
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.reportDate))).filter(Boolean).sort().reverse();
  }, [reports]);

  // Filter reports by date
  const filteredReports = useMemo(() => {
    if (!selectedDate) return reports;
    return reports.filter((r) => r.reportDate.includes(selectedDate));
  }, [reports, selectedDate]);

  // Aggregate by Project for Accounting
  const projectSummaries = useMemo<ProjectSummary[]>(() => {
    const map: Record<string, ProjectSummary> = {};

    filteredReports.forEach((rep) => {
      rep.items.forEach((item) => {
        const pName = item.projectName.trim();
        if (!map[pName]) {
          map[pName] = {
            projectName: pName,
            totalItemsCount: 0,
            materials: {},
            dates: [],
          };
        }

        map[pName].totalItemsCount += 1;

        if (!map[pName].materials[item.itemName]) {
          map[pName].materials[item.itemName] = { quantity: 0, unit: item.unit };
        }
        map[pName].materials[item.itemName].quantity += item.quantity;

        if (!map[pName].dates.includes(rep.reportDate)) {
          map[pName].dates.push(rep.reportDate);
        }
      });
    });

    return Object.values(map);
  }, [filteredReports]);

  // Copy accounting journal entry text
  const handleCopyJournalEntry = (project: ProjectSummary) => {
    const materialsLines = Object.entries(project.materials)
      .map(([mName, data]) => `  - ${mName}: ${data.quantity} ${data.unit}`)
      .join('\n');

    const text = `بابت مصرف مصالح در پروژه: ${project.projectName}
تاریخ: ${project.dates.join(', ')}
بد/ بهای تمام شده پروژه در جریان ساخت: ${project.projectName}
بس/ موجودی انبار مواد و مصالح مصرفی کارگاه
ریز اقلام مصرفی:
${materialsLines}`;

    navigator.clipboard.writeText(text);
    setCopiedProject(project.projectName);
    setTimeout(() => setCopiedProject(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Header (سفید مایل به مشکی) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-zinc-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-300 inline-block">
              اسناد بهای تمام شده پروژه‌ها
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-2 tracking-tight">
              تفکیک مصرف مصالح به تفکیک پروژه‌ها
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
              جهت صدور اسناد حسابداری انبار و پروژه‌های در جریان ساخت (بدهکار کردن پروژه و بستانکار کردن انبار مواد اولیه)
            </p>
          </div>

          {/* Date Filter for Accounting Period */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-zinc-50 border border-zinc-300 focus:border-zinc-900 rounded-xl px-3.5 py-2 text-xs font-bold outline-none transition cursor-pointer"
            >
              <option value="">نمایش همه روزها</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>
                  روز: {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {projectSummaries.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-zinc-200 shadow-sm">
          <p className="text-sm font-bold text-zinc-700">هیچ رکوردی برای محاسبه حسابداری یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projectSummaries.map((project, idx) => (
            <div
              key={project.projectName}
              className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs hover:border-zinc-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4 pb-3.5 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-900 text-base flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-zinc-700" />
                        {project.projectName}
                      </h3>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        تاریخ‌های مصرف: {project.dates.join('، ')}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs bg-zinc-100 text-zinc-900 font-bold px-2.5 py-1 rounded-lg border border-zinc-200">
                    {project.totalItemsCount} قلم مصالح
                  </span>
                </div>

                {/* Materials Breakdown */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-bold text-zinc-800">ریز اقلام و مقادیر مصرف شده:</div>
                  <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200 divide-y divide-zinc-200/80 text-xs">
                    {(Object.entries(project.materials) as [string, { quantity: number; unit: string }][]).map(([mName, data]) => (
                      <div key={mName} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                        <span className="text-zinc-800 font-medium">{mName}</span>
                        <span className="font-black text-zinc-900 bg-white px-2.5 py-0.5 rounded-md border border-zinc-300">
                          {toPersianDigits(data.quantity)} {data.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copy Button for Accounting Software */}
              <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  کپی فرمت استاندارد سند حسابداری
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyJournalEntry(project)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-98 ${
                    copiedProject === project.projectName
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-zinc-900 hover:bg-black text-white shadow-xs'
                  }`}
                >
                  {copiedProject === project.projectName ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      کپی شد!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      کپی شرح سند دوبل
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
