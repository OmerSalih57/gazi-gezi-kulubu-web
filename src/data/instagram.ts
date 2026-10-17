export const INSTAGRAM_HANDLE = "gazi.gezi";
export const INSTAGRAM_URL = "https://www.instagram.com/gazi.gezi/";

export type MockFrame = {
  src: string;
  alt: string;
};

export type MockInstagramCard = {
  id: string;
  kicker: string;
  title: string;
  caption: string;
  frames: MockFrame[];
  play?: boolean;
  cta?: boolean;
};

export const mockInstagramStream: MockInstagramCard[] = [
  {
    id: "bolu",
    kicker: "Çekiliş",
    title: "BOLU GEZİSİ ÇEKİLİŞİ",
    caption: "Doğanın kalbinde unutulmaz bir gün. Katılım için gönderinin açıklamasını okuyun.",
    frames: [{ src: "/media/instagram/bolu.jpg", alt: "Bolu gezisi çekilişi duyuru görseli" }],
  },
  {
    id: "arkadaslar",
    kicker: "Reel",
    title: "Arkadaşlar !!",
    caption: "Kulüp ekibinden kısa Reels kaydı.",
    play: true,
    frames: [{ src: "/media/instagram/arkadaslar.jpg", alt: "Gazi Gezi Kulübü ekibinin Reels önizlemesi" }],
  },
  {
    id: "hesap",
    kicker: "Resmi hesap",
    title: "Gazi Gezi Kulübü Resmi Instagram Hesabı",
    caption: "Duyurular ve gezi kareleri için @gazi.gezi hesabını takip edin.",
    cta: true,
    frames: [{ src: "/media/instagram/logo.jpg", alt: "Gazi Üniversitesi Gezi Topluluğu logosu" }],
  },
];
