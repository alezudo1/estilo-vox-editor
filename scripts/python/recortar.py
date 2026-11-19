"""Recorta pessoas/objetos das fotos de um vídeo (fundo transparente), sem alterar os pixels da pessoa.

Uso:  python scripts/python/recortar.py <pasta-do-video> [arquivo.jpg ...]
Sem arquivos: recorta todas as fotos marcadas com "| recorte" no roteiro que ainda não têm recorte.
Saída: imagens/recortes/<nome>.png

Instalação (uma vez):  pip install "rembg[cpu]"     (ou "rembg[gpu]" com CUDA)
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

MODELO = "isnet-general-use"


def marcadas(pasta: Path) -> list[str]:
    roteiro = (pasta / "roteiro.md").read_text(encoding="utf-8")
    nomes = []
    for m in re.finditer(r"^\s*\[foto:\s*([^|\]]+)\|([^\]]*)\]", roteiro, re.M):
        if re.search(r"(^|\|)\s*recorte\s*(\||$)", m.group(2)):
            nomes.append(m.group(1).strip().strip('"'))
    return nomes


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pasta = Path(sys.argv[1]).resolve()
    if not (pasta / "imagens").exists() and (Path("..") / "videos" / sys.argv[1]).exists():
        pasta = (Path("..") / "videos" / sys.argv[1]).resolve()
    saida = pasta / "imagens" / "recortes"
    saida.mkdir(parents=True, exist_ok=True)
    nomes = sys.argv[2:] or [n for n in marcadas(pasta) if not (saida / f"{Path(n).stem}.png").exists()]
    if not nomes:
        print("Nada para recortar.")
        return
    sessao = new_session(MODELO)
    for nome in nomes:
        origem = pasta / "imagens" / nome
        if not origem.exists():
            print(f"✖ não achei {origem}")
            continue
        img = Image.open(origem).convert("RGB")
        img.thumbnail((2000, 2000))
        rec = remove(img, session=sessao, post_process_mask=True)
        caixa = rec.getbbox()
        if caixa:
            rec = rec.crop(caixa)
        destino = saida / f"{Path(nome).stem}.png"
        rec.save(destino)
        print(f"✓ {destino}")


if __name__ == "__main__":
    main()
