#!/usr/bin/env python3
"""
MonkeyOCR v2-B-Parsing FastAPI Backend — CPU Mode (Opsi A)
===========================================================
Menggunakan modul resmi MonkeyOCR v2-B-Parsing dari D:\\monkey\\MonkeyOCRv2\\parsing\\cpu
untuk OCR dokumen dengan bounding box yang presisi.

Model path  : D:\\monkey\\MonkeyOCRv2\\model_weight\\MonkeyOCRv2-B-Parsing
Parsing repo: D:\\monkey\\MonkeyOCRv2\\parsing

Setup:
    conda activate MonkeyOCRv2Parsing
    python server.py  →  http://localhost:8000

Cara kerja:
  - Image : MonkeyOCRv2 end2end → parse_end2end_output → bbox pixel → %
  - PDF   : pypdfium2 render halaman → MonkeyOCRv2 end2end → bbox
"""

import io
import os
import re
import sys
import uuid
import json
import time
import logging
import traceback
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

# ─────────────────────────────────────────────────────────────
# UTF-8 stdout untuk Windows
# ─────────────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────
# Inject parsing repo ke sys.path agar core_runner dapat diimport
# ─────────────────────────────────────────────────────────────
MONKEY_REPO_ROOT = Path(os.getenv("MONKEYOCR_REPO", r"D:\monkey\MonkeyOCRv2"))
MONKEY_PARSING_DIR = MONKEY_REPO_ROOT / "parsing"
LOCAL_MODEL_PATH = Path(os.getenv(
    "MONKEYOCR_PATH",
    str(MONKEY_REPO_ROOT / "model_weight" / "MonkeyOCRv2-B-Parsing"),
))

for _inject in [str(MONKEY_PARSING_DIR)]:
    if _inject not in sys.path:
        sys.path.insert(0, _inject)

import torch
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("MonkeyOCRv2")
logger.info(f"Model path : {LOCAL_MODEL_PATH}")
logger.info(f"Parsing dir: {MONKEY_PARSING_DIR}")
logger.info(f"sys.path[0]: {sys.path[0]}")

# ─────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="MonkeyOCR v2-B-Parsing Backend (CPU)",
    description="Real bounding box OCR using MonkeyOCR v2-B-Parsing (Opsi A — CPU mode)",
    version="3.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Optional imports
# ─────────────────────────────────────────────────────────────
try:
    import pypdfium2 as pdfium
    HAS_PDFIUM = True
    logger.info("pypdfium2 tersedia — PDF rendering aktif")
except ImportError:
    HAS_PDFIUM = False
    logger.warning("pypdfium2 tidak terinstall — PDF rendering dinonaktifkan")

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

# ─────────────────────────────────────────────────────────────
# Model holder — resmi MonkeyOCRv2_TransformersParsing
# ─────────────────────────────────────────────────────────────
class _ModelHolder:
    model = None           # MonkeyOCRv2_TransformersParsing instance
    is_loaded: bool = False
    load_error: Optional[str] = None


_mh = _ModelHolder()
_ALL_PROMPT: Dict = {}
_parse_end2end_fn = None
_get_layout_fn = None


def _load_monkey_model():
    global _ALL_PROMPT, _parse_end2end_fn, _get_layout_fn
    if _mh.is_loaded:
        return
    if not LOCAL_MODEL_PATH.exists():
        _mh.load_error = f"Model path tidak ada: {LOCAL_MODEL_PATH}"
        logger.error(_mh.load_error)
        return

    try:
        logger.info("Mengimport cpu.core_runner dari MonkeyOCRv2 parsing resmi...")
        from cpu.core_runner import (
            MonkeyOCRv2_TransformersParsing,
            ALL_PROMPT,
            parse_end2end_output,
            get_layout,
        )
        _ALL_PROMPT.update(ALL_PROMPT)
        _parse_end2end_fn = parse_end2end_output
        _get_layout_fn = get_layout

        logger.info(f"Loading MonkeyOCRv2 dari {LOCAL_MODEL_PATH} (CPU, bfloat16)...")
        _mh.model = MonkeyOCRv2_TransformersParsing(
            model_path=str(LOCAL_MODEL_PATH),
            device="cpu",
            dtype="bfloat16",
            attn_implementation="eager",
        )
        _mh.is_loaded = True
        logger.info("MonkeyOCR v2-B-Parsing berhasil dimuat di CPU!")

    except Exception as exc:
        _mh.load_error = str(exc)
        logger.error(f"Gagal memuat model: {exc}")
        logger.error(traceback.format_exc())


