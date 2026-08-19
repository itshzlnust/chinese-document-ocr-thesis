#!/usr/bin/env python3
"""
MonkeyOCR v2-B FastAPI Backend — Real ModelScope Integration
=============================================================
Menggunakan MonkeyOCR v2-B dari ModelScope untuk OCR dokumen nyata
dengan bounding box yang presisi dari model vision.

Setup (conda env MonkeyOCRv2):
    pip install -r requirements.txt
    python download_model.py -t modelscope -n MonkeyOCRv2-B
    python server.py  →  http://localhost:8000

Cara kerja bounding box:
  - PDF : pdfplumber ekstrak teks + bbox pixel → konversi ke %
  - Image: MonkeyOCR v2-B Qwen2-VL inference → parse JSON layout → bbox %
"""

import os
import io
import re
import sys
import time
import json
import uuid
import logging
import traceback
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

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

# ─────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="MonkeyOCR v2-B Backend",
    description="Real bounding box OCR using MonkeyOCR v2-B from ModelScope",
    version="2.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────
LOCAL_MODEL_PATH = os.getenv(
    "MONKEYOCR_PATH",
    str(Path(__file__).parent / "model_weight" / "MonkeyOCRv2-B"),
)
MODELSCOPE_MODEL_ID = "zenosai/MonkeyOCRv2-B"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

logger.info(f"Device: {DEVICE} | Model path: {LOCAL_MODEL_PATH}")

# ─────────────────────────────────────────────────────────────
# Optional imports (graceful degradation)
# ─────────────────────────────────────────────────────────────
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    logger.warning("pdfplumber not installed — PDF text extraction disabled")

try:
    from pdf2image import convert_from_bytes
    HAS_PDF2IMAGE = True
except ImportError:
    HAS_PDF2IMAGE = False
    logger.warning("pdf2image not installed — PDF image rendering disabled")

try:
    from transformers import (
        Qwen2VLForConditionalGeneration,
        AutoProcessor,
    )
    from qwen_vl_utils import process_vision_info
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    logger.warning("transformers/qwen_vl_utils not installed — model inference disabled")


# ─────────────────────────────────────────────────────────────
# Model holder
# ─────────────────────────────────────────────────────────────
class _ModelHolder:
    model = None
    processor = None
    is_loaded: bool = False
    load_error: Optional[str] = None

_mh = _ModelHolder()


def _load_model():
    """
    Load MonkeyOCR v2-B (Qwen2-VL backbone) from local path or ModelScope.
    MonkeyOCR v2-B is essentially a fine-tuned Qwen2VLForConditionalGeneration.
    """
    global _mh
    if _mh.is_loaded:
        return

    if not HAS_TRANSFORMERS:
        _mh.load_error = "transformers package not installed"
        return

    # Prefer local weights; fall back to ModelScope auto-download
    model_src = LOCAL_MODEL_PATH if Path(LOCAL_MODEL_PATH).exists() else MODELSCOPE_MODEL_ID
    logger.info(f"Loading MonkeyOCR v2-B from: {model_src}")

    try:
        _mh.model = Qwen2VLForConditionalGeneration.from_pretrained(
            model_src,
            torch_dtype="auto",
            device_map="auto",
            trust_remote_code=True,
        ).eval()

        _mh.processor = AutoProcessor.from_pretrained(
            model_src,
            trust_remote_code=True,
        )

        _mh.is_loaded = True
        logger.info("✅ MonkeyOCR v2-B loaded successfully!")

    except Exception as exc:
        _mh.load_error = str(exc)
        logger.warning(f"⚠️  Model load failed: {exc}")
        logger.warning("Falling back to pdfplumber-only mode.")


@app.on_event("startup")
async def startup():
    _load_model()


# ─────────────────────────────────────────────────────────────
# MonkeyOCR v2-B inference helper
# ─────────────────────────────────────────────────────────────

# The prompt that instructs MonkeyOCR v2-B to output a structured JSON
# with bbox, label, and text for every detected region.
_LAYOUT_PROMPT = (
    "Please perform OCR and layout analysis on this document image. "
    "For every detected text region output a JSON array where each element has: "
    '{"bbox": [x1, y1, x2, y2], "label": "title|text|table|figure|header|footer", "text": "..."}. '
    "Coordinates are in pixels relative to the image size. "
    "Return ONLY the JSON array, no markdown fences."
)


