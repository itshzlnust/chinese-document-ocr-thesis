#!/usr/bin/env python3
"""
Download MonkeyOCR v2 model weights.

Usage:
    # Dari ModelScope (recommended untuk koneksi Indonesia):
    python download_model.py -t modelscope -n MonkeyOCRv2-B

    # Dari HuggingFace:
    python download_model.py -n MonkeyOCRv2-B

Setelah download, model tersimpan di:
    ./model_weight/MonkeyOCRv2-B/
"""
import argparse
import os
from pathlib import Path

MODELS = {
    "MonkeyOCRv2-B": {
        "huggingface": "zenosai/MonkeyOCRv2-B",
        "modelscope":  "zenosai/MonkeyOCRv2-B",
    },
    "MonkeyOCRv2-S": {
        "huggingface": "zenosai/MonkeyOCRv2-S",
        "modelscope":  "zenosai/MonkeyOCRv2-S",
    },
    "MonkeyOCRv2-AS": {
        "huggingface": "zenosai/MonkeyOCRv2-AS",
        "modelscope":  "zenosai/MonkeyOCRv2-AS",
    },
}


def download_huggingface(model_id: str, save_dir: str):
    from huggingface_hub import snapshot_download
    print(f"⬇️  Downloading {model_id} from HuggingFace → {save_dir}")
    snapshot_download(repo_id=model_id, local_dir=save_dir)
    print(f"✅ Done: {save_dir}")


def download_modelscope(model_id: str, save_dir: str):
    """
    Download MonkeyOCR v2-B dari ModelScope.
    ModelScope lebih cepat dari China/SEA dibanding HuggingFace.
    """
    try:
        from modelscope.hub.snapshot_download import snapshot_download as ms_dl
        print(f"⬇️  Downloading {model_id} from ModelScope → {save_dir}")
        ms_dl(model_id, local_dir=save_dir)
        print(f"✅ Done: {save_dir}")
    except ImportError:
        print("❌ modelscope tidak terinstall. Jalankan: pip install modelscope>=1.15.0")
        raise
    except Exception as e:
        print(f"❌ ModelScope download failed: {e}")
        print("Mencoba fallback ke HuggingFace...")
        download_huggingface(model_id, save_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download MonkeyOCR v2 model weights")
    parser.add_argument("-n", "--name", required=True, choices=list(MODELS.keys()),
                        help="Nama model yang akan didownload")
    parser.add_argument("-t", "--type", default="modelscope",
                        choices=["huggingface", "modelscope"],
                        help="Sumber download (default: modelscope)")
    parser.add_argument("-o", "--output", default="./model_weight",
                        help="Direktori output (default: ./model_weight)")
    args = parser.parse_args()

    info = MODELS[args.name]
    save_path = str(Path(args.output) / args.name)
    Path(save_path).mkdir(parents=True, exist_ok=True)

    print(f"\n{'─'*50}")
    print(f"Model  : {args.name}")
    print(f"Source : {args.type}")
    print(f"Output : {save_path}")
    print(f"{'─'*50}\n")

    if args.type == "modelscope":
        download_modelscope(info["modelscope"], save_path)
    else:
        download_huggingface(info["huggingface"], save_path)

    print(f"\n✅ Model siap digunakan!")
    print(f"   Jalankan server: python server.py")