@app.on_event("startup")
async def startup():
    _load_monkey_model()


# ─────────────────────────────────────────────────────────────
# PDF helpers
# ─────────────────────────────────────────────────────────────

def _pdf_page_to_pil(pdf_bytes: bytes, page_num: int = 1, scale: float = 150 / 72) -> Tuple[Optional[Image.Image], int]:
    """
    Render halaman PDF ke PIL Image menggunakan pypdfium2.
    Mengembalikan (image, total_halaman).
    """
    if not HAS_PDFIUM:
        return None, 1
    try:
        doc = pdfium.PdfDocument(pdf_bytes)
        total_pages = len(doc)
        idx = min(max(0, page_num - 1), total_pages - 1)
        page = doc[idx]
        bitmap = page.render(scale=scale, rotation=0)
        pil_img = bitmap.to_pil()
        return pil_img.convert("RGB"), total_pages
    except Exception as exc:
        logger.warning(f"pypdfium2 render gagal: {exc}")
        return None, 1


def _pdf_words_pdfplumber(pdf_bytes: bytes, page_num: int = 1) -> Tuple[List[Dict], int]:
    """Fallback: ekstrak kata dari PDF text layer via pdfplumber."""
    if not HAS_PDFPLUMBER:
        return [], 1
    words = []
    total_pages = 1
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total_pages = len(pdf.pages)
            idx = min(max(0, page_num - 1), total_pages - 1)
            page = pdf.pages[idx]
            pw, ph = float(page.width), float(page.height)
            for w in page.extract_words(x_tolerance=4, y_tolerance=4):
                text = w["text"].strip()
                if text:
                    words.append({
                        "text": text,
                        "x1": float(w["x0"]),
                        "y1": float(w["top"]),
                        "x2": float(w["x1"]),
                        "y2": float(w["bottom"]),
                        "page_w": pw,
                        "page_h": ph,
                    })
    except Exception as exc:
        logger.warning(f"pdfplumber gagal: {exc}")
    return words, total_pages


# ─────────────────────────────────────────────────────────────
# Inferensi MonkeyOCRv2 — end2end mode (layout + konten sekaligus)
# ─────────────────────────────────────────────────────────────

def _infer_end2end(image: Image.Image) -> Tuple[List[Dict], List[Dict]]:
    """
    Jalankan MonkeyOCRv2 end2end inference pada PIL image.
    Mengembalikan (records, layouts).
    records: [{label, bbox:[x1,y1,x2,y2], content, page_num}, ...]
    layouts: [{bbox:[x1,y1,x2,y2], label}, ...]
    """
    if not _mh.is_loaded:
        return [], []
    try:
        end2end_prompt = _ALL_PROMPT.get("END2END", (
            "List the document elements in reading order, "
            "including their categories, coordinates, and the content of each element."
        ))
        raw_outputs = _mh.model.batch_inference(
            [image],
            [end2end_prompt],
            max_tokens=4096,
        )
        raw = raw_outputs[0]
        logger.info(f"MonkeyOCR raw output (first 200): {raw[:200]}")
        records, layouts = _parse_end2end_fn(raw, image.size)
        logger.info(f"Parsed {len(records)} records, {len(layouts)} layout blocks")
        return records, layouts
    except Exception as exc:
        logger.warning(f"MonkeyOCR end2end inference gagal: {exc}")
        logger.warning(traceback.format_exc())
        return [], []


# ─────────────────────────────────────────────────────────────
# Konversi bbox dan token helpers
# ─────────────────────────────────────────────────────────────

HANZI_RE = re.compile(r"[\u4e00-\u9fa5]")
EN_RE = re.compile(r"[a-zA-Z]")


def _is_hanzi_or_en(text: str) -> bool:
    return bool(HANZI_RE.search(text)) or bool(EN_RE.search(text))


def _pixel_to_pct(x1: float, y1: float, x2: float, y2: float,
                  img_w: float, img_h: float) -> Dict[str, float]:
    """Konversi pixel bbox ke persentase untuk frontend."""
    return {
        "x":      round(max(0.0, x1 / img_w * 100), 2),
        "y":      round(max(0.0, y1 / img_h * 100), 2),
        "width":  round(max(0.1, (x2 - x1) / img_w * 100), 2),
        "height": round(max(0.1, (y2 - y1) / img_h * 100), 2),
    }