def _infer_layout(image: Image.Image) -> List[Dict[str, Any]]:
    """
    Run MonkeyOCR v2-B inference on a PIL image.
    Returns list of { bbox:[x1,y1,x2,y2], label:str, text:str }
    """
    if not _mh.is_loaded:
        return []

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": _LAYOUT_PROMPT},
            ],
        }
    ]

    text_input = _mh.processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    image_inputs, video_inputs = process_vision_info(messages)

    inputs = _mh.processor(
        text=[text_input],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        output_ids = _mh.model.generate(
            **inputs,
            max_new_tokens=4096,
            do_sample=False,
        )

    # Decode only the newly generated tokens
    trimmed = [
        out[len(inp):] for inp, out in zip(inputs.input_ids, output_ids)
    ]
    raw = _mh.processor.batch_decode(trimmed, skip_special_tokens=True)[0]
    logger.info(f"MonkeyOCR v2-B raw output (first 300 chars): {raw[:300]}")

    return _parse_layout_json(raw)


def _parse_layout_json(raw: str) -> List[Dict[str, Any]]:
    """
    Robustly parse the model output into a list of layout blocks.
    Handles JSON arrays, markdown-fenced JSON, and partial output.
    """
    # Strip markdown code fences if present
    raw = re.sub(r"```(?:json)?", "", raw).strip()
    raw = raw.strip("`").strip()

    # Try direct JSON parse
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "blocks" in data:
            return data["blocks"]
    except json.JSONDecodeError:
        pass

    # Try to extract JSON array from anywhere in the text
    m = re.search(r"\[.*\]", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except Exception:
            pass

    # Line-by-line JSON object extraction fallback
    blocks = []
    for line in raw.splitlines():
        line = line.strip().strip(",")
        if line.startswith("{") and "bbox" in line:
            try:
                blocks.append(json.loads(line))
            except Exception:
                pass
    return blocks


# ─────────────────────────────────────────────────────────────
# PDF helpers
# ─────────────────────────────────────────────────────────────

def _extract_pdf_words(pdf_bytes: bytes, page_num: int = 1) -> Tuple[List[Dict], int]:
    """
    Extract word-level text with pixel bounding boxes from a PDF page
    using pdfplumber. Returns (words_list, total_pages).
    Each word: { text, x1, y1, x2, y2, page_w, page_h }
    """
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

            for w in page.extract_words(x_tolerance=4, y_tolerance=4, keep_blank_chars=False):
                text = w["text"].strip()
                if not text:
                    continue
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
        logger.warning(f"pdfplumber failed: {exc}")

    return words, total_pages


# ─────────────────────────────────────────────────────────────
# Token / bbox conversion helpers
# ─────────────────────────────────────────────────────────────

HANZI_RE = re.compile(r"[\u4e00-\u9fa5]")
EN_RE = re.compile(r"[a-zA-Z]")

def _is_hanzi_or_en(text: str) -> bool:
    """Return True if text contains Hanzi or at least one Latin letter."""
    return bool(HANZI_RE.search(text)) or bool(EN_RE.search(text))


def _pixel_to_pct(x1: float, y1: float, x2: float, y2: float,
                   img_w: float, img_h: float) -> Dict[str, float]:
    """Convert pixel bbox [x1,y1,x2,y2] to percentage dict for frontend."""
    return {
        "x":      round(x1 / img_w * 100, 2),
        "y":      round(y1 / img_h * 100, 2),
        "width":  round((x2 - x1) / img_w * 100, 2),
        "height": round((y2 - y1) / img_h * 100, 2),
    }


# Lightweight CC-CEDICT inline sample for token enrichment
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
}


def _make_token(text: str, bbox_pct: Dict[str, float]) -> Dict:
    """Build a frontend token dict for a single text item."""
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
            "grammarNotes": f"Karakter Mandarin terdeteksi oleh MonkeyOCR v2-B. Lihat tab Kalimat untuk contoh.",
            "examples": [{"id": f"ex-1", "chinese": f"这是{text}的例子。",
                           "pinyin": f"Zhè shì {d['pinyin']} de lìzi.",
                           "indonesian": f"Ini adalah contoh penggunaan '{text}'."}],
            "bbox": bbox_pct,
        }

    if has_zh:
        return {
            "id": tok_id,
            "chinese": text,
            "pinyin": "(dari MonkeyOCR v2-B)",
            "hskLevel": 3,
            "radical": "— MonkeyOCR v2-B",
            "indonesianDef": f"Karakter Mandarin terdeteksi: \"{text}\"",
            "englishDef": f"Chinese text detected by MonkeyOCR v2-B: \"{text}\"",
            "grammarNotes": f"Terdeteksi di posisi ({bbox_pct['x']}%, {bbox_pct['y']}%).",
            "examples": [],
            "bbox": bbox_pct,
        }

    # English / Latin text
    return {
        "id": tok_id,
        "chinese": text,
        "pinyin": text.lower()[:40],
        "hskLevel": 1,
        "radical": "🐵 MonkeyOCR v2-B",
        "indonesianDef": f"English text identified by MonkeyOCR v2-B: \"{text}\"",
        "englishDef": f"Detected text: \"{text}\"",
        "grammarNotes": (
            f"English text item at ({bbox_pct['x']}%, {bbox_pct['y']}%) "
            f"— W:{bbox_pct['width']}% H:{bbox_pct['height']}%"
        ),
        "examples": [{"id": "ex-en", "chinese": text, "pinyin": text.lower(), "indonesian": text}],
        "bbox": bbox_pct,
    }


