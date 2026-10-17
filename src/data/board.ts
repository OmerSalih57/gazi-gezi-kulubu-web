import { INSTAGRAM_URL } from "@/data/instagram";

export type BoardLink = {
  label: string;
  href: string;
};

export type BoardMember = {
  id: string;
  title: string;
  duty: string;
  image: string | null;
  links: BoardLink[];
};

// İsim ve kişisel hesap yazılmadı. Gerçek yönetim kurulu bu dosyadan güncellenir.
export const board: BoardMember[] = [
  {
    id: "baskan",
    title: "Kulüp Başkanı",
    duty: "Kulübü temsil eder, gezi takvimini ve yönetim kurulu toplantılarını yürütür.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
  {
    id: "yardimci",
    title: "Başkan Yardımcısı",
    duty: "Başkanın yokluğunda kurulun işlerini sürdürür ve gezi ekiplerini koordine eder.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
  {
    id: "sayman",
    title: "Sayman",
    duty: "Katılım ücretlerini, dekont onaylarını ve gezi bütçesini takip eder.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
  {
    id: "organizasyon",
    title: "Organizasyon Sorumlusu",
    duty: "Ulaşım, konaklama ve gün içi programın sahadaki akışını planlar.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
  {
    id: "iletisim",
    title: "İletişim Sorumlusu",
    duty: "Duyuruları, rehber yazılarını ve gezi sonrası albümleri yayınlar.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
  {
    id: "uye",
    title: "Üye İlişkileri",
    duty: "Başvuru sorularını yanıtlar, yoklama günü karşılama ekibini kurar.",
    image: null,
    links: [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "LinkedIn", href: "" },
      { label: "E-posta", href: "" },
    ],
  },
];