# ─────────────────────────────────────────────────────────────
# CC-CEDICT inline mini dictionary
# ─────────────────────────────────────────────────────────────
_DICT: Dict[str, Dict] = {
    "学习": {"pinyin": "xué xí",  "hsk": 1, "radical": "子",  "id": "Belajar; menuntut ilmu.",          "en": "To learn; to study."},
    "汉字": {"pinyin": "hàn zì",   "hsk": 2, "radical": "宀",  "id": "Aksara Han; karakter Mandarin.",   "en": "Chinese character; Hanzi."},
    "翻译": {"pinyin": "fān yì",   "hsk": 3, "radical": "讠",  "id": "Menerjemahkan; terjemahan.",       "en": "To translate; translation."},
    "中文": {"pinyin": "zhōng wén","hsk": 1, "radical": "文",  "id": "Bahasa Mandarin.",                 "en": "Chinese language."},
    "文档": {"pinyin": "wén dàng", "hsk": 4, "radical": "木",  "id": "Dokumen; berkas.",                 "en": "Document; file."},
    "识别": {"pinyin": "shí bié",  "hsk": 3, "radical": "讠",  "id": "Mengidentifikasi; mengenali.",     "en": "To identify; to recognize."},
    "指导": {"pinyin": "zhǐ dǎo",  "hsk": 3, "radical": "手",  "id": "Membimbing; petunjuk.",            "en": "To guide; to instruct."},
    "学生": {"pinyin": "xué sheng","hsk": 1, "radical": "子",  "id": "Pelajar; mahasiswa.",              "en": "Student."},
    "教师": {"pinyin": "jiào shī", "hsk": 2, "radical": "攵",  "id": "Guru; pengajar; dosen.",           "en": "Teacher."},
    "实习": {"pinyin": "shí xí",   "hsk": 4, "radical": "宀",  "id": "Magang; praktik kerja.",          "en": "Internship; practicum."},
    "系统": {"pinyin": "xì tǒng",  "hsk": 3, "radical": "纟",  "id": "Sistem.",                         "en": "System."},
    "开发": {"pinyin": "kāi fā",   "hsk": 3, "radical": "开",  "id": "Pengembangan; mengembangkan.",     "en": "Development; to develop."},
    "大学": {"pinyin": "dà xué",   "hsk": 1, "radical": "大",  "id": "Universitas; perguruan tinggi.",   "en": "University."},
    "研究": {"pinyin": "yán jiū",  "hsk": 3, "radical": "石",  "id": "Penelitian; meneliti.",            "en": "Research; to study."},
    "技术": {"pinyin": "jì shù",   "hsk": 3, "radical": "手",  "id": "Teknologi; teknik.",               "en": "Technology; technique."},
    "工作": {"pinyin": "gōng zuò", "hsk": 1, "radical": "工",  "id": "Pekerjaan; bekerja.",              "en": "Work; to work."},
    "计算机": {"pinyin": "jì suàn jī", "hsk": 3, "radical": "讠", "id": "Komputer.",                    "en": "Computer."},
    "人工智能": {"pinyin": "rén gōng zhì néng", "hsk": 5, "radical": "人", "id": "Kecerdasan buatan.", "en": "Artificial intelligence."},
    "数据": {"pinyin": "shù jù",   "hsk": 4, "radical": "攴",  "id": "Data.",                            "en": "Data."},
    "图像": {"pinyin": "tú xiàng", "hsk": 4, "radical": "囗",  "id": "Gambar; citra.",                   "en": "Image; picture."},
    "文字": {"pinyin": "wén zì",   "hsk": 2, "radical": "文",  "id": "Karakter tulisan; teks.",          "en": "Written character; text."},
    "语言": {"pinyin": "yǔ yán",   "hsk": 2, "radical": "讠",  "id": "Bahasa.",                          "en": "Language."},
    "模型": {"pinyin": "mó xíng",  "hsk": 4, "radical": "木",  "id": "Model.",                           "en": "Model."},
    "算法": {"pinyin": "suàn fǎ",  "hsk": 5, "radical": "竹",  "id": "Algoritma.",                       "en": "Algorithm."},
}