# ─────────────────────────────────────────────────────────────
# Pydantic response schemas
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


# ─────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "model": MODELSCOPE_MODEL_ID,
        "model_loaded": _mh.is_loaded,
        "load_error": _mh.load_error,
        "device": DEVICE,
        "cuda_available": torch.cuda.is_available(),
        "pdfplumber": HAS_PDFPLUMBER,
        "pdf2image": HAS_PDF2IMAGE,
    }


@app.post("/api/v1/ocr-identify", response_model=OCRResponse)
async def ocr_identify(
    file: UploadFile = File(...),
    page: int = Form(default=1),
):
    """
    Main OCR endpoint.

    PDF flow:
      1. pdfplumber → extract word bbox in pixels from PDF text layer
      2. MonkeyOCR v2-B image inference (if model loaded) on the rendered page
      3. Merge results: prefer model output, fall back to pdfplumber

    Image flow:
      1. MonkeyOCR v2-B Qwen2-VL inference → JSON layout blocks
      2. Build frontend tokens from blocks with real pixel→% bbox

    All tokens filtered to Hanzi + English only.
    """
    t0 = time.perf_counter()
    content = await file.read()
    filename = file.filename or "document"
    is_pdf = filename.lower().endswith(".pdf") or (file.content_type or "").startswith("application/pdf")

    all_tokens: List[Dict] = []
    full_text_parts: List[str] = []
    total_pages = 1
    img_w, img_h = None, None

    # ── PDF ────────────────────────────────────────────────
    if is_pdf:
        # Step 1: pdfplumber word-level extraction
        pdf_words, total_pages = _extract_pdf_words(content, page)

        if pdf_words:
            # All words share the same page dimensions
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

        # Step 2: MonkeyOCR v2-B image inference on rendered page
        if _mh.is_loaded and HAS_PDF2IMAGE:
            try:
                images = convert_from_bytes(content, dpi=150, first_page=page, last_page=page)
                if images:
                    img = images[0]
                    img_w, img_h = img.width, img.height
                    layout_blocks = _infer_layout(img)

                    if layout_blocks:
                        logger.info(f"MonkeyOCR v2-B found {len(layout_blocks)} layout blocks (PDF page)")
                        # Model output overrides pdfplumber when available
                        all_tokens = []
                        full_text_parts = []
                        for blk in layout_blocks:
                            _consume_block(blk, img_w, img_h, all_tokens, full_text_parts)
            except Exception as exc:
                logger.warning(f"MonkeyOCR v2-B PDF inference failed: {exc}")

    # ── Image ──────────────────────────────────────────────
    else:
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            img_w, img_h = img.width, img.height
        except Exception as exc:
            img = Image.new("RGB", (800, 1000), "white")
            img_w, img_h = 800, 1000
            logger.warning(f"Could not open image: {exc}")

        if _mh.is_loaded:
            layout_blocks = _infer_layout(img)
            logger.info(f"MonkeyOCR v2-B found {len(layout_blocks)} layout blocks (image)")
            for blk in layout_blocks:
                _consume_block(blk, img_w, img_h, all_tokens, full_text_parts)
        else:
            logger.warning("Model not loaded — returning empty tokens for image OCR")

    # Build single response block containing all tokens
    blocks = []
    if all_tokens:
        blocks.append({
            "id": "block-main",
            "bbox": {"x": 0, "y": 0, "width": 100, "height": 100},
            "chineseText": " ".join(full_text_parts[:50]),
            "indonesianTranslation": "Hasil identifikasi MonkeyOCR v2-B",
            "tokens": all_tokens,
        })

    elapsed = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(
        f"[{filename} p{page}/{total_pages}] "
        f"{len(all_tokens)} tokens | {elapsed}ms | model={'loaded' if _mh.is_loaded else 'offline'}"
    )

    return OCRResponse(
        status="success",
        model=MODELSCOPE_MODEL_ID,
        filename=filename,
        page=page,
        totalPages=total_pages,
        processTimeMs=elapsed,
        imageWidth=img_w,
        imageHeight=img_h,
        blocks=blocks,
        fullText=" ".join(full_text_parts),
    )


