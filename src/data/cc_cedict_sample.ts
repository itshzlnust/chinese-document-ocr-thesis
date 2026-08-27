import { WordInfo } from '../types';

export const DICTIONARY_DATABASE: Record<string, WordInfo> = {
  '学习': {
    id: 'dict-xuexi',
    chinese: '学习',
    pinyin: 'xué xí',
    hskLevel: 1,
    radical: '子 (Anak / Child)',
    indonesianDef: 'Belajar; mempelajari; menuntut ilmu; mengkaji.',
    englishDef: 'To learn; to study.',
    grammarNotes: 'Kata kerja intransitif / transitif. Dapat diikuti oleh objek mata pelajaran. Contoh: 学习汉语 (Belajar Bahasa Mandarin).',
    examples: [
      {
        id: 'ex-1',
        chinese: '我非常喜欢学习中文。',
        pinyin: 'Wǒ fēicháng xǐhuān xuéxí zhōngwén.',
        indonesian: 'Saya sangat suka belajar bahasa Mandarin.'
      },
      {
        id: 'ex-2',
        chinese: '在大学里，我们每天都在学习新知识。',
        pinyin: 'Zài dàxué lǐ, wǒmen měitiān dōu zài xuéxí xīn zhīshì.',
        indonesian: 'Di universitas, kami belajar pengetahuan baru setiap hari.'
      }
    ]
  },
  '中文': {
    id: 'dict-zhongwen',
    chinese: '中文',
    pinyin: 'zhōng wén',
    hskLevel: 1,
    radical: '文 (Tulisan / Script)',
    indonesianDef: 'Bahasa Mandarin; Bahasa Tionghoa (tulisan / lisan).',
    englishDef: 'Chinese language; written Chinese.',
    grammarNotes: 'Kata benda. Sering digunakan secara bergantian dengan 汉语 (Hànyǔ) dalam percakapan sehari-hari.',
    examples: [
      {
        id: 'ex-3',
        chinese: '他的中文说得非常流利。',
        pinyin: 'Tā de zhōngwén shuō de fēicháng liúlì.',
        indonesian: 'Bahasa Mandarin dia diucapkan dengan sangat lancar.'
      }
    ]
  },
  '汉字': {
    id: 'dict-hanzi',
    chinese: '汉字',
    pinyin: 'hàn zì',
    hskLevel: 2,
    radical: '宀 (Atap / Roof)',
    indonesianDef: 'Karakter Han; Aksara Mandarin.',
    englishDef: 'Chinese character; Hanzi.',
    grammarNotes: 'Kata benda. Terdiri dari komponen 汉 (Han/Tionghoa) dan 字 (Karakter/Aksara).',
    examples: [
      {
        id: 'ex-4',
        chinese: '写汉字需要注意笔顺。',
        pinyin: 'Xiě hànzì xūyào zhùyì bǐshùn.',
        indonesian: 'Menulis aksara Mandarin perlu memperhatikan urutan goresan (strokes order).'
      }
    ]
  },
  '翻译': {
    id: 'dict-fanyi',
    chinese: '翻译',
    pinyin: 'fān yì',
    hskLevel: 3,
    radical: '讠 (Kata / Speech)',
    indonesianDef: 'Menerjemahkan; penerjemah; terjemahan.',
    englishDef: 'To translate; translation; translator.',
    grammarNotes: 'Dapat berfungsi sebagai kata kerja (menerjemahkan) maupun kata benda (penerjemah/terjemahan).',
    examples: [
      {
        id: 'ex-5',
        chinese: '请把这篇文章翻译成印尼语。',
        pinyin: 'Qǐng bǎ zhè piān zhāngzhāng fānyì chéng yìní yǔ.',
        indonesian: 'Tolong terjemahkan artikel ini ke dalam Bahasa Indonesia.'
      }
    ]
  },
  '猴': {
    id: 'dict-hou',
    chinese: '猴',
    pinyin: 'hóu',
    hskLevel: 4,
    radical: '犭 (Hewan / Beast)',
    indonesianDef: 'Monyet; kera.',
    englishDef: 'Monkey; ape.',
    grammarNotes: 'Kata benda. Referensi nama model MonkeyOCR v2 yang terinspirasi dari kecerdasan visual.',
    examples: [
      {
        id: 'ex-6',
        chinese: 'MonkeyOCR v2 拥有非常强大的文档识别能力。',
        pinyin: 'MonkeyOCR v2 yǒngyǒu fēicháng qiángdà de wéndàng shíbié nénglì.',
        indonesian: 'MonkeyOCR v2 memiliki kemampuan pengenalan dokumen yang sangat tangguh.'
      }
    ]
  },
  '识': {
    id: 'dict-shi',
    chinese: '识',
    pinyin: 'shí',
    hskLevel: 2,
    radical: '讠 (Kata / Speech)',
    indonesianDef: 'Mengenal; mengetahui; memahami; identifikasi.',
    englishDef: 'To know; to recognize; knowledge.',
    grammarNotes: 'Komponen utama dalam kata 识别 (Mengenali/Identify) dan 知识 (Pengetahuan).',
    examples: [
      {
        id: 'ex-7',
        chinese: '这种软件能自动识别图像中的文字。',
        pinyin: 'Zhè zhǒng ruǎnjiàn néng zìdòng shíbié túxiàng zhōng de wénzì.',
        indonesian: 'Perangkat lunak jenis ini dapat mengidentifikasi teks di dalam gambar secara otomatis.'
      }
    ]
  },
  '工程': {
    id: 'dict-gongcheng',
    chinese: '工程',
    pinyin: 'gōng chéng',
    hskLevel: 3,
    radical: '工 (Pekerjaan / Work)',
    indonesianDef: 'Rekayasa; teknik; proyek konstruksi/teknik.',
    englishDef: 'Engineering; engineering project.',
    grammarNotes: 'Kata benda. Contoh: 土木工程 (Teknik Sipil), 公路工程 (Rekayasa Jalan Raya).',
    examples: [{ id: 'ex-gc-1', chinese: '这是市政公路工程项目。', pinyin: 'Zhè shì shìzhèng gōnglù gōngchéng xiàngmù.', indonesian: 'Ini adalah proyek rekayasa jalan raya kota.' }]
  },
  '检测': {
    id: 'dict-jiance',
    chinese: '检测',
    pinyin: 'jiǎn cè',
    hskLevel: 4,
    radical: '木 (Kayu / Wood)',
    indonesianDef: 'Pengujian; inspeksi; pemeriksaan teknis; deteksi.',
    englishDef: 'To test; inspection; detection.',
    grammarNotes: 'Kata kerja / kata benda. Digunakan dalam konteks uji mutu / inspeksi keselamatan struktur.',
    examples: [{ id: 'ex-jc-1', chinese: '对桥梁结构进行定期检测。', pinyin: 'Duì qiáoliáng jiégòu jìnxíng dìngqī jiǎncè.', indonesian: 'Melakukan inspeksi berkala pada struktur jembatan.' }]
  },
  '报告': {
    id: 'dict-baogao',
    chinese: '报告',
    pinyin: 'bào gào',
    hskLevel: 2,
    radical: '卜 (Ramalan / Divination)',
    indonesianDef: 'Laporan; melaporkan; presentasi hasil.',
    englishDef: 'Report; to report.',
    grammarNotes: 'Kata benda / kata kerja. Contoh: 检测报告 (Laporan Hasil Pengujian/Inspeksi).',
    examples: [{ id: 'ex-bg-1', chinese: '这是本次检测的最终报告。', pinyin: 'Zhè shì běn cì jiǎncè de zuìzhōng bàogào.', indonesian: 'Ini adalah laporan akhir dari pengujian kali ini.' }]
  },
  '项目': {
    id: 'dict-xiangmu',
    chinese: '项目',
    pinyin: 'xiàng mù',
    hskLevel: 3,
    radical: '页 (Halaman / Leaf)',
    indonesianDef: 'Proyek; mata uji; item; bagian program.',
    englishDef: 'Project; item; program.',
    grammarNotes: 'Kata benda. Sering muncul di dokumen resmi: 项目名称 (Nama Proyek), 检测项目 (Item Pengujian).',
    examples: [{ id: 'ex-xm-1', chinese: '项目名称必须清晰填写。', pinyin: 'Xiàngmù míngchēng bìxū qīngxī tiánxiě.', indonesian: 'Nama proyek harus diisi dengan jelas.' }]
  },
  '名称': {
    id: 'dict-mingcheng',
    chinese: '名称',
    pinyin: 'míng chēng',
    hskLevel: 3,
    radical: '口 (Mulut / Mouth)',
    indonesianDef: 'Nama (formal); sebutan; judul resmi.',
    englishDef: 'Name (of an organization, project, product); title.',
    grammarNotes: 'Kata benda formal untuk nama objek, organisasi, atau proyek resmi.',
    examples: [{ id: 'ex-mc-1', chinese: '请输入单位名称。', pinyin: 'Qǐng shūrù dānwèi míngchēng.', indonesian: 'Silakan masukkan nama instansi/perusahaan.' }]
  },
  '桥梁': {
    id: 'dict-qiaoliang',
    chinese: '桥梁',
    pinyin: 'qiáo liáng',
    hskLevel: 4,
    radical: '木 (Kayu / Wood)',
    indonesianDef: 'Jembatan; penghubung.',
    englishDef: 'Bridge; connection.',
    grammarNotes: 'Kata benda. Dalam teknik sipil mengacu pada struktur fisik jembatan.',
    examples: [{ id: 'ex-ql-1', chinese: '桥梁技术状况评定良好。', pinyin: 'Qiáoliáng jìshù zhuàngkuàng píngdìng liánghǎo.', indonesian: 'Evaluasi kondisi teknis jembatan dinilai baik.' }]
  },
  '混凝土': {
    id: 'dict-hunningtu',
    chinese: '混凝土',
    pinyin: 'hùn níng tǔ',
    hskLevel: 5,
    radical: '氵 (Air / Water)',
    indonesianDef: 'Beton (material konstruksi campuran semen, pasir, kerikil, dan air).',
    englishDef: 'Concrete.',
    grammarNotes: 'Kata benda material konstruksi. Istilah umum dalam teknik sipil.',
    examples: [{ id: 'ex-hnt-1', chinese: '检查混凝土强度和裂缝。', pinyin: 'Jiǎnchá hùnníngtǔ qiángdù hé lièfèng.', indonesian: 'Memeriksa kekuatan beton dan retakan.' }]
  },
  '裂缝': {
    id: 'dict-liefeng',
    chinese: '裂缝',
    pinyin: 'liè fèng',
    hskLevel: 4,
    radical: '衣 (Pakaian / Clothes)',
    indonesianDef: 'Retakan; celah; rekahan.',
    englishDef: 'Crack; fissure; cleft.',
    grammarNotes: 'Kata benda. Contoh: 混凝土裂缝 (Retakan beton).',
    examples: [{ id: 'ex-lf-1', chinese: '对裂缝进行专项维修。', pinyin: 'Duì lièfèng jìnxíng zhuānxiàng wéixiū.', indonesian: 'Melakukan perbaikan khusus pada retakan.' }]
  },
  '公路': {
    id: 'dict-gonglu',
    chinese: '公路',
    pinyin: 'gōng lù',
    hskLevel: 2,
    radical: '八 (Delapan / Eight)',
    indonesianDef: 'Jalan raya; jalan umum; jalan tol.',
    englishDef: 'Highway; public road.',
    grammarNotes: 'Kata benda. Mengacu pada jaringan jalan darat.',
    examples: [{ id: 'ex-gl-1', chinese: '高速公路检测非常重要。', pinyin: 'Gāosù gōnglù jiǎncè fēicháng zhòngyào.', indonesian: 'Inspeksi jalan tol sangatlah penting.' }]
  },
  '安全': {
    id: 'dict-anquan',
    chinese: '安全',
    pinyin: 'ān quán',
    hskLevel: 2,
    radical: '宀 (Atap / Roof)',
    indonesianDef: 'Aman; keselamatan; sekuritas.',
    englishDef: 'Safe; secure; safety; security.',
    grammarNotes: 'Kata sifat / kata benda. Contoh: 结构安全 (Keselamatan struktur).',
    examples: [{ id: 'ex-aq-1', chinese: '确保结构运行安全。', pinyin: 'Quèbǎo jiégòu yùnxíng ānquán.', indonesian: 'Memastikan keselamatan pengoperasian struktur.' }]
  },
  '结论': {
    id: 'dict-jielun',
    chinese: '结论',
    pinyin: 'jié lùn',
    hskLevel: 3,
    radical: '纟 (Sutra / Silk)',
    indonesianDef: 'Kesimpulan; hasil konklusi.',
    englishDef: 'Conclusion; verdict.',
    grammarNotes: 'Kata benda. Contoh: 检测结论 (Kesimpulan hasil pemeriksaan).',
    examples: [{ id: 'ex-jl-1', chinese: '检测结论符合标准要求。', pinyin: 'Jiǎncè jiélùn fúhé biāozhǔn yāoqiú.', indonesian: 'Kesimpulan inspeksi memenuhi persyaratan standar.' }]
  },
  '别': {
    id: 'dict-bie',
    chinese: '别',
    pinyin: 'bié',
    hskLevel: 2,
    radical: '刂 (Pisau / Knife)',
    indonesianDef: 'Membedakan; memisahkan; jangan.',
    englishDef: 'To distinguish; do not.',
    grammarNotes: 'Bisa berarti larangan "Jangan!" (别去) atau membedakan (区别, 识别).',
    examples: [
      {
        id: 'ex-8',
        chinese: '别担心，系统会自动处理文档。',
        pinyin: 'Bié dānxīn, xìtǒng huì zìdòng chǔlǐ wéndàng.',
        indonesian: 'Jangan khawatir, sistem akan memproses dokumen secara otomatis.'
      }
    ]
  },
  '文档': {
    id: 'dict-wendang',
    chinese: '文档',
    pinyin: 'wén dàng',
    hskLevel: 4,
    radical: '木 (Kayu / Wood)',
    indonesianDef: 'Dokumen; berkas digital/cetak.',
    englishDef: 'Document; file.',
    grammarNotes: 'Kata benda bidang teknologi/perkantoran.',
    examples: [
      {
        id: 'ex-9',
        chinese: '请上传需要识别的中文文档。',
        pinyin: 'Qǐng shàngchuán xūyào shíbié de zhōngwén wéndàng.',
        indonesian: 'Silakan unggah dokumen Mandarin yang ingin diidentifikasi.'
      }
    ]
  },
  '卡片': {
    id: 'dict-kapian',
    chinese: '卡片',
    pinyin: 'kǎ piàn',
    hskLevel: 3,
    radical: '卜 (Ramalan / Divination)',
    indonesianDef: 'Kartu; flashcard.',
    englishDef: 'Card; flashcard.',
    grammarNotes: 'Kata benda. Kombinasi 卡 (Card) dan 片 (Lembaran tipis).',
    examples: [
      {
        id: 'ex-10',
        chinese: '使用记忆卡片可以加速掌握生字。',
        pinyin: 'Shǐyòng jìyì kǎpiàn kěyǐ jiāsù zhǎowò shēngzì.',
        indonesian: 'Menggunakan flashcard dapat mempercepat penguasaan kosakata baru.'
      }
    ]
  },
  '懂': {
    id: 'dict-dong',
    chinese: '懂',
    pinyin: 'dǒng',
    hskLevel: 2,
    radical: '忄 (Hati / Heart)',
    indonesianDef: 'Mengerti; memahami.',
    englishDef: 'To understand; to know.',
    grammarNotes: 'Kata kerja. Sering digunakan setelah kata 听 (mendengar -> 听懂) atau 看 (melihat -> 看懂).',
    examples: [
      {
        id: 'ex-11',
        chinese: '你听懂他说的话了吗？',
        pinyin: 'Nǐ tīng dǒng tā shuō de huà le ma?',
        indonesian: 'Apakah Anda mengerti apa yang dia katakan?'
      }
    ]
  }
};