def _make_token(text: str, bbox_pct: Dict[str, float], label: str = "text") -> Dict:
    """Bangun frontend token dict dari satu item teks MonkeyOCR."""
    tok_id = f"tok-{uuid.uuid4().hex[:8]}"
    has_zh = bool(HANZI_RE.search(text))

    if has_zh and text in _DICT:
        d = _DICT[text]
        return {
            "id": tok_id,
            "chinese": text,
            "pinyin": d["pinyin"],
            "hskLevel": d["hsk"],
            "radical": d["radical"],
            "indonesianDef": d["id"],
            "englishDef": d["en"],
            "grammarNotes": f"Terdeteksi oleh MonkeyOCR v2-B-Parsing sebagai '{label}'.",
            "examples": [{"id": "ex-1", "chinese": f"这是{text}的例子。",
                           "pinyin": f"Zhè shì {d['pinyin']} de lìzi.",
                           "indonesian": f"Ini adalah contoh penggunaan '{text}'."}],
            "bbox": bbox_pct,
            "label": label,
        }

    if has_zh:
        return {
            "id": tok_id,
            "chinese": text,
            "pinyin": "(dari MonkeyOCR v2-B-Parsing)",
            "hskLevel": 3,
            "radical": "— MonkeyOCR",
            "indonesianDef": f"Karakter Mandarin terdeteksi: \"{text}\"",
            "englishDef": f"Chinese text detected: \"{text}\"",
            "grammarNotes": f"Label: {label} | Posisi: ({bbox_pct['x']}%, {bbox_pct['y']}%)",
            "examples": [],
            "bbox": bbox_pct,
            "label": label,
        }

    # Teks Latin/Inggris
    return {
        "id": tok_id,
        "chinese": text,
        "pinyin": text.lower()[:40],
        "hskLevel": 1,
        "radical": "MonkeyOCR",
        "indonesianDef": f"Teks terdeteksi oleh MonkeyOCR: \"{text}\"",
        "englishDef": f"Detected text: \"{text}\"",
        "grammarNotes": f"Label: {label} | W:{bbox_pct['width']}% H:{bbox_pct['height']}%",
        "examples": [{"id": "ex-en", "chinese": text, "pinyin": text.lower(), "indonesian": text}],
        "bbox": bbox_pct,
        "label": label,
    }


def _records_to_tokens(
    records: List[Dict],
    img_w: int,
    img_h: int,
) -> Tuple[List[Dict], List[str]]:
    """
    Konversi list records MonkeyOCR (dari parse_end2end_output) ke frontend tokens.
    Setiap record: {label, bbox:[x1,y1,x2,y2], content, page_num}
    """
    tokens: List[Dict] = []
    text_parts: List[str] = []

    for rec in records:
        bbox_raw = rec.get("bbox", [])
        content: str = (rec.get("content") or "").strip()
        label: str = rec.get("label", "text")

        if not content or len(bbox_raw) < 4:
            continue

        x1, y1, x2, y2 = (
            float(bbox_raw[0]), float(bbox_raw[1]),
            float(bbox_raw[2]), float(bbox_raw[3]),
        )

        # Pecah konten jadi kata-kata dan distribusikan bbox horizontal
        words = content.split()
        if not words:
            continue

        block_w = max(x2 - x1, 1.0)
        word_w = block_w / len(words)

        for i, word in enumerate(words):
            word = word.strip(".,!?;:，。！？；：「」『』【】《》")
            if not word or not _is_hanzi_or_en(word):
                continue

            wx1 = x1 + i * word_w
            wx2 = x1 + (i + 1) * word_w
            bbox_pct = _pixel_to_pct(wx1, y1, wx2, y2, img_w, img_h)
            tokens.append(_make_token(word, bbox_pct, label))
            text_parts.append(word)

    return tokens, text_parts


# ─────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────

class OCRResponse(BaseModel):
    status: str
    model: str
    filename: str
    page: int
    totalPages: int
    processTimeMs: float
    imageWidth: Optional[int] = None
    imageHeight: Optional[int] = None
    blocks: List[Dict]
    fullText: str
    modelLoaded: bool