def _consume_block(
    blk: Dict,
    img_w: int,
    img_h: int,
    tokens_out: List[Dict],
    text_out: List[str],
):
    """
    Convert one MonkeyOCR v2-B layout block into frontend tokens.
    Block format: { bbox: [x1,y1,x2,y2], label: str, text: str }
    """
    raw_bbox = blk.get("bbox", [])
    text: str = blk.get("text", "").strip()

    if not text or len(raw_bbox) < 4:
        return

    x1, y1, x2, y2 = float(raw_bbox[0]), float(raw_bbox[1]), float(raw_bbox[2]), float(raw_bbox[3])

    # The model outputs bbox for the whole block — split into word-level tokens
    words = text.split()
    if not words:
        return

    block_w = max(x2 - x1, 1)
    word_w = block_w / len(words)

    for i, word in enumerate(words):
        word = word.strip(".,!?;:，。！？；：")
        if not word or not _is_hanzi_or_en(word):
            continue

        # Distribute words horizontally within the block bbox
        wx1 = x1 + i * word_w
        wx2 = x1 + (i + 1) * word_w

        bbox_pct = _pixel_to_pct(wx1, y1, wx2, y2, img_w, img_h)
        tokens_out.append(_make_token(word, bbox_pct))
        text_out.append(word)


@app.post("/api/v1/translate")
async def translate(
    text: str = Form(...),
    source_lang: str = Form(default="zh"),
    target_lang: str = Form(default="id"),
):
    """ZH → ID translation via MonkeyOCR v2-B Qwen2-VL backbone."""
    if not _mh.is_loaded:
        return {"status": "offline", "original": text,
                "translated": f"[Backend offline] {text}", "model": MODELSCOPE_MODEL_ID}

    prompt = f"Translate this Chinese text to Indonesian:\n{text}\nIndonesian translation:"
    messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]

    try:
        text_in = _mh.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = _mh.processor(text=[text_in], return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            out = _mh.model.generate(**inputs, max_new_tokens=256, do_sample=False)
        trimmed = [o[len(i):] for i, o in zip(inputs.input_ids, out)]
        translated = _mh.processor.batch_decode(trimmed, skip_special_tokens=True)[0].strip()
    except Exception as exc:
        logger.warning(f"Translation failed: {exc}")
        translated = f"[Error] {exc}"

    return {"status": "success", "original": text, "translated": translated, "model": MODELSCOPE_MODEL_ID}


# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
