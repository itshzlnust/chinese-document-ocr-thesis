import { OCRDocument } from '../types';

export const SAMPLE_DOCUMENTS: OCRDocument[] = [
  {
    id: 'doc-monkeyocr-sample',
    title: '📘 MonkeyOCR v2 Intro & Learning Guide',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop',
    width: 1000,
    height: 700,
    fullChineseText: '欢迎使用 MonkeyOCR v2 文档识别与翻译系统。学习汉字非常有趣，通过自动识别与卡片复习，能快速掌握中文。',
    fullIndonesianText: 'Selamat datang di sistem pengenalan dokumen dan terjemahan MonkeyOCR v2. Belajar aksara Mandarin sangat menyenangkan, melalui pengenalan otomatis dan peninjauan kartu flashcard, Anda dapat menguasai Bahasa Mandarin dengan cepat.',
    blocks: [
      {
        id: 'block-1',
        bbox: { x: 5, y: 10, width: 90, height: 18 },
        chineseText: '欢迎使用 MonkeyOCR v2 文档识别与翻译系统。',
        indonesianTranslation: 'Selamat datang di sistem pengenalan dokumen dan terjemahan MonkeyOCR v2.',
        tokens: [
          {
            id: 'tok-1',
            chinese: '文档',
            pinyin: 'wén dàng',
            hskLevel: 4,
            radical: '木 (Kayu)',
            indonesianDef: 'Dokumen; berkas.',
            englishDef: 'Document; file.',
            grammarNotes: 'Kata benda teknis.',
            examples: [{ id: 'e1', chinese: '请上传文档。', pinyin: 'Qǐng shàngchuán wéndàng.', indonesian: 'Silakan unggah dokumen.' }],
            bbox: { x: 38, y: 12, width: 12, height: 12 }
          },
          {
            id: 'tok-2',
            chinese: '识',
            pinyin: 'shí',
            hskLevel: 2,
            radical: '讠 (Kata)',
            indonesianDef: 'Mengenal; mengidentifikasi.',
            englishDef: 'To recognize; identify.',
            grammarNotes: 'Komponen kata 识别 (Identifikasi).',
            examples: [{ id: 'e2', chinese: '识别汉字。', pinyin: 'Shíbié hànzì.', indonesian: 'Mengidentifikasi karakter Han.' }],
            bbox: { x: 51, y: 12, width: 7, height: 12 }
          },
          {
            id: 'tok-3',
            chinese: '别',
            pinyin: 'bié',
            hskLevel: 2,
            radical: '刂 (Pisau)',
            indonesianDef: 'Membedakan; memisahkan.',
            englishDef: 'To distinguish.',
            grammarNotes: 'Bagian dari 识别.',
            examples: [{ id: 'e3', chinese: '区别。', pinyin: 'Qūbié.', indonesian: 'Perbedaan.' }],
            bbox: { x: 59, y: 12, width: 7, height: 12 }
          },
          {
            id: 'tok-4',
            chinese: '翻译',
            pinyin: 'fān yì',
            hskLevel: 3,
            radical: '讠 (Kata)',
            indonesianDef: 'Menerjemahkan; terjemahan.',
            englishDef: 'Translate; translation.',
            grammarNotes: 'Dapat berupa kata kerja atau kata benda.',
            examples: [{ id: 'e4', chinese: '翻译文档。', pinyin: 'Fānyì wéndàng.', indonesian: 'Menerjemahkan dokumen.' }],
            bbox: { x: 69, y: 12, width: 12, height: 12 }
          }
        ]
      },
      {
        id: 'block-2',
        bbox: { x: 5, y: 35, width: 90, height: 20 },
        chineseText: '学习汉字非常有趣，通过自动识别与卡片复习，',
        indonesianTranslation: 'Belajar aksara Mandarin sangat menyenangkan, melalui pengenalan otomatis dan peninjauan kartu,',
        tokens: [
          {
            id: 'tok-5',
            chinese: '学习',
            pinyin: 'xué xí',
            hskLevel: 1,
            radical: '子 (Anak)',
            indonesianDef: 'Belajar; mempelajari.',
            englishDef: 'To learn; to study.',
            grammarNotes: 'Kata kerja utama untuk aktivitas belajar.',
            examples: [{ id: 'e5', chinese: '我学习中文。', pinyin: 'Wǒ xuéxí zhōngwén.', indonesian: 'Saya belajar Mandarin.' }],
            bbox: { x: 6, y: 37, width: 12, height: 14 }
          },
          {
            id: 'tok-6',
            chinese: '汉字',
            pinyin: 'hàn zì',
            hskLevel: 2,
            radical: '宀 (Atap)',
            indonesianDef: 'Karakter Han; Aksara Mandarin.',
            englishDef: 'Chinese characters.',
            grammarNotes: 'Aksara tulisan tradisional & sederhana.',
            examples: [{ id: 'e6', chinese: '汉字很美。', pinyin: 'Hànzì hěn měi.', indonesian: 'Karakter Han sangat indah.' }],
            bbox: { x: 19, y: 37, width: 12, height: 14 }
          },
          {
            id: 'tok-7',
            chinese: '猴',
            pinyin: 'hóu',
            hskLevel: 4,
            radical: '犭 (Hewan)',
            indonesianDef: 'Monyet / Monkey (MonkeyOCR).',
            englishDef: 'Monkey.',
            grammarNotes: 'Nama maskot AI MonkeyOCR v2.',
            examples: [{ id: 'e7', chinese: 'MonkeyOCR 模型。', pinyin: 'MonkeyOCR móxíng.', indonesian: 'Model MonkeyOCR.' }],
            bbox: { x: 50, y: 37, width: 8, height: 14 }
          },
          {
            id: 'tok-8',
            chinese: '卡片',
            pinyin: 'kǎ piàn',
            hskLevel: 3,
            radical: '卜 (Ramalan)',
            indonesianDef: 'Kartu; flashcards.',
            englishDef: 'Card; flashcard.',
            grammarNotes: 'Kartu latihan memori.',
            examples: [{ id: 'e8', chinese: '记忆卡片。', pinyin: 'Jìyì kǎpiàn.', indonesian: 'Kartu memori.' }],
            bbox: { x: 64, y: 37, width: 12, height: 14 }
          }
        ]
      },
      {
        id: 'block-3',
        bbox: { x: 5, y: 62, width: 90, height: 20 },
        chineseText: '能快速掌握中文，听懂并运用自如。',
        indonesianTranslation: 'Dapat menguasai Bahasa Mandarin dengan cepat, mengerti saat mendengar dan menggunakannya dengan lancar.',
        tokens: [
          {
            id: 'tok-9',
            chinese: '中文',
            pinyin: 'zhōng wén',
            hskLevel: 1,
            radical: '文 (Tulisan)',
            indonesianDef: 'Bahasa Mandarin.',
            englishDef: 'Chinese language.',
            grammarNotes: 'Bahasa Tionghoa.',
            examples: [{ id: 'e9', chinese: '说中文。', pinyin: 'Shuō zhōngwén.', indonesian: 'Bicara Bahasa Mandarin.' }],
            bbox: { x: 30, y: 64, width: 12, height: 14 }
          },
          {
            id: 'tok-10',
            chinese: '懂',
            pinyin: 'dǒng',
            hskLevel: 2,
            radical: '忄 (Hati)',
            indonesianDef: 'Mengerti; memahami.',
            englishDef: 'To understand.',
            grammarNotes: 'Komplemen hasil: 听懂 (Dengar lalu mengerti).',
            examples: [{ id: 'e10', chinese: '我听懂了。', pinyin: 'Wǒ tīng dǒng le.', indonesian: 'Saya sudah mengerti.' }],
            bbox: { x: 48, y: 64, width: 8, height: 14 }
          }
        ]
      }
    ]
  },
  {
    id: 'doc-chinese-story',
    title: '📜 Cerita Pendek: 猴子与山 (Monyet dan Gunung)',
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    width: 1000,
    height: 700,
    fullChineseText: '从前有一只聪明的猴子，住在高山之上。它每天学习新的本领，用心认识世界。',
    fullIndonesianText: 'Dahulu kala ada seekor monyet yang cerdas, tinggal di atas gunung yang tinggi. Setiap hari dia belajar keahlian baru dan mengenal dunia dengan sungguh-sungguh.',
    blocks: [
      {
        id: 'story-1',
        bbox: { x: 8, y: 15, width: 84, height: 30 },
        chineseText: '从前有一只聪明的猴子，住在高山之上。',
        indonesianTranslation: 'Dahulu kala ada seekor monyet yang cerdas, tinggal di atas gunung yang tinggi.',
        tokens: [
          {
            id: 'tok-story-1',
            chinese: '猴',
            pinyin: 'hóu',
            hskLevel: 4,
            radical: '犭 (Hewan)',
            indonesianDef: 'Monyet; kera.',
            englishDef: 'Monkey.',
            grammarNotes: 'Kata benda.',
            examples: [{ id: 'se1', chinese: '小猴子。', pinyin: 'Xiǎo hóuzi.', indonesian: 'Monyet kecil.' }],
            bbox: { x: 42, y: 18, width: 10, height: 18 }
          }
        ]
      },
      {
        id: 'story-2',
        bbox: { x: 8, y: 55, width: 84, height: 30 },
        chineseText: '它每天学习新的本领，用心认识世界。',
        indonesianTranslation: 'Setiap hari dia belajar keahlian baru dan mengenal dunia dengan sungguh-sungguh.',
        tokens: [
          {
            id: 'tok-story-2',
            chinese: '学习',
            pinyin: 'xué xí',
            hskLevel: 1,
            radical: '子 (Anak)',
            indonesianDef: 'Belajar; menuntut ilmu.',
            englishDef: 'To study.',
            grammarNotes: 'Kata kerja.',
            examples: [{ id: 'se2', chinese: '好好学习。', pinyin: 'Hǎohǎo xuéxí.', indonesian: 'Belajar dengan baik.' }],
            bbox: { x: 26, y: 58, width: 14, height: 18 }
          },
          {
            id: 'tok-story-3',
            chinese: '识',
            pinyin: 'shí',
            hskLevel: 2,
            radical: '讠 (Kata)',
            indonesianDef: 'Mengenal (认识).',
            englishDef: 'To know; recognize.',
            grammarNotes: 'Dua karakter 认识 (mengenal).',
            examples: [{ id: 'se3', chinese: '很高兴认识你。', pinyin: 'Hěn gāoxìng rènshí nǐ.', indonesian: 'Senang berkenalan denganmu.' }],
            bbox: { x: 64, y: 58, width: 8, height: 18 }
          }
        ]
      }
    ]
  }
];
