import { Guide, Facility } from '../types';

export const INITIAL_GUIDES: Guide[] = [
  {
    id: '1',
    title: 'Penanganan Luka Bakar',
    category: 'Luka Bakar',
    symptoms: [
      'Kulit kemerahan atau melepuh',
      'Rasa nyeri yang hebat di area terbakar',
      'Pembengkakan pada kulit'
    ],
    steps: [
      'Dinginkan bagian yang terbakar dengan air mengalir (bukan air es) selama minimal 10-20 menit.',
      'Lepaskan perhiasan atau pakaian yang tidak menempel sebelum area mulai membengkak.',
      'Tutup luka dengan kain bersih atau plastik wrap yang longgar.',
      'Jangan memecahkan lepuhan atau mengoleskan odol/mentega.',
      'Segera cari bantuan medis jika luka bakar parah atau luas.'
    ],
    lastUpdated: '2024-03-20'
  },
  {
    id: '2',
    title: 'Pertolongan Tersedak (Heimlich Maneuver)',
    category: 'Tersedak',
    symptoms: [
      'Tidak bisa bicara atau berteriak',
      'Batuk yang lemah atau tidak ada suara saat batuk',
      'Kulit membiru (sianosis)',
      'Tangan memegang leher (tanda universal tersedak)'
    ],
    steps: [
      'Berdiri di belakang penderita.',
      'Lingkarkan lengan Anda di pinggang penderita.',
      'Kepalkan satu tangan dan letakkan tepat di atas pusar penderita.',
      'Genggam kepalan tangan tersebut dengan tangan satunya.',
      'Lakukan dorongan ke arah dalam dan ke atas dengan cepat (gentakan).',
      'Ulangi sampai benda asing keluar atau penderita pingsan.'
    ],
    lastUpdated: '2024-03-20'
  },
  {
    id: '3',
    title: 'Pendarahan Berat',
    category: 'Pendarahan Berat',
    symptoms: [
      'Darah mengalir deras atau menyembur dari luka',
      'Darah tidak berhenti meski sudah ditekan',
      'Korban tampak lemas atau syok'
    ],
    steps: [
      'Kenakan sarung tangan jika ada.',
      'Tekan area luka secara langsung dengan kain bersih.',
      'Jika pendarahan tidak berhenti, tambahkan tekanan langsung di atas luka.',
      'Jangan melepas kain yang sudah jenuh darah, cukup tambahkan kain di atasnya.',
      'Bawa segera ke IGD terdekat.'
    ],
    lastUpdated: '2024-03-20'
  },
  {
    id: '4',
    title: 'Penanganan Patah Tulang',
    category: 'Patah Tulang',
    symptoms: [
      'Bentuk anggota tubuh tidak normal (deformitas)',
      'Nyeri hebat saat digerakkan',
      'Memar dan pembengkakan hebat',
      'Terdengar suara "krek" saat cedera'
    ],
    steps: [
      'Jangan mencoba memindahkan korban kecuali ada bahaya langsung.',
      'Minta korban untuk tidak menggerakkan bagian yang patah.',
      'Gunakan penyangga (bidai) jika memungkinkan untuk menstabilkan area tersebut.',
      'Balut dengan kain bersih jika ada luka terbuka.',
      'Hubungi medis segera.'
    ],
    lastUpdated: '2024-03-21'
  },
  {
    id: '5',
    title: 'Serangan Jantung',
    category: 'Serangan Jantung',
    symptoms: [
      'Nyeri dada seperti ditekan atau tertindih',
      'Nyeri menjalar ke lengan kiri, leher, atau rahang',
      'Sesak napas dan keringat dingin',
      'Rasa mual atau pusing mendadak'
    ],
    steps: [
      'Minta penderita untuk duduk dan tetap tenang.',
      'Longgarkan pakaian yang ketat.',
      'Tanyakan apakah penderita memiliki obat jantung pribadi (seperti nitrogliserin).',
      'Jika penderita tidak sadar, segera lakukan CPR.',
      'Hubungi 119 segera.'
    ],
    lastUpdated: '2024-03-21'
  },
  {
    id: '6',
    title: 'Menangani Orang Pingsan',
    category: 'Pingsan',
    symptoms: [
      'Hilangnya kesadaran secara mendadak',
      'Wajah pucat dan kulit terasa dingin',
      'Nadi lemah atau lambat'
    ],
    steps: [
      'Baringkan penderita di tempat yang datar dan aman.',
      'Angkat kaki penderita lebih tinggi dari jantung jika memungkinkan.',
      'Pastikan penderita mendapatkan sirkulasi udara yang baik.',
      'Periksa pernapasan; jika tidak bernapas, lakukan CPR.',
      'Hubungi medis jika penderita tidak segera sadar dalam 1 menit.'
    ],
    lastUpdated: '2024-03-21'
  },
  {
    id: '7',
    title: 'Pertolongan Digigit Ular',
    category: 'Digigit Ular',
    symptoms: [
      'Dua bekas luka taring yang jelas',
      'Nyeri hebat dan pembengkakan di area gigitan',
      'Perubahan warna kulit di sekitar luka',
      'Mual, pusing, atau penglihatan kabur'
    ],
    steps: [
      'Tetap tenang dan jangan biarkan korban banyak bergerak.',
      'Lepaskan barang-barang ketat di area gigitan (cincin, gelang).',
      'Posisikan area gigitan lebih rendah dari jantung.',
      'Jangan mencoba mengisap racun atau membedah luka.',
      'Segera bawa ke rumah sakit yang memiliki serum anti-bisa ular.'
    ],
    lastUpdated: '2024-03-21'
  },
  {
    id: '8',
    title: 'Keracunan Makanan/Zat',
    category: 'Keracunan',
    symptoms: [
      'Mual dan muntah hebat',
      'Diare dan kram perut',
      'Nyeri kepala atau kejang pada kasus berat',
      'Luka bakar di sekitar mulut (jika racun kimia)'
    ],
    steps: [
      'Jangan paksa penderita untuk muntah kecuali disarankan tenaga medis.',
      'Jika racun mengenai kulit atau mata, bilas dengan air mengalir terus menerus.',
      'Identifikasi zat beracun yang masuk ke tubuh.',
      'Bawa sisa makanan atau kemasan racun ke rumah sakit.',
      'Hubungi pusat informasi keracunan atau medis segera.'
    ],
    lastUpdated: '2024-03-21'
  }
];

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: '1',
    name: 'RS Medika Utama',
    address: 'Jl. Kesehatan No. 123, Jakarta Pusat',
    phone: '021-555-1234',
    type: 'RS',
    lat: -6.1754,
    lng: 106.8272
  },
  {
    id: '2',
    name: 'Klinik Pratama AksiSehat',
    address: 'Jl. Pertolongan No. 45, Jakarta Pusat',
    phone: '021-555-9876',
    type: 'Klinik',
    lat: -6.1931,
    lng: 106.8218
  },
  {
    id: '3',
    name: 'RS Central Jakarta',
    address: 'Jl. Sudirman No. 10, Jakarta Pusat',
    phone: '021-555-0001',
    type: 'RS',
    lat: -6.2146,
    lng: 106.8202
  },
  {
    id: '4',
    name: 'RSIA Bunda Jakarta',
    address: 'Jl. Teuku Cik Ditiro No. 28, Menteng',
    phone: '021-555-0002',
    type: 'RS',
    lat: -6.1852,
    lng: 106.8322
  },
  {
    id: '5',
    name: 'Klinik SOS Medika',
    address: 'Jl. Cipete Raya No. 2, Jakarta Selatan',
    phone: '021-555-0003',
    type: 'Klinik',
    lat: -6.2731,
    lng: 106.8042
  },
  {
    id: '6',
    name: 'RS Pondok Indah',
    address: 'Jl. Metro Pondok Indah, Jakarta Selatan',
    phone: '021-555-0004',
    type: 'RS',
    lat: -6.2842,
    lng: 106.7822
  },
  {
    id: '7',
    name: 'RS Siloam Semanggi',
    address: 'Jl. Garnisun Dalam No. 2-3, Jakarta Selatan',
    phone: '021-555-0005',
    type: 'RS',
    lat: -6.2189,
    lng: 106.8166
  },
  {
    id: '8',
    name: 'Klinik Yakestama',
    address: 'Jl. Tebet Barat Dalam No. 34, Jakarta Selatan',
    phone: '021-555-0006',
    type: 'Klinik',
    lat: -6.2351,
    lng: 106.8482
  },
  {
    id: '9',
    name: 'RS Cipto Mangunkusumo',
    address: 'Jl. Diponegoro No. 71, Jakarta Pusat',
    phone: '021-555-0007',
    type: 'RS',
    lat: -6.1969,
    lng: 106.8472
  },
  {
    id: '10',
    name: 'RS Gading Pluit',
    address: 'Jl. Boulevard Timur Raya, Jakarta Utara',
    phone: '021-555-0008',
    type: 'RS',
    lat: -6.1582,
    lng: 106.9122
  },
  {
    id: '11',
    name: 'Klinik Kimia Farma',
    address: 'Jl. Kebon Jeruk No. 8, Jakarta Barat',
    phone: '021-555-0009',
    type: 'Klinik',
    lat: -6.1922,
    lng: 106.7722
  },
  {
    id: '13',
    name: 'RS Omni Pulomas',
    address: 'Jl. Pulo Mas Bar. VI No.20, Jakarta Timur',
    phone: '021-2977-9999',
    type: 'RS',
    lat: -6.1772,
    lng: 106.8842
  },
  {
    id: '14',
    name: 'RS Columbia Asia Pulomas',
    address: 'Jl. Kayu Putih Raya No.1, Jakarta Timur',
    phone: '021-2927-4500',
    type: 'RS',
    lat: -6.1842,
    lng: 106.8822
  },
  {
    id: '15',
    name: 'RS Mediros',
    address: 'Jl. Perintis Kemerdekaan No.149, Jakarta Timur',
    phone: '021-489-2108',
    type: 'RS',
    lat: -6.1812,
    lng: 106.8992
  },
  {
    id: '16',
    name: 'RS Yadika Pondok Bambu',
    address: 'Jl. Pahlawan Revolusi No.47, Jakarta Timur',
    phone: '021-861-5750',
    type: 'RS',
    lat: -6.2305,
    lng: 106.9054
  },
  {
    id: '17',
    name: 'RSIA Bunda Aliyah',
    address: 'Jl. Pahlawan Revolusi No.100, Pondok Bambu',
    phone: '021-8660-2525',
    type: 'RS',
    lat: -6.2355,
    lng: 106.9062
  },
  {
    id: '18',
    name: 'RS Islam Jakarta Pondok Kopi',
    address: 'Jl. Raya Pd. Kopi No.1, Jakarta Timur',
    phone: '021-863-0654',
    type: 'RS',
    lat: -6.2232,
    lng: 106.9452
  },
  {
    id: 'tg-1',
    name: 'RSUD Kabupaten Tangerang',
    address: 'Jl. Ahmad Yani No.9, Sukaasih, Tangerang',
    phone: '021-552-3502',
    type: 'RS',
    lat: -6.1730,
    lng: 106.6397
  },
  {
    id: 'tg-2',
    name: 'RS Mayapada Tangerang',
    address: 'Jl. Honoris Raya No.6, Modernland',
    phone: '021-2921-7777',
    type: 'RS',
    lat: -6.1985,
    lng: 106.6505
  },
  {
    id: 'tg-3',
    name: 'RS Siloam Lippo Village',
    address: 'Jl. Siloam No.6, Karawaci, Tangerang',
    phone: '021-8064-6900',
    type: 'RS',
    lat: -6.2255,
    lng: 106.6045
  },
  {
    id: 'tg-4',
    name: 'RS Sari Asih Karawaci',
    address: 'Jl. Imam Bonjol No.38, Tangerang',
    phone: '021-552-2794',
    type: 'RS',
    lat: -6.2081,
    lng: 106.6186
  },
  {
    id: 'tg-5',
    name: 'RS EMC Tangerang',
    address: 'Jl. KH Hasyim Ashari No.24, Cipondoh',
    phone: '021-2977-9977',
    type: 'RS',
    lat: -6.1852,
    lng: 106.6631
  },
  {
    id: 'tg-6',
    name: 'Rumah Sakit Umum Daerah (RSUD) Kota Tangerang',
    address: 'Jl. l. Perintis Kemerdekaan II No.1, Babakan',
    phone: '021-2972-0200',
    type: 'RS',
    lat: -6.1843,
    lng: 106.6433
  },
  {
    id: 'tg-7',
    name: 'RS Melati',
    address: 'Jl. Merdeka No.92, Sukajadi, Tangerang',
    phone: '021-552-3911',
    type: 'RS',
    lat: -6.1788,
    lng: 106.6265
  },
  {
    id: 'tg-8',
    name: 'RSIA Pratiwi',
    address: 'Jl. l. Raden Saleh No.43, Karang Tengah',
    phone: '021-731-8666',
    type: 'RS',
    lat: -6.1755,
    lng: 106.6111
  },
  {
    id: 'tg-9',
    name: 'Puskesmas Sukajadi',
    address: 'Jl. l. Merdeka, Sukajadi, Tangerang',
    phone: '021-552-2794',
    type: 'Klinik',
    lat: -6.1795,
    lng: 106.6288
  }
];
