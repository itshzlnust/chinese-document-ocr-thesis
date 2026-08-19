# 🐒 Chinese OCR Reader — MonkeyOCR v2

A premium web application for Chinese language learners. Upload a document (PDF or image), scan & identify **Hanzi characters** and **English text** per word with bounding box overlays, then explore dictionary definitions, HanziVG stroke animations, grammar notes, and example sentences — all in one interactive interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Document Reader** | Upload PDF/image → real bounding box overlays per word |
| 🔍 **Adaptive Hover Popup** | Hanzi → full dictionary + stroke order; English → scanned text info |
| 🖊️ **HanziVG Stroke Order** | Animated stroke-by-stroke SVG rendering |
| 📖 **CC-CEDICT Dictionary** | Chinese → Indonesian + English definitions |
| 🌐 **ZH → ID Translation** | Full document translation (Mandarin to Indonesian) |
| 🃏 **Flashcard System** | Spaced repetition learning hub with 3D flip cards |

---

## 🚀 Quick Start (Frontend)

```bash
cd chinese-ocr-app
npm install
npm run dev
# → http://localhost:3000
```

---

## 🐍 Backend — MonkeyOCR v2 Setup

### Requirements
- Python 3.11
- NVIDIA GPU (CUDA 12.6) recommended
- Conda or virtualenv

### 1. Create Environment

```bash
conda create -n MonkeyOCRv2 python=3.11
conda activate MonkeyOCRv2
```

### 2. Install PyTorch (CUDA 12.6)

```bash
pip install torch==2.8.0 torchvision==0.21.0 torchaudio==2.6.0 \
    --index-url https://download.pytorch.org/whl/cu126
```

### 3. Install Dependencies

```bash
pip install transformers==4.57.1 accelerate==1.11.0 qwen_vl_utils==0.0.14
pip install flash-attn==2.8.3 --no-build-isolation
pip install -r requirements.txt
```

### 4. Download Model

```bash
# HuggingFace
python download_model.py -n MonkeyOCRv2-B

# ModelScope (if HuggingFace is slow)
pip install modelscope
python download_model.py -t modelscope -n MonkeyOCRv2-B
```

### 5. Start Backend

```bash
python server.py
# → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ocr-identify` | Upload file → get Hanzi/EN bounding boxes |
| `POST` | `/api/v1/translate` | ZH → ID translation |
| `GET` | `/api/v1/health` | Server + model status |

---

## 🗂️ Project Structure

```
chinese-ocr-app/
├── server.py               ← FastAPI Backend (MonkeyOCR v2)
├── download_model.py       ← Model weight downloader
├── requirements.txt        ← Python dependencies
├── model_weight/           ← Downloaded model weights (gitignored)
├── src/
│   ├── components/
│   │   ├── HoverPopup.tsx      ← Adaptive popup (Hanzi vs English)
│   │   ├── DocumentReader.tsx  ← PDF viewer + bbox overlay
│   │   ├── Sidebar.tsx
│   │   ├── FlashcardHub.tsx
│   │   └── DocumentTranslator.tsx
│   ├── services/
│   │   ├── monkeyOcrService.ts ← OCR client + Hanzi/EN filter
│   │   ├── ocrEngine.ts
│   │   ├── pdfRenderer.ts
│   │   ├── dictionary.ts
│   │   └── hanzivg.ts
│   ├── data/
│   │   ├── cc_cedict_sample.ts
│   │   ├── hanzivg_data.ts
│   │   └── sample_documents.ts
│   └── types/index.ts
└── public/
```

---

## 🔧 Tech Stack

**Frontend**: React 18 + TypeScript + Vite + TailwindCSS + PDF.js + Lucide React  
**Backend**: FastAPI + PyTorch + MonkeyOCR v2 + pdfplumber + Uvicorn  
**OCR Model**: [MonkeyOCR v2](https://github.com/Yuliang-Liu/MonkeyOCRv2)  
**Stroke Data**: [HanziVG](https://github.com/Connum/hanzivg)  
**Dictionary**: CC-CEDICT (Chinese → Indonesian + English)

---

## 📝 Notes

- Model weights are **not included** in this repo (use `download_model.py`)
- Frontend works offline with client-side layout engine if backend is not running
- Only **Hanzi** and **English** tokens are scanned and displayed (Indonesian labels are excluded)
