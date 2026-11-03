// Sample zones, agenda, and coin codes until the client sends final content. Admins can edit all of it.
import type { ZoneType } from "@/config/literals";

interface SampleZone {
  key: string;
  nameAr: string;
  nameEn: string;
  detailsAr: string;
  detailsEn: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SAMPLE_ZONES: SampleZone[] = [
  { key: "stage", nameAr: "المسرح الرئيسي", nameEn: "Main Stage", detailsAr: "الافتتاح والجلسات الحوارية وإعلان الفائزين.", detailsEn: "Opening, panel talks, and winner announcements.", type: "stage", x: 8, y: 5, width: 84, height: 24 },
  { key: "workshop-a", nameAr: "ورشة الديناميكا الهوائية", nameEn: "Aerodynamics Workshop", detailsAr: "تجارب عملية عن انسياب الهواء حول السيارة.", detailsEn: "Hands-on sessions about airflow around the car.", type: "workshop", x: 6, y: 35, width: 28, height: 22 },
  { key: "workshop-b", nameAr: "ورشة المحركات", nameEn: "Powertrain Workshop", detailsAr: "كيف تعمل وحدات الطاقة وكيف تُصان.", detailsEn: "How power units work and how they are serviced.", type: "workshop", x: 6, y: 61, width: 28, height: 22 },
  { key: "pit-stop", nameAr: "تحدي البيت ستوب", nameEn: "Pit Stop Challenge", detailsAr: "نافس فريقك على أسرع تغيير إطارات.", detailsEn: "Race your team for the fastest tyre change.", type: "competition", x: 38, y: 35, width: 24, height: 22 },
  { key: "simulator", nameAr: "محاكي السباق", nameEn: "Racing Simulator", detailsAr: "جرّب الحلبة وسجّل أفضل زمن.", detailsEn: "Try the track and set your best lap.", type: "competition", x: 38, y: 61, width: 24, height: 22 },
  { key: "booths-industry", nameAr: "بوثات القطاع الصناعي", nameEn: "Industry Booths", detailsAr: "تعرف على الشركات وفرص التدريب.", detailsEn: "Meet companies and find training opportunities.", type: "booth", x: 66, y: 35, width: 28, height: 22 },
  { key: "booths-clubs", nameAr: "بوثات النوادي", nameEn: "Club Booths", detailsAr: "مشاريع طلابية من النوادي الهندسية.", detailsEn: "Student projects from engineering clubs.", type: "booth", x: 66, y: 61, width: 28, height: 22 },
  { key: "services", nameAr: "الخدمات والمصلى", nameEn: "Services & Prayer Room", detailsAr: "دورات المياه والمصلى ونقطة الإسعاف.", detailsEn: "Restrooms, prayer room, and first aid.", type: "services", x: 6, y: 88, width: 28, height: 20 },
  { key: "cafe", nameAr: "منطقة الضيافة", nameEn: "Hospitality Area", detailsAr: "قهوة ووجبات خفيفة بين الفقرات.", detailsEn: "Coffee and snacks between sessions.", type: "services", x: 66, y: 88, width: 28, height: 20 },
  { key: "entrance", nameAr: "البوابة وتسجيل الحضور", nameEn: "Gate & Check-in", detailsAr: "امسح كود الدخول هنا لتسجيل حضورك.", detailsEn: "Scan the entrance code here to check yourself in.", type: "entrance", x: 30, y: 116, width: 40, height: 18 },
];

interface SampleItem {
  zone: string;
  titleAr: string;
  titleEn: string;
  detailsAr?: string;
  detailsEn?: string;
  day: number;
  startTime: string;
  endTime: string;
}

export const SAMPLE_AGENDA: SampleItem[] = [
  { day: 1, startTime: "09:00", endTime: "10:00", zone: "entrance", titleAr: "استقبال وتسجيل الحضور", titleEn: "Arrival and check-in" },
  { day: 1, startTime: "10:00", endTime: "11:00", zone: "stage", titleAr: "حفل الافتتاح", titleEn: "Opening ceremony" },
  { day: 1, startTime: "11:15", endTime: "12:45", zone: "workshop-a", titleAr: "أساسيات الديناميكا الهوائية", titleEn: "Aerodynamics fundamentals" },
  { day: 1, startTime: "13:30", endTime: "15:00", zone: "pit-stop", titleAr: "تصفيات تحدي البيت ستوب", titleEn: "Pit stop qualifiers" },
  { day: 1, startTime: "15:15", endTime: "16:30", zone: "stage", titleAr: "جلسة: من الجامعة إلى الحلبة", titleEn: "Talk: from campus to the circuit" },
  { day: 2, startTime: "09:30", endTime: "11:00", zone: "workshop-b", titleAr: "داخل وحدة الطاقة", titleEn: "Inside the power unit" },
  { day: 2, startTime: "11:15", endTime: "12:45", zone: "booths-industry", titleAr: "لقاء القطاع الصناعي", titleEn: "Industry meetup" },
  { day: 2, startTime: "13:30", endTime: "15:30", zone: "simulator", titleAr: "بطولة محاكي السباق", titleEn: "Simulator championship" },
  { day: 2, startTime: "15:45", endTime: "17:00", zone: "stage", titleAr: "جلسة: هندسة الأداء", titleEn: "Talk: performance engineering" },
  { day: 3, startTime: "09:30", endTime: "11:00", zone: "workshop-a", titleAr: "النمذجة والتجربة", titleEn: "Modeling and testing" },
  { day: 3, startTime: "11:15", endTime: "12:30", zone: "booths-clubs", titleAr: "عرض المشاريع الطلابية", titleEn: "Student project showcase" },
  { day: 3, startTime: "13:30", endTime: "15:00", zone: "pit-stop", titleAr: "نهائي تحدي البيت ستوب", titleEn: "Pit stop final" },
  { day: 3, startTime: "15:15", endTime: "16:30", zone: "stage", titleAr: "الحفل الختامي وإعلان الفائزين", titleEn: "Closing ceremony and winners" },
];

export const SAMPLE_COIN_CODES = [
  { labelAr: "ورشة الديناميكا الهوائية", labelEn: "Aerodynamics Workshop", coins: 50 },
  { labelAr: "تحدي البيت ستوب", labelEn: "Pit Stop Challenge", coins: 100 },
  { labelAr: "محاكي السباق", labelEn: "Racing Simulator", coins: 75 },
  { labelAr: "بوثات القطاع الصناعي", labelEn: "Industry Booths", coins: 25 },
];
