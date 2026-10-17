export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const homeFaq: FaqItem[] = [
  {
    id: "kimler",
    question: "Gezilere kimler katılabilir?",
    answer:
      "Geziler Gazi Gezi Kulübü üyelerine açıktır. Başvuru için siteye giriş yapmanız, iletişim bilgilerinizi ve yolcu listesi için T.C. kimlik numaranızı eksiksiz girmeniz gerekir.",
  },
  {
    id: "basvuru",
    question: "Başvuru nasıl tamamlanır?",
    answer:
      "Açık bir gezinin sayfasından formu gönderirsiniz. Ücretli gezilerde durum önce ödeme bekler. Dekont yüklendikten sonra yönetim kurulu kaydı inceler; onaylanınca QR bilet oluşur.",
  },
  {
    id: "iptal-kulup",
    question: "Kulüp geziyi iptal ederse ne olur?",
    answer:
      "Gezi iptal edilirse duyuru gezi sayfasında ve rehberlerde yayınlanır. Ödemesi onaylanmış katılımcılara iade koşulları o duyuruda ayrıca yazılır.",
  },
  {
    id: "kvkk",
    question: "Kimlik ve dekont bilgilerim nerede durur?",
    answer:
      "T.C. kimlik numarası yolcu listesi ve seyahat bildirimi için, dekont ise ödeme kontrolü için saklanır. Dekont dosyası herkese açık galeride yer almaz.",
  },
];

export const tripFaq: FaqItem[] = [
  {
    id: "odeme",
    question: "Ücreti nasıl öderim?",
    answer:
      "Gezi sayfasındaki banka ve IBAN bilgisine, açıklama kısmına adınızı yazarak havale veya EFT yapın. Ardından dekontu JPG, PNG veya PDF olarak yükleyin. Dosya en fazla 5 MB olabilir.",
  },
  {
    id: "dekont",
    question: "Yanlış dekont yüklersem ne yapmalıyım?",
    answer:
      "Kayıt henüz onaylanmadıysa gezi sayfasından dekontu güncelleyebilirsiniz. Onaydan sonra değişiklik için yönetim kuruluyla iletişime geçin.",
  },
  {
    id: "kontenjan",
    question: "Kontenjan dolunca kayıt kapanır mı?",
    answer:
      "Evet. Onaylı, dekontu incelenmekte olan ve ödemesi beklenen başvurular kontenjandan düşer. Kalan yer sıfırlanınca yeni başvuru alınmaz.",
  },
  {
    id: "iptal",
    question: "Başvurumu iptal edebilir miyim?",
    answer:
      "Dekont onaylanmadan önce başvurunuzu gezi sayfasından iptal edebilirsiniz. Onaylanmış kayıtların iadesi, gezinin iptal ve iade duyurusuna bağlıdır; bilet kullanıldıktan sonra yoklama geri alınmaz.",
  },
  {
    id: "bilet",
    question: "Bilet ve yoklama nasıl işler?",
    answer:
      "Onaydan sonra biletiniz kriptografik olarak imzalanmış bir QR koddur. Etkinlik günü bu kod yoklama ekranından okutulur. Aynı bilet ikinci kez giriş sayılmaz.",
  },
];