# ─────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MonkeyOCR v2-B-Parsing — CPU Mode (Opsi A)",
        "model_path": str(LOCAL_MODEL_PATH),
        "model_loaded": _mh.is_loaded,
        "load_error": _mh.load_error,
        "docs_url": "/docs",
        "endpoints": {
            "ocr_identify": "POST /api/v1/ocr-identify",
            "translate": "POST /api/v1/translate",
            "health": "GET /api/v1/health",
        }
    }


@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "model": "MonkeyOCRv2-B-Parsing (Local)",
        "model_path": str(LOCAL_MODEL_PATH),
        "model_loaded": _mh.is_loaded,
        "load_error": _mh.load_error,
        "device": "cpu",
        "cuda_available": torch.cuda.is_available(),
        "pdfium": HAS_PDFIUM,
        "pdfplumber": HAS_PDFPLUMBER,
        "parsing_dir": str(MONKEY_PARSING_DIR),
        "prompts_available": list(_ALL_PROMPT.keys()),
    }


@app.post("/api/v1/ocr-identify", response_model=OCRResponse)
async def ocr_identify(
    file: UploadFile = File(...),
    page: int = Form(default=1),
):
    """
    Endpoint OCR utama.

    PDF flow:
      1. pypdfium2 render halaman PDF ke image
      2. MonkeyOCR v2-B-Parsing end2end inference → bbox + label + konten
      3. Konversi ke frontend tokens dengan bbox %

    Image flow:
      1. MonkeyOCR v2-B-Parsing end2end inference
      2. Konversi ke frontend tokens

    Semua token difilter hanya Hanzi + Latin.
    """
    t0 = time.perf_counter()
    content = await file.read()
    filename = file.filename or "document"
    is_pdf = filename.lower().endswith(".pdf") or (file.content_type or "").startswith("application/pdf")

    all_tokens: List[Dict] = []
    full_text_parts: List[str] = []
    total_pages = 1
    img_w: Optional[int] = None
    img_h: Optional[int] = None

    # ── PDF ──────────────────────────────────────────────────
    if is_pdf:
        img, total_pages = _pdf_page_to_pil(content, page)

        if img is None:
            # Fallback pdfplumber text extraction
            logger.info("PDF render gagal, mencoba pdfplumber fallback...")
            pdf_words, total_pages = _pdf_words_pdfplumber(content, page)
            if pdf_words:
                pw = pdf_words[0]["page_w"]
                ph = pdf_words[0]["page_h"]
                img_w, img_h = int(pw), int(ph)
                for w in pdf_words:
                    text = w["text"]
                    if not _is_hanzi_or_en(text):
                        continue
                    bbox_pct = _pixel_to_pct(w["x1"], w["y1"], w["x2"], w["y2"], pw, ph)
                    all_tokens.append(_make_token(text, bbox_pct))
                    full_text_parts.append(text)
        else:
            img_w, img_h = img.width, img.height
            logger.info(f"PDF halaman {page} dirender: {img_w}x{img_h}px")

            if _mh.is_loaded:
                records, _ = _infer_end2end(img)
                if records:
                    all_tokens, full_text_parts = _records_to_tokens(records, img_w, img_h)
                else:
                    # Model tidak menghasilkan output, fallback pdfplumber
                    logger.warning("MonkeyOCR tidak menghasilkan output, fallback pdfplumber...")
                    pdf_words, _ = _pdf_words_pdfplumber(content, page)
                    for w in pdf_words:
                        if not _is_hanzi_or_en(w["text"]):
                            continue
                        bp = _pixel_to_pct(w["x1"], w["y1"], w["x2"], w["y2"], img_w, img_h)
                        all_tokens.append(_make_token(w["text"], bp))
                        full_text_parts.append(w["text"])
            else:
                logger.warning("Model belum dimuat — mengembalikan token kosong untuk PDF")

    # ── Image ─────────────────────────────────────────────────
    else:
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            img_w, img_h = img.width, img.height
        except Exception as exc:
            img = Image.new("RGB", (800, 1000), "white")
            img_w, img_h = 800, 1000
            logger.warning(f"Gagal membuka image: {exc}")

        if _mh.is_loaded:
            records, _ = _infer_end2end(img)
            if records:
                all_tokens, full_text_parts = _records_to_tokens(records, img_w, img_h)
            else:
                logger.warning("MonkeyOCR tidak menghasilkan output untuk image ini")
        else:
            logger.warning("Model belum dimuat — mengembalikan token kosong untuk image OCR")

    # Bangun blok respons
    blocks = []
    if all_tokens:
        blocks.append({
            "id": "block-main",
            "bbox": {"x": 0, "y": 0, "width": 100, "height": 100},
            "chineseText": " ".join(full_text_parts[:80]),
            "indonesianTranslation": "Hasil OCR MonkeyOCR v2-B-Parsing (CPU Mode)",
            "tokens": all_tokens,
        })

    elapsed = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(
        f"[{filename} p{page}/{total_pages}] "
        f"{len(all_tokens)} tokens | {elapsed}ms | "
        f"model={'loaded' if _mh.is_loaded else 'offline'}"
    )

    return OCRResponse(
        status="success",
        model="MonkeyOCRv2-B-Parsing (Local CPU)",
        filename=filename,
        page=page,
        totalPages=total_pages,
        processTimeMs=elapsed,
        imageWidth=img_w,
        imageHeight=img_h,
        blocks=blocks,
        fullText=" ".join(full_text_parts),
        modelLoaded=_mh.is_loaded,
    )


