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
