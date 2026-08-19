import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Server } from 'lucide-react';

interface PythonApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonApiModal: React.FC<PythonApiModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonScript = `# MonkeyOCR v2 FastAPI Server Integration
# github.com/Yuliang-Liu/MonkeyOCRv2.git
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import cv2
import numpy as np

app = FastAPI(title="MonkeyOCR v2 Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load MonkeyOCR v2 Model (GPU/CUDA execution)
# device = "cuda" if torch.cuda.is_available() else "cpu"
# model = load_monkey_ocr_v2("weights/monkeyocr_v2.pth").to(device)

@app.post("/api/v1/ocr-identify")
async def process_ocr(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Run MonkeyOCR v2 text detection & layout parsing
    # result = model.predict(img)
    
    return {
        "status": "success",
        "model": "MonkeyOCR v2",
        "detected_words": [
            {
                "word": "学习",
                "pinyin": "xué xí",
                "indonesian_translation": "Belajar",
                "bbox": {"x": 10, "y": 20, "width": 15, "height": 10}
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl glass-panel bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Python Backend API (MonkeyOCR v2)</h3>
              <p className="text-xs text-slate-400">Integrasi Server REST API FastAPI untuk deployment PyTorch local GPU</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-red-400" />
              Kode server Python FastAPI (`server.py`):
            </span>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center space-x-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tercopy!' : 'Salin Kode Python'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
            {pythonScript}
          </pre>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-200 text-xs">Petunjuk Instalasi & Cara Jalankan:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Clone repositori resmi: <code className="text-amber-400">git clone https://github.com/Yuliang-Liu/MonkeyOCRv2.git</code></li>
              <li>Instal dependensi: <code className="text-amber-400">pip install fastapi uvicorn torch opencv-python</code></li>
              <li>Jalankan server: <code className="text-amber-400">python server.py</code> (Server berjalan di <code className="text-slate-200">http://localhost:8000</code>)</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
          >
            Tutup Window
          </button>
        </div>
      </div>
    </div>
  );
};
