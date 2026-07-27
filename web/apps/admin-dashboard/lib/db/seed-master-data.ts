/**
 * seed-master-data.ts
 * Seeder data master KARU — Tanaman, Hama/Penyakit, SOP
 *
 * Data nyata untuk ekosistem perkebunan Kalimantan Selatan.
 * Script ini bersifat idempotent: skip jika ID sudah ada di database.
 *
 * Jalankan: npm run db:seed-master
 */

import { db } from './index';
import {
  plants,
  pestsDiseases,
  sops,
  plantPestRelations,
  sopPestRelations,
  sopPlantRelations,
} from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────────────────────────
// DATA MASTER: TANAMAN
// ─────────────────────────────────────────────────────────────────────────────
const plantsData = [
  {
    id: 'T-001',
    namaLokal: 'Kelapa Sawit',
    namaIlmiah: 'Elaeis guineensis',
    kategori: 'Perkebunan',
    risikoPenyakit: 'Tinggi',
    siklusPanen: '3–5 bulan sekali (tandan buah segar)',
    habitat: 'Dataran rendah tropis, ketinggian 0–500 mdpl',
    deskripsi:
      'Tanaman penghasil minyak nabati utama di Indonesia. Sangat rentan terhadap jamur Ganoderma dan serangan hama ulat kantong. Memerlukan pemantauan intensif, terutama pada tanaman berumur 5–20 tahun.',
  },
  {
    id: 'T-002',
    namaLokal: 'Karet',
    namaIlmiah: 'Hevea brasiliensis',
    kategori: 'Perkebunan',
    risikoPenyakit: 'Sedang',
    siklusPanen: 'Penyadapan getah harian/mingguan (mulai umur 5–7 tahun)',
    habitat: 'Dataran rendah hingga sedang, curah hujan tinggi',
    deskripsi:
      'Tanaman penghasil lateks (getah karet alam). Rentan terhadap penyakit gugur daun dan jamur akar. Produksi optimal pada suhu 25–35°C dengan curah hujan merata.',
  },
  {
    id: 'T-003',
    namaLokal: 'Padi',
    namaIlmiah: 'Oryza sativa',
    kategori: 'Tanaman Pangan',
    risikoPenyakit: 'Tinggi',
    siklusPanen: '3–4 bulan per musim tanam',
    habitat: 'Lahan sawah, dataran rendah berair',
    deskripsi:
      'Tanaman pangan utama Indonesia. Sangat rentan terhadap serangan wereng batang coklat, penggerek batang, dan penyakit hawar daun bakteri (HDB). Membutuhkan pengairan teratur dan pengelolaan OPT yang ketat.',
  },
  {
    id: 'T-004',
    namaLokal: 'Jagung',
    namaIlmiah: 'Zea mays',
    kategori: 'Tanaman Pangan',
    risikoPenyakit: 'Sedang',
    siklusPanen: '75–100 hari',
    habitat: 'Lahan kering hingga sawah, ketinggian 0–1800 mdpl',
    deskripsi:
      'Tanaman pangan dan pakan ternak. Rentan terhadap penggerek batang jagung, penyakit bulai, dan bercak daun. Produktivitas sangat dipengaruhi ketersediaan air pada fase vegetatif dan generatif.',
  },
  {
    id: 'T-005',
    namaLokal: 'Pisang',
    namaIlmiah: 'Musa paradisiaca',
    kategori: 'Hortikultura',
    risikoPenyakit: 'Tinggi',
    siklusPanen: '9–12 bulan per siklus',
    habitat: 'Dataran rendah tropis, tanah gembur berhumus',
    deskripsi:
      'Tanaman buah tropik dengan nilai ekonomi tinggi. Sangat rentan terhadap penyakit layu Fusarium (Panama disease) yang dapat memusnahkan kebun secara massal. Membutuhkan sanitasi kebun yang ketat.',
  },
  {
    id: 'T-006',
    namaLokal: 'Singkong',
    namaIlmiah: 'Manihot esculenta',
    kategori: 'Tanaman Pangan',
    risikoPenyakit: 'Rendah',
    siklusPanen: '6–12 bulan',
    habitat: 'Lahan kering, toleran tanah miskin hara',
    deskripsi:
      'Tanaman umbi-umbian yang tahan kekeringan dan cocok untuk lahan marginal. Relatif tahan hama penyakit, namun bisa terserang tungau merah dan penyakit layu bakteri pada kondisi lembap berlebih.',
  },
  {
    id: 'T-007',
    namaLokal: 'Lada',
    namaIlmiah: 'Piper nigrum',
    kategori: 'Rempah-rempah',
    risikoPenyakit: 'Sangat Tinggi',
    siklusPanen: '3–4 tahun awal, panen tahunan setelah berproduksi',
    habitat: 'Dataran rendah hingga menengah, butuh tiang panjat',
    deskripsi:
      'Rempah bernilai ekspor tinggi yang dijuluki "raja rempah". Sangat rentan terhadap penyakit busuk pangkal batang (Phytophthora capsici) dan antraknosa. Membutuhkan drainase baik dan pemangkasan rutin.',
  },
  {
    id: 'T-008',
    namaLokal: 'Kakao',
    namaIlmiah: 'Theobroma cacao',
    kategori: 'Perkebunan',
    risikoPenyakit: 'Tinggi',
    siklusPanen: 'Panen 2× per tahun',
    habitat: 'Dataran rendah tropis, terlindung dari angin langsung',
    deskripsi:
      'Tanaman penghasil biji cokelat. Sangat rentan terhadap penyakit busuk buah (Phytophthora palmivora), antraknosa, dan hama penggerek buah kakao (PBK). Memerlukan naungan dan pemangkasan serasi.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA MASTER: HAMA & PENYAKIT
// ─────────────────────────────────────────────────────────────────────────────
const pestsDiseaseData = [
  {
    id: 'PST-001',
    nama: 'Ganoderma (Busuk Pangkal Batang)',
    namaIlmiah: 'Ganoderma boninense',
    jenis: 'Penyakit',
    kategori: 'Jamur Patogen',
    tingkatRisiko: 'Sangat Tinggi',
    gejala:
      'Daun tombak mengering dan tidak membuka, pelepah bawah patah menggantung (frond collapse), muncul tubuh buah jamur berwarna cokelat kemerahan di pangkal batang, produksi TBS menurun drastis, tanaman akhirnya mati.',
    penanganan:
      '1. Isolasi segera: Pasang parit isolasi sedalam 60–80 cm mengelilingi tanaman sakit untuk mencegah penyebaran melalui akar.\n2. Aplikasi fungisida sistemik berbahan aktif Hexaconazole atau Trifloxystrobin+Tebuconazole pada lubang bor di batang (injeksi batang).\n3. Cabut dan bakar tuntas seluruh bagian tanaman termasuk akar serabut yang terinfeksi.\n4. Tabur kapur dolomit (2–3 kg/pohon) pada bekas lubang tanam untuk menaikkan pH tanah.\n5. Replanting: Gunakan bibit dari varietas toleran Ganoderma (mis. DxP Yangambi, Sriwijaya).\n6. Pasang perangkap feromon untuk memantau populasi kumbang vektor.\n7. Pemantauan berkala setiap 3 bulan pada tanaman di sekitar titik infeksi.',
    plantIds: ['T-001'],
  },
  {
    id: 'PST-002',
    nama: 'Ulat Kantong',
    namaIlmiah: 'Metisa plana / Mahasena corbetti',
    jenis: 'Hama',
    kategori: 'Lepidoptera',
    tingkatRisiko: 'Tinggi',
    gejala:
      'Daun tampak seperti "terbakar" karena jaringan daun habis dimakan (defoliasi), terlihat kantong-kantong kecil menggantung di pelepah daun (panjang 1–3 cm), pertumbuhan tanaman terhambat, produksi TBS berkurang 30–60% pada serangan berat.',
    penanganan:
      '1. Pengumpulan manual: Petik dan musnahkan kantong ulat secara manual pada serangan awal (populasi < 10 ekor/pelepah).\n2. Semprotkan insektisida berbahan aktif Chlorpyrifos 200 EC (dosis 2 ml/L) atau Deltamethrin pada permukaan bawah daun.\n3. Aplikasi Bacillus thuringiensis (Bt) sebagai agen hayati — efektif dan ramah lingkungan.\n4. Introduksi musuh alami: Parasitoid telur Apanteles metesae dan Trichogramma sp.\n5. Pasang perangkap cahaya (light trap) pada malam hari untuk mengurangi populasi imago.\n6. Lakukan sensus populasi setiap 2 bulan; ambang ekonomi = 10 ekor/pelepah.\n7. Hindari penggunaan pestisida broad-spectrum yang membunuh musuh alami.',
    plantIds: ['T-001', 'T-008'],
  },
  {
    id: 'PST-003',
    nama: 'Kumbang Tanduk',
    namaIlmiah: 'Oryctes rhinoceros',
    jenis: 'Hama',
    kategori: 'Coleoptera',
    tingkatRisiko: 'Tinggi',
    gejala:
      'Lubang berbentuk "V" atau segitiga pada pelepah daun muda yang baru membuka, titik tumbuh (spear) berlubang dan berlendir, daun tombak tidak dapat membuka sempurna (terpotong melintang), produksi buah menurun pada serangan berulang.',
    penanganan:
      '1. Pasang perangkap feromon kumbang (Oryctes pheromone trap) dengan kepadatan 1 perangkap per 5 hektare.\n2. Musnahkan semua sumber perkembangbiakan: tunggul kayu lapuk, tumpukan serasah organik, dan bahan organik terdekomposisi.\n3. Aplikasi insektisida Fipronil 50 SC pada titik tumbuh (2–3 ml/tanaman).\n4. Gunakan agen hayati: Baculovirus oryctes (Baculoviral Insecticide) yang spesifik terhadap O. rhinoceros.\n5. Pelepah bekas panen segera dibuang jauh dari areal kebun atau dicincang halus agar tidak jadi tempat bertelur.\n6. Pemantauan rutin setiap 2 minggu pada tanaman berumur di bawah 5 tahun.',
    plantIds: ['T-001'],
  },
  {
    id: 'PST-004',
    nama: 'Tikus Kebun',
    namaIlmiah: 'Rattus tiomanicus',
    jenis: 'Hama',
    kategori: 'Mamalia',
    tingkatRisiko: 'Sedang',
    gejala:
      'Tanda gigitan pada tangkai tandan buah sawit (TBS), buah sawit berjatuhan sebelum matang dengan bekas gigitan, lubang galian di sekitar pangkal batang, biji padi atau jagung terkikis/hilang di lahan pertanian.',
    penanganan:
      '1. Pasang perangkap (rodentisida) pada jalur aktif tikus, terutama di perbatasan kebun dan lahan.\n2. Gunakan umpan beracun berbahan aktif Brodifacoum atau Bromadiolone sesuai dosis anjuran; hindari penggunaan berlebihan.\n3. Pelihara dan lindungi predator alami: Tyto alba (burung hantu) dengan pemasangan rumah burung hantu (RBH) 1 unit per 25 hektare.\n4. Bersihkan semak-semak dan gulma tebal di antara tanaman sebagai sarang tikus.\n5. Sinkronisasi pengendalian antar petani/blok kebun secara serempak (gropyokan massal).\n6. Pasang kolar seng (Roof-rat Guard) pada batang tanaman untuk mencegah tikus memanjat.',
    plantIds: ['T-001', 'T-003'],
  },
  {
    id: 'PST-005',
    nama: 'Hawar Daun (Cercospora)',
    namaIlmiah: 'Cercospora elaeidis',
    jenis: 'Penyakit',
    kategori: 'Jamur Patogen',
    tingkatRisiko: 'Sedang',
    gejala:
      'Bercak cokelat kekuningan pada daun tua, bercak berkembang memanjang mengikuti tulang daun dengan halo kuning di sekitarnya, jaringan daun mengering dan mati (nekrosis), defoliasi pada serangan berat yang menyebabkan penurunan laju fotosintesis.',
    penanganan:
      '1. Buang dan bakar daun yang terinfeksi berat untuk mengurangi sumber inokulum.\n2. Semprot fungisida berbahan aktif Propiconazole 250 EC (dosis 0,5 ml/L) atau Mancozeb 80 WP pada seluruh permukaan daun.\n3. Perbaiki drainase kebun untuk mengurangi kelembapan berlebih yang mendukung perkembangan jamur.\n4. Aplikasi pupuk kalium (KCl) sesuai anjuran untuk meningkatkan ketahanan tanaman.\n5. Lakukan sanitasi kebun secara berkala; singkirkan serasah daun yang terinfeksi.\n6. Pemantauan intensitas serangan setiap bulan pada musim hujan.',
    plantIds: ['T-001', 'T-005'],
  },
  {
    id: 'PST-006',
    nama: 'Layu Fusarium (Panama Disease)',
    namaIlmiah: 'Fusarium oxysporum f. sp. cubense',
    jenis: 'Penyakit',
    kategori: 'Jamur Patogen',
    tingkatRisiko: 'Sangat Tinggi',
    gejala:
      'Daun tua menguning dari tepi ke dalam (margin chlorosis), daun layu dan patah di pangkal pelepah, bonggol pisang membusuk berwarna coklat kemerahan jika dipotong, tanaman mati mendadak, tanaman muda yang baru bertunas juga ikut terinfeksi melalui tanah.',
    penanganan:
      '1. TIDAK ADA FUNGISIDA yang efektif setelah tanaman terinfeksi — pengendalian utama adalah PENCEGAHAN.\n2. Cabut dan musnahkan (bakar) segera seluruh tanaman yang terinfeksi beserta bonggolnya.\n3. Karantina lahan: Jangan memindahkan tanah, alat, atau bibit dari lahan terinfeksi ke lahan lain.\n4. Disinfeksi alat pertanian (parang, cangkul) dengan larutan kaporit 5% atau formalin 2% sebelum berpindah blok.\n5. Replanting: Gunakan HANYA varietas tahan Fusarium ras TR4 (mis. Cavendish termodifikasi, FHIA-17, FHIA-25).\n6. Perbaiki drainase lahan untuk mencegah kondisi anaerob yang memperburuk infeksi.\n7. Aplikasi agen hayati: Trichoderma harzianum (granul, 50 g/lubang tanam) pada penanaman ulang.',
    plantIds: ['T-005'],
  },
  {
    id: 'PST-007',
    nama: 'Wereng Batang Coklat',
    namaIlmiah: 'Nilaparvata lugens',
    jenis: 'Hama',
    kategori: 'Hemiptera',
    tingkatRisiko: 'Sangat Tinggi',
    gejala:
      'Tanaman padi berwarna kuning kecokelatan seperti terbakar dari bawah (hopperburn), pertumbuhan terhambat, tanaman rebah pada serangan berat, koloni wereng terlihat di bagian bawah batang dekat permukaan air/tanah.',
    penanganan:
      '1. Tanam varietas tahan wereng (Inpari 13, 19, 32, 33, atau Ciherang Submerge-1).\n2. Terapkan sistem tanam serempak setiap musim untuk memutus siklus hama.\n3. Kendalikan dengan insektisida selektif: Buprofezin 10 WP (dosis 1 g/L), Imidakloprid 25 WP, atau BPMC (Fenobukarb).\n4. Jangan gunakan insektisida piretroid yang justru memicu resurjensi wereng.\n5. Pertahankan populasi predator alami: laba-laba, kepik, dan kumbang kubah.\n6. Drainase berkala (pengaturan irigasi berselang) untuk mengganggu habitat wereng.\n7. Amati populasi wereng setiap minggu; ambang pengendalian = 20 ekor/rumpun.',
    plantIds: ['T-003'],
  },
  {
    id: 'PST-008',
    nama: 'Penggerek Batang',
    namaIlmiah: 'Scirpophaga incertulas / Ostrinia furnacalis',
    jenis: 'Hama',
    kategori: 'Lepidoptera',
    tingkatRisiko: 'Tinggi',
    gejala:
      'Daun tengah tanaman mati (deadheart) pada fase vegetatif, malai kosong/tidak berisi biji (whitehead) pada fase generatif padi, lubang kecil bekas gerekan pada batang, serbuk kotoran ulat di dalam batang yang berlubang.',
    penanganan:
      '1. Kumpulkan dan musnahkan kelompok telur penggerek batang yang terletak di permukaan daun.\n2. Lepaskan parasitoid telur Trichogramma japonicum (1 kartu/ha/minggu selama 8 minggu).\n3. Aplikasi insektisida granul Karbofuran 3G (20 kg/ha) pada fase anakan maksimum ATAU semprot Klorantraniliprol 200 SC (0,3 ml/L).\n4. Ratoon (jerami panen) harus segera dibajak atau dibakar untuk membunuh larva yang tersisa.\n5. Pola tanam serempak dalam satu hamparan untuk memutus siklus hama.\n6. Pasang lampu perangkap imago pada malam hari.',
    plantIds: ['T-003', 'T-004'],
  },
  {
    id: 'PST-009',
    nama: 'Busuk Akar Pythium',
    namaIlmiah: 'Pythium sp.',
    jenis: 'Penyakit',
    kategori: 'Oomycetes',
    tingkatRisiko: 'Sedang',
    gejala:
      'Akar membusuk berwarna cokelat hingga hitam dan berbau busuk, tanaman layu meskipun tanah lembap, pertumbuhan terhambat dan daun menguning (klorosis), tanaman mudah dicabut karena akar rusak.',
    penanganan:
      '1. Perbaiki sistem drainase lahan segera; Pythium berkembang pesat pada kondisi tergenang.\n2. Siram zona perakaran dengan fungisida berbahan aktif Metalaksil+Mankozeb (Ridomil Gold MZ) dosis 2 g/L.\n3. Aplikasi agensia hayati Trichoderma sp. (granul, 100 g/tanaman) untuk menekan populasi Pythium secara biologis.\n4. Kurangi kepadatan populasi tanaman untuk meningkatkan sirkulasi udara.\n5. Hindari luka mekanis pada akar saat pengolahan tanah.\n6. Lakukan rotasi tanaman dengan tanaman yang tidak rentan Pythium (mis. kacang-kacangan).',
    plantIds: ['T-003', 'T-004'],
  },
  {
    id: 'PST-010',
    nama: 'Antraknosa',
    namaIlmiah: 'Colletotrichum gloeosporioides',
    jenis: 'Penyakit',
    kategori: 'Jamur Patogen',
    tingkatRisiko: 'Tinggi',
    gejala:
      'Bercak hitam kecokelatan berbentuk tidak beraturan pada buah, daun, dan ranting, bercak melekuk ke dalam (cekung) dengan warna gelap dan tepi yang jelas, buah membusuk dan rontok sebelum matang, cabang mengering dari ujung ke pangkal (dieback).',
    penanganan:
      '1. Panen buah yang terserang dan musnahkan segera; jangan biarkan buah busuk di pohon atau tanah.\n2. Pangkas cabang dan ranting yang terinfeksi hingga 15–20 cm di bawah gejala; oleskan fungisida pasta pada luka pemangkasan.\n3. Semprot fungisida: Mankozeb 80 WP (2 g/L), Propineb (2 g/L), atau Azoksistrobin 25 SC (0,5 ml/L) setiap 7–14 hari.\n4. Hindari pelukaan buah saat panen dan angkut untuk mencegah infeksi sekunder.\n5. Atur kelembapan kebun dengan pemangkasan naungan dan peningkatan sirkulasi udara.\n6. Aplikasi pupuk lengkap (N-P-K-Mg) sesuai anjuran untuk meningkatkan ketahanan tanaman.',
    plantIds: ['T-008', 'T-007'],
  },
  {
    id: 'PST-011',
    nama: 'Penggerek Buah Kakao (PBK)',
    namaIlmiah: 'Conopomorpha cramerella',
    jenis: 'Hama',
    kategori: 'Lepidoptera',
    tingkatRisiko: 'Sangat Tinggi',
    gejala:
      'Buah kakao matang lebih awal (prematur) namun isinya rusak, biji melekat menjadi massa kompak di dalam buah (biji berlendir), terdapat lubang gerekan kecil pada kulit buah, kehilangan hasil bisa mencapai 80% pada serangan berat.',
    penanganan:
      '1. Panen sering dan teratur setiap 7–14 hari untuk memutus siklus PBK di dalam buah.\n2. Bungkus buah kakao muda dengan kantong plastik atau kain kasa sebelum PBK bertelur (bagging).\n3. Sanitasi buah: Kumpulkan semua buah sisa panen, busuk, dan gugur; masukkan ke lubang kubur atau komposkan.\n4. Semprot insektisida Deltamethrin 25 EC (0,5 ml/L) atau Sipermetrin 50 EC pada permukaan buah muda.\n5. Lakukan pemangkasan teratur untuk membuka kanopi dan mengurangi kelembapan, serta mempermudah pengamatan.\n6. Introduksi semut hitam (Dolichoderus thoracicus) sebagai predator alami larva PBK.',
    plantIds: ['T-008'],
  },
  {
    id: 'PST-012',
    nama: 'Penyakit Gugur Daun Corynespora',
    namaIlmiah: 'Corynespora cassiicola',
    jenis: 'Penyakit',
    kategori: 'Jamur Patogen',
    tingkatRisiko: 'Tinggi',
    gejala:
      'Daun muda berwarna kuning dengan bercak nekrotik berbentuk tidak beraturan, tangkai daun membusuk dan daun rontok secara massal (gugur daun), percabangan kering dan mati dari ujung, pada serangan berat pohon karet tampak gundul dan produksi lateks terhenti.',
    penanganan:
      '1. Semprot fungisida protektif-sistemik: Hexaconazole 5 SC (0,5 ml/L) atau Difenoconazole 250 EC (0,5 ml/L) pada saat daun muda mulai membuka.\n2. Lakukan 2–3 kali aplikasi dengan interval 7 hari pada musim pembentukan daun baru (Januari–Maret).\n3. Pilih klon karet yang toleran: RRIM 600, GT 1, PB 260 relatif lebih rentan; pertimbangkan klon RRII 105, IRR 118.\n4. Pangkas cabang yang terinfeksi berat dan buang ke luar areal perkebunan.\n5. Hindari pelukaan kulit selama penyadapan pada tanaman yang sedang gejala gugur daun parah.\n6. Pantau intensitas gugur daun setiap 2 minggu, khususnya pada musim pancaroba.',
    plantIds: ['T-002'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA MASTER: SOP PENANGANAN
// ─────────────────────────────────────────────────────────────────────────────
const sopsData = [
  {
    id: 'SOP-001',
    judul: 'SOP Penanganan Ganoderma pada Kelapa Sawit',
    kategori: 'Pengendalian Penyakit',
    urgensi: 'Tinggi',
    langkah: [
      'Lakukan survei awal: Identifikasi tanaman bergejala (frond collapse, tubuh buah jamur) di seluruh areal secara sistematis.',
      'Tandai dan catat titik koordinat GPS setiap tanaman terinfeksi ke dalam sistem KARU.',
      'Pasang parit isolasi sedalam 60–80 cm mengelilingi zona infeksi dalam radius minimal 2 meter dari tanaman sakit.',
      'Injeksi batang: Bor 3–5 lubang melingkar di pangkal batang, injeksikan fungisida Hexaconazole 50–75 ml per lubang.',
      'Cabut tuntas tanaman terinfeksi berikut seluruh sistem perakarannya menggunakan excavator.',
      'Bakar semua material tanaman yang terinfeksi di lubang bekas cabutan; jangan komposkan.',
      'Tabur kapur dolomit 3 kg per lubang bekas tanam untuk menaikkan pH dan menghambat spora Ganoderma.',
      'Lakukan replanting dengan bibit varietas toleran Ganoderma setelah jeda minimal 6 bulan.',
      'Pantau tanaman di sekitar bekas titik infeksi setiap 3 bulan selama 2 tahun.',
    ],
    pestIds: ['PST-001'],
    plantIds: ['T-001'],
  },
  {
    id: 'SOP-002',
    judul: 'SOP Pengendalian Ulat Kantong dan Kumbang Tanduk Sawit',
    kategori: 'Pengendalian Hama',
    urgensi: 'Tinggi',
    langkah: [
      'Lakukan sensus populasi: Amati 5 pelepah per pohon pada 20% tanaman sampel per blok.',
      'Tentukan tingkat serangan: Ringan (<10 ekor/pelepah), Sedang (10–20 ekor), Berat (>20 ekor).',
      'Serangan Ringan (Ulat Kantong): Petik manual kantong ulat dan kumpulkan dalam kantong plastik tertutup, lalu bakar.',
      'Serangan Sedang–Berat (Ulat Kantong): Semprotkan Bacillus thuringiensis (Bt) 500 ml/ha atau Chlorpyrifos 200 EC (2 ml/L) pada permukaan bawah daun.',
      'Kumbang Tanduk: Pasang perangkap feromon (1 perangkap/5 ha) dan periksa isi perangkap setiap minggu.',
      'Kumbang Tanduk: Aplikasikan Fipronil 50 SC (3 ml/tanaman) langsung ke dalam lubang pada titik tumbuh.',
      'Musnahkan semua sumber perkembangbiakan kumbang: tunggul lapuk, tumpukan kompos basah, tandan buah segar busuk.',
      'Lakukan monitoring ulang 14 hari setelah aplikasi untuk mengevaluasi efektivitas pengendalian.',
      'Dokumentasikan semua tindakan dan hasilnya dalam aplikasi KARU.',
    ],
    pestIds: ['PST-002', 'PST-003'],
    plantIds: ['T-001'],
  },
  {
    id: 'SOP-003',
    judul: 'SOP Pengendalian Hama Tikus di Lahan Sawit dan Padi',
    kategori: 'Pengendalian Hama',
    urgensi: 'Sedang',
    langkah: [
      'Pasang rumah burung hantu (RBH) dari bahan kayu/bambu setinggi 5–6 meter, kepadatan 1 RBH per 25 hektare lahan.',
      'Bersihkan seluruh semak-semak, gulma tinggi, dan tumpukan material organik di pinggiran kebun yang menjadi sarang tikus.',
      'Lakukan gropyokan massal (perburuan serentak) bersama petani sekitar setiap awal musim tanam.',
      'Pasang perangkap jepit/kotak berpingkat di jalur aktif tikus; periksa dan kosongkan setiap hari.',
      'Letakkan umpan rodentisida berbahan Brodifacoum 0,005% pada stasiun umpan tertutup (bait station) agar aman dari hewan non-target.',
      'Pasang kolar seng (Roof-rat Guard) pada batang kelapa sawit untuk mencegah tikus memanjat mencapai tandan buah.',
      'Evaluasi populasi tikus dengan menghitung bekas gigitan tandan per minggu; target penurunan >70% dalam 4 minggu.',
    ],
    pestIds: ['PST-004'],
    plantIds: ['T-001', 'T-003'],
  },
  {
    id: 'SOP-004',
    judul: 'SOP Penanganan Penyakit Hawar, Bercak Daun, dan Antraknosa',
    kategori: 'Pengendalian Penyakit',
    urgensi: 'Sedang',
    langkah: [
      'Identifikasi jenis penyakit melalui gejala visual: Hawar daun (bercak basah memanjang), Cercospora (bercak kekuningan dengan halo), Antraknosa (bercak cekung kehitaman pada buah/ranting).',
      'Petik dan singkirkan daun/buah/ranting yang terinfeksi berat dari areal pertanaman; jangan ditinggalkan di tanah.',
      'Aplikasikan fungisida protektif: Mankozeb 80 WP (2 g/L) untuk pengendalian awal atau Propineb 70 WP (2 g/L).',
      'Jika infeksi sudah masuk jaringan (sistemik), gunakan fungisida sistemik: Propiconazole 250 EC (0,5 ml/L) atau Azoksistrobin 25 SC (0,5 ml/L).',
      'Semprot merata ke seluruh permukaan daun, batang, dan buah; ulangi setiap 7–10 hari selama musim hujan.',
      'Perbaiki sirkulasi udara dengan pemangkasan kanopi untuk mengurangi kelembapan relatif di sekitar tanaman.',
      'Perbaiki sistem drainase untuk mencegah genangan air yang mendukung perkembangan spora jamur.',
      'Evaluasi tingkat keparahan penyakit (disease severity score) sebelum dan 14 hari setelah aplikasi.',
    ],
    pestIds: ['PST-005', 'PST-010'],
    plantIds: ['T-001', 'T-005', 'T-008', 'T-007'],
  },
  {
    id: 'SOP-005',
    judul: 'SOP Pengendalian Wereng Batang Coklat dan Penggerek Batang Padi',
    kategori: 'Pengendalian Hama',
    urgensi: 'Tinggi',
    langkah: [
      'Pantau sawah sejak 2 minggu setelah tanam; amati bagian bawah rumpun padi untuk mendeteksi wereng sejak dini.',
      'Gunakan varietas padi tahan wereng dan penggerek: Inpari 13, 19, 32, 33, Ciherang.',
      'Jaga kondisi air irigasi secara berselang (intermittent irrigation) untuk mengganggu habitat wereng.',
      'Wereng — Ambang pengendalian (2 ekor/rumpun fase vegetatif, 10 ekor/rumpun fase generatif): Semprot Buprofezin 10 WP (1 g/L) atau BPMC (2 ml/L). JANGAN gunakan piretroid.',
      'Penggerek batang — Deteksi deadheart/whitehead: Lepaskan Trichogramma japonicum (1 kartu/ha) mulai 2 minggu setelah tanam, ulangi setiap minggu selama 8 minggu.',
      'Penggerek batang — Jika serangan >10% deadheart: Aplikasikan Klorantraniliprol 200 SC (0,3 ml/L) atau Karbofuran 3G granul (20 kg/ha) pada fase anakan.',
      'Segera bajak jerami panen atau bakar di tempat untuk membunuh larva penggerek yang tersisa.',
      'Lakukan tanam serempak (perbedaan tanam <2 minggu dalam satu hamparan) untuk memutus siklus hama antar musim.',
    ],
    pestIds: ['PST-007', 'PST-008'],
    plantIds: ['T-003', 'T-004'],
  },
  {
    id: 'SOP-006',
    judul: 'SOP Umum Monitoring dan Inspeksi Rutin Kebun',
    kategori: 'Monitoring',
    urgensi: 'Rendah',
    langkah: [
      'Lakukan inspeksi visual rutin minimal 2× per bulan pada seluruh areal kerja yang ditugaskan.',
      'Bawa perangkat mobile KARU saat inspeksi; pindai QR Node di setiap titik pemantauan.',
      'Foto minimal 3 daun/bagian tanaman berbeda per titik inspeksi untuk dianalisis AI.',
      'Catat setiap anomali (perubahan warna, tekstur, gejala tidak biasa) meskipun belum dapat diidentifikasi.',
      'Periksa kondisi drainase, saluran air, dan kebersihan parit setiap kunjungan.',
      'Pantau keberadaan musuh alami (laba-laba, burung, kumbang predator) sebagai indikator kesehatan ekosistem.',
      'Laporkan temuan urgent ke admin/supervisor melalui notifikasi aplikasi KARU dalam waktu 1×24 jam.',
      'Rekap hasil monitoring bulanan dan bandingkan dengan data historis untuk mendeteksi tren serangan.',
    ],
    pestIds: [],
    plantIds: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   KARU — Seeder Data Master (Tanaman, Hama/Penyakit, SOP)');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // ── 1. TANAMAN ─────────────────────────────────────────────────────────
    console.log('📌 [1/6] Menyemai data Tanaman...');
    let plantInserted = 0;
    let plantSkipped = 0;
    for (const plant of plantsData) {
      const existing = await db.select().from(plants).where(eq(plants.id, plant.id)).limit(1);
      if (existing.length > 0) {
        plantSkipped++;
        continue;
      }
      await db.insert(plants).values({
        id: plant.id,
        namaLokal: plant.namaLokal,
        namaIlmiah: plant.namaIlmiah,
        kategori: plant.kategori,
        risikoPenyakit: plant.risikoPenyakit,
        siklusPanen: plant.siklusPanen,
        habitat: plant.habitat,
        deskripsi: plant.deskripsi,
      });
      plantInserted++;
    }
    console.log(`   ✅ ${plantInserted} tanaman ditambahkan, ${plantSkipped} dilewati (sudah ada).`);

    // ── 2. HAMA & PENYAKIT ─────────────────────────────────────────────────
    console.log('\n📌 [2/6] Menyemai data Hama & Penyakit...');
    let pestInserted = 0;
    let pestSkipped = 0;
    for (const pest of pestsDiseaseData) {
      const existing = await db.select().from(pestsDiseases).where(eq(pestsDiseases.id, pest.id)).limit(1);
      if (existing.length > 0) {
        pestSkipped++;
        continue;
      }
      await db.insert(pestsDiseases).values({
        id: pest.id,
        nama: pest.nama,
        namaIlmiah: pest.namaIlmiah,
        jenis: pest.jenis,
        kategori: pest.kategori,
        tingkatRisiko: pest.tingkatRisiko,
        gejala: pest.gejala,
        penanganan: pest.penanganan,
      });
      pestInserted++;
    }
    console.log(`   ✅ ${pestInserted} hama/penyakit ditambahkan, ${pestSkipped} dilewati (sudah ada).`);

    // ── 3. RELASI TANAMAN ↔ HAMA/PENYAKIT ─────────────────────────────────
    console.log('\n📌 [3/6] Membuat relasi Tanaman ↔ Hama/Penyakit...');
    let relInserted = 0;
    for (const pest of pestsDiseaseData) {
      for (const plantId of pest.plantIds) {
        // Pastikan relasi belum ada
        const existing = await db
          .select()
          .from(plantPestRelations)
          .where(eq(plantPestRelations.pestDiseaseId, pest.id))
          .limit(20);

        const alreadyLinked = existing.some((r) => r.plantId === plantId);
        if (!alreadyLinked) {
          await db.insert(plantPestRelations).values({
            plantId,
            pestDiseaseId: pest.id,
          });
          relInserted++;
        }
      }
    }
    console.log(`   ✅ ${relInserted} relasi tanaman-hama dibuat.`);

    // ── 4. SOP ─────────────────────────────────────────────────────────────
    console.log('\n📌 [4/6] Menyemai data SOP Penanganan...');
    let sopInserted = 0;
    let sopSkipped = 0;
    for (const sop of sopsData) {
      const existing = await db.select().from(sops).where(eq(sops.id, sop.id)).limit(1);
      if (existing.length > 0) {
        sopSkipped++;
        continue;
      }
      await db.insert(sops).values({
        id: sop.id,
        judul: sop.judul,
        kategori: sop.kategori,
        urgensi: sop.urgensi,
        langkah: sop.langkah,
      });
      sopInserted++;
    }
    console.log(`   ✅ ${sopInserted} SOP ditambahkan, ${sopSkipped} dilewati (sudah ada).`);

    // ── 5. RELASI SOP ↔ HAMA/PENYAKIT ─────────────────────────────────────
    console.log('\n📌 [5/6] Membuat relasi SOP ↔ Hama/Penyakit...');
    let sopPestRel = 0;
    for (const sop of sopsData) {
      for (const pestId of sop.pestIds) {
        const existing = await db
          .select()
          .from(sopPestRelations)
          .where(eq(sopPestRelations.sopId, sop.id))
          .limit(20);

        const alreadyLinked = existing.some((r) => r.pestDiseaseId === pestId);
        if (!alreadyLinked) {
          await db.insert(sopPestRelations).values({
            sopId: sop.id,
            pestDiseaseId: pestId,
          });
          sopPestRel++;
        }
      }
    }
    console.log(`   ✅ ${sopPestRel} relasi SOP-hama dibuat.`);

    // ── 6. RELASI SOP ↔ TANAMAN ────────────────────────────────────────────
    console.log('\n📌 [6/6] Membuat relasi SOP ↔ Tanaman...');
    let sopPlantRel = 0;
    for (const sop of sopsData) {
      for (const plantId of sop.plantIds) {
        const existing = await db
          .select()
          .from(sopPlantRelations)
          .where(eq(sopPlantRelations.sopId, sop.id))
          .limit(20);

        const alreadyLinked = existing.some((r) => r.plantId === plantId);
        if (!alreadyLinked) {
          await db.insert(sopPlantRelations).values({
            sopId: sop.id,
            plantId,
          });
          sopPlantRel++;
        }
      }
    }
    console.log(`   ✅ ${sopPlantRel} relasi SOP-tanaman dibuat.`);

    // ── SELESAI ────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   ✅ Seeding data master BERHASIL diselesaikan!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nLangkah selanjutnya:');
    console.log('  npm run db:seed-scans   → Isi riwayat AI scan (opsional)');
    console.log('  npm run dev             → Jalankan dashboard untuk verifikasi\n');
  } catch (err) {
    console.error('\n❌ Gagal melakukan seeding data master:', err);
  } finally {
    process.exit(0);
  }
}

main();