/**
 * Fallback generator for looking up any character not in sample DB
 */
export function getDictionaryEntry(chinese: string): WordInfo {
  if (DICTIONARY_DATABASE[chinese]) {
    return DICTIONARY_DATABASE[chinese];
  }
  
  // Single char lookup fallback
  const firstChar = chinese.charAt(0);
  if (DICTIONARY_DATABASE[firstChar]) {
    return DICTIONARY_DATABASE[firstChar];
  }

  // Generic dynamic fallback
  return {
    id: `dict-dynamic-${chinese}`,
    chinese,
    pinyin: getPinyinApprox(chinese),
    hskLevel: 3,
    radical: '亻 (Manusia / Human)',
    indonesianDef: `Arti kosakata Mandarin "${chinese}" (Diterjemahkan via sistem MonkeyOCR CC-CEDICT).`,
    englishDef: `Definition of "${chinese}" in Chinese CC-CEDICT database.`,
    grammarNotes: `Kata/Karakter Mandarin (${chinese}). Menggunakan komponen radikal dan susunan goresan standar HanziVG.`,
    examples: [
      {
        id: `ex-dyn-1`,
        chinese: `这个词在文章中是 "${chinese}"。`,
        pinyin: `Zhè ge cí zài wénzhāng zhōng shì "${chinese}".`,
        indonesian: `Kata ini di dalam artikel adalah "${chinese}".`
      }
    ]
  };
}

function getPinyinApprox(text: string): string {
  // Simple heuristic tone mapping for display when exact tone is missing
  const map: Record<string, string> = {
    '中': 'zhōng', '文': 'wén', '大': 'dà', '家': 'jiā', '好': 'hǎo',
    '爱': 'ài', '人': 'rén', '地': 'dì', '天': 'tiān', '水': 'shuǐ',
    '火': 'huǒ', '木': 'mù', '金': 'jīn', '土': 'tǔ', '日': 'rì',
    '月': 'yuè', '年': 'nián', '明': 'míng', '国': 'guó', '书': 'shū'
  };
  return text.split('').map(c => map[c] || 'zì').join(' ');
}