def _build_translation_prompt(text: str, source_lang: str, target_lang: str) -> str:
    """Bangun prompt terjemahan sesuai pasangan bahasa."""
    lang_labels = {
        "zh": "Mandarin (Zhōngwén)",
        "en": "English",
        "id": "Bahasa Indonesia",
    }
    src = lang_labels.get(source_lang, source_lang)
    tgt = lang_labels.get(target_lang, target_lang)
    return (
        f"Translate the following {src} text into {tgt}.\n"
        f"Source ({src}):\n{text}\n\n"
        f"Translation ({tgt}):"
    )


def _generate_translation(text: str, source_lang: str, target_lang: str) -> str:
    """Jalankan teks-only inference menggunakan model MonkeyOCR v2 (VLM) sebagai NMT backbone.

    Model ini adalah vision-language model, sehingga teks dikirim bersama
    gambar kosong melalui generate langsung (memfilter mm_token_type_ids yang
    tidak didukung oleh generate) agar output teks tersedia.
    """
    import torch

    processor = _mh.model.processor
    lm_model = _mh.model.model
    prompt = _build_translation_prompt(text, source_lang, target_lang)

    blank_image = Image.new("RGB", (256, 256), "white")
    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": blank_image},
            {"type": "text", "text": prompt},
        ],
    }]
    rendered = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True,
    )
    inputs = processor(
        text=[rendered],
        images=[blank_image],
        padding=True,
        return_tensors="pt",
    )
    # generate tidak menerima mm_token_type_ids; buang jika ada.
    inputs.pop("mm_token_type_ids", None)
    inputs = {
        k: (
            v.to(device=lm_model.device, dtype=lm_model.dtype)
            if torch.is_tensor(v) and v.is_floating_point()
            else v.to(device=lm_model.device)
            if torch.is_tensor(v)
            else v
        )
        for k, v in inputs.items()
    }
    input_len = inputs["input_ids"].shape[1]
    # Model override prepare_inputs_for_generation mengakses cache_position[0],
    # yang None saat generate dipanggil langsung. Beri cache_position secara eksplisit.
    inputs["cache_position"] = torch.arange(input_len, device=lm_model.device)

    with torch.no_grad():
        out = lm_model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,
        )

    gen_tokens = getattr(out, "sequences", out)
    trimmed = gen_tokens[0][input_len:]
    return processor.tokenizer.decode(trimmed, skip_special_tokens=True).strip()


def _online_translate_fallback(text: str, source_lang: str, target_lang: str) -> str:
    """Fallback translation via urllib when local model is offline or loading."""
    import urllib.request
    import urllib.parse
    sl = "zh-CN" if source_lang.lower() in ["zh", "zh-cn", "chinese"] else source_lang.lower()
    tl = "zh-CN" if target_lang.lower() in ["zh", "zh-cn", "chinese"] else target_lang.lower()
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list) and isinstance(data[0], list):
                translated_str = "".join(it[0] for it in data[0] if it and it[0])
                if translated_str:
                    return translated_str
    except Exception as exc:
        logger.warning(f"Fallback online translation failed: {exc}")
    return text


