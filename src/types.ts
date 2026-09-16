export interface ReportItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  projectName: string;
  notes?: string;
}

export interface DailyReport {
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

export type UserRole = 'production' | 'admin';

export interface AuthSession {
  role: UserRole;
  username: string;
  displayName: string;
  token?: string;
}

export interface ProjectSummary {
  projectName: string;
  totalItemsCount: number;
  materials: { [itemName: string]: { quantity: number; unit: string } };
  dates: string[];
}

export interface MaterialSummary {
  itemName: string;
  totalQuantity: number;
  unit: string;
  projects: string[];
}

// Preset common materials in cabinet making workshop for quick auto-complete
export const CABINET_MATERIALS_SUGGESTIONS = [
  'ورق ام دی اف سفید صابونی (۱۶ میل)',
  'ورق ام دی اف رنگی / طرح چوب',
  'ورق هایگلاس سفید براق',
  'ورق هایگلاس اکلیلی / طرح دار',
  'ورق پی وی سی (PVC) ضد آب ۱۶ میل',
  'صفحه کابینت ۵ سانتی (شرکتی)',
  'صفحه کابینت ۳ سانتی',
  'ورق فیبر ۳ میل (پشت کار سفید)',
  'ورق فیبر ۳ میل (رنگی / طرح دار)',
  'نوار پی وی سی (PVC) ۲ میل',
  'نوار پی وی سی (PVC) ۱ میل',
  'لولا آرام‌بند پمپی',
  'لولا ساده ۴ سوراخ',
  'لولا ۱۸۰ درجه / ۹۰ درجه',
  'ریل ساچمه‌ای سه تکه آرام‌بند',
  'ریل ساچمه‌ای تاندم / لمسی',
  'جک پمپی ۱۰۰ نیوتن / ۱۲۰ نیوتن',
  'جک اونتوس (HK / HF)',
  'پایه کابینت پلاستیکی ۱۰ یا ۱۴ سانت',
  'پایه کابینت استیل',
  'پاخور آلومینیومی / PVC',
  'دستگیره خطی / شاخه‌ای (پروفیل)',
  'دستگیره متری / توکار مخفی',
  'چسب ۱۲۳ بزرگ با اسپری',
  'چسب گرانول لبه‌چسبان',
  'چسب چوب تارگت / شمال',
  'چسب آکواریوم / سیلیکون آب‌بندی',
  'پیچ ام دی اف ۴*۱۶',
  'پیچ ام دی اف ۴*۲۸',
  'پیچ ام دی اف ۴*۳۰',
  'پیچ ام دی اف ۴*۵۰',
  'گونیا فلزی / پلاستیکی طبقه',
  'پین طبقه کابینت',
  'بست فرنگ / بست ال',
  'سبد سوپرمارکت و جاادویه‌ای'
];

export const CABINET_UNITS = [
  'ورق',
  'متر طول',
  'متر مربع',
  'عدد',
  'بسته',
  'شاخه',
  'قوطی',
  'کیلوگرم',
  'دستگاه',
  'کارتن'
];