def _translate_chunk(text: str, source_lang: str, target_lang: str) -> str:
    """Terjemahkan satu potongan teks dengan penanganan error."""
    if not text or not text.strip():
        return ""
    if _mh.is_loaded:
        try:
            return _generate_translation(text, source_lang, target_lang)
        except Exception as exc:
            logger.warning(f"Local MonkeyOCR translation failed, using fallback: {exc}")
    return _online_translate_fallback(text, source_lang, target_lang)


@app.post("/api/v1/translate")
async def translate(
    text: str = Form(...),
    source_lang: str = Form(default="zh"),
    target_lang: str = Form(default="id"),
    direction: Optional[str] = Form(default=None),
):
    """
    Terjemahan teks tunggal menggunakan MonkeyOCR v2-B-Parsing atau Neural Translation.
    Mendukung pasangan bahasa arbitrer (source_lang/target_lang atau direction).
    """
    if direction and "-" in direction:
        parts = direction.split("-")
        source_lang = parts[0]
        target_lang = parts[1]

    translated = _translate_chunk(text, source_lang, target_lang)

    return {
        "status": "success",
        "original": text,
        "translated": translated,
        "model": "MonkeyOCRv2-B-Parsing" if _mh.is_loaded else "Neural-MT-Engine",
        "source_lang": source_lang,
        "target_lang": target_lang,
    }


@app.post("/api/v1/translate-document")
async def translate_document(
    file: UploadFile = File(...),
    source_lang: str = Form(default="en"),
    target_lang: str = Form(default="zh"),
    direction: Optional[str] = Form(default=None),
    max_chars_per_chunk: int = Form(default=1200),
):
    """
    Terjemahan seluruh dokumen PDF halaman per halaman.
    """
    if direction and "-" in direction:
        parts = direction.split("-")
        source_lang = parts[0]
        target_lang = parts[1]

    content = await file.read()
    filename = file.filename or "document"
    is_pdf = filename.lower().endswith(".pdf") or (file.content_type or "").startswith("application/pdf")

    if not is_pdf:
        return {
            "status": "error",
            "error": "Hanya file PDF yang didukung untuk terjemahan dokumen.",
            "model": "MonkeyOCRv2-B-Parsing (Local CPU)",
        }

    if not HAS_PDFPLUMBER:
        return {
            "status": "error",
            "error": "pdfplumber tidak tersedia — tidak dapat mengekstrak teks PDF.",
            "model": "MonkeyOCRv2-B-Parsing (Local CPU)",
        }

    pages: List[Dict[str, Any]] = []
    full_original_parts: List[str] = []
    full_translated_parts: List[str] = []

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            total_pages = len(pdf.pages)
            for idx, page in enumerate(pdf.pages, start=1):
                page_w = float(page.width)
                page_h = float(page.height)
                words = page.extract_words(x_tolerance=4, y_tolerance=4)
                # Urutkan kata berdasarkan posisi (top, then x0) untuk membaca alami
                words.sort(key=lambda w: (round(w["top"], 1), w["x0"]))
                page_text = " ".join(w["text"] for w in words if w["text"].strip())

                # Potong teks halaman menjadi chunk
                chunks = []
                buf = ""
                for word in page_text.split(" "):
                    if len(buf) + len(word) + 1 > max_chars_per_chunk and buf:
                        chunks.append(buf)
                        buf = word
                    else:
                        buf = (buf + " " + word).strip() if buf else word
                if buf:
                    chunks.append(buf)

                translated_chunks = [_translate_chunk(c, source_lang, target_lang) for c in chunks]
                page_translation = "\n".join(translated_chunks)

                pages.append({
                    "page": idx,
                    "page_w": page_w,
                    "page_h": page_h,
                    "original": page_text,
                    "translated": page_translation,
                    "word_count": len(words),
                })

                full_original_parts.append(f"--- Halaman {idx} ---\n{page_text}")
                full_translated_parts.append(f"--- Halaman {idx} ---\n{page_translation}")

    except Exception as exc:
        logger.error(f"translate-document gagal: {exc}")
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "error": str(exc),
            "model": "MonkeyOCRv2-B-Parsing (Local CPU)",
        }

    return {
        "status": "success",
        "filename": filename,
        "source_lang": source_lang,
        "target_lang": target_lang,
        "total_pages": total_pages,
        "pages": pages,
        "full_original": "\n\n".join(full_original_parts),
        "full_translated": "\n\n".join(full_translated_parts),
        "model": "MonkeyOCRv2-B-Parsing (Local CPU)",
    }


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
