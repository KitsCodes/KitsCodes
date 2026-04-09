#!/usr/bin/env python3
"""
add_photo.py — KitsCodes Gallery Helper
────────────────────────────────────────
Adiciona fotos novas à galeria automaticamente (POND ou SHOWCASE).

Uso:
  python add_photo.py

Coloque as fotos que quer adicionar na pasta 'new_photos/' antes de rodar.
O script vai:
  1. Copiar as imagens para a pasta 'images/'
  2. Perguntar título, local e descrição de cada uma
  3. Perguntar se vai para POND ou SHOWCASE
  4. Atualizar o arquivo JS apropriado automaticamente

Requisitos:
  pip install pillow
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path

# ── Configuração ──────────────────────────────────────────
POND_JS      = "assets/pond-gallery-photos.js"   # Galeria principal estilo lagoa
SHOWCASE_JS  = "assets/showcase.js"       # Galeria showcase
IMAGES_DIR   = "images"                   # pasta de destino das imagens
NEW_DIR      = "new_photos"               # pasta onde você coloca as fotos novas
SUPPORTED    = {".jpg", ".jpeg", ".png", ".webp"}
# ─────────────────────────────────────────────────────────


def get_next_id(js_content, gallery_type):
    """Pega o maior id existente e retorna o próximo."""
    # Define a base de ID para cada galeria
    base_id = 0 if gallery_type == "pond" else 1000
    ids = re.findall(r"id:\s*(\d+)", js_content)
    # Filtra apenas os IDs relevantes para a galeria
    relevant_ids = [int(i) for i in ids if (gallery_type == "pond" and int(i) < 1000) or (gallery_type == "showcase" and int(i) >= 1000)]
    return max(relevant_ids, default=base_id) + 1


def get_image_year(filepath):
    """Tenta pegar o ano da data de modificação do arquivo."""
    mtime = os.path.getmtime(filepath)
    return str(datetime.fromtimestamp(mtime).year)


def resize_image(src, dst, max_width=1920):
    """Redimensiona a imagem se for maior que max_width, mantendo proporção."""
    try:
        from PIL import Image
        img = Image.open(src)
        w, h = img.size
        if w > max_width:
            ratio = max_width / w
            img = img.resize((max_width, int(h * ratio)), Image.LANCZOS)
            print(f"  ↳ Redimensionada: {w}x{h} → {max_width}x{int(h * ratio)}")
        img.save(dst, quality=90, optimize=True)
    except ImportError:
        # Pillow não instalado, copia sem redimensionar
        shutil.copy2(src, dst)
        print("  ↳ Pillow não encontrado, copiado sem redimensionar.")


def ask(prompt, default=None):
    """Pergunta algo ao usuário com valor padrão opcional."""
    suffix = f" [{default}]" if default else ""
    value = input(f"  {prompt}{suffix}: ").strip()
    return value if value else default


def inject_into_js(js_content, new_entry):
    """Insere a nova entrada no array IMAGES do JS."""
    # Procura o fechamento do array "];" e insere antes
    marker = "];"
    idx = js_content.rfind(marker)
    if idx == -1:
        print("❌ Não encontrei o array IMAGES no JS. Verifique o arquivo.")
        return js_content

    # Remove o bloco de comentário de exemplo se ainda existir
    js_content = re.sub(
        r"/\* ── Adicione suas outras imagens abaixo.*?\*/\n?",
        "",
        js_content,
        flags=re.DOTALL
    )

    idx = js_content.rfind(marker)
    return js_content[:idx] + new_entry + "\n" + js_content[idx:]


def main():
    print("\n╔══════════════════════════════════════╗")
    print("║   KitsCodes — Adicionar Fotos 🌿     ║")
    print("╚══════════════════════════════════════╝\n")

    # Verifica estrutura de pastas
    if not Path(POND_JS).exists():
        print(f"❌ Não encontrei {POND_JS}. Rode o script na raiz do projeto.")
        return
    if not Path(SHOWCASE_JS).exists():
        print(f"❌ Não encontrei {SHOWCASE_JS}. Rode o script na raiz do projeto.")
        return

    os.makedirs(NEW_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)

    # Lista fotos novas
    new_photos = sorted([
        f for f in Path(NEW_DIR).iterdir()
        if f.suffix.lower() in SUPPORTED
    ])

    if not new_photos:
        print(f"📁 Nenhuma foto encontrada em '{NEW_DIR}/'.")
        print(f"   Coloque suas fotos lá e rode o script novamente.\n")
        return

    print(f"📸 {len(new_photos)} foto(s) encontrada(s):\n")
    for p in new_photos:
        print(f"   • {p.name}")
    print()

    # Lê ambos os JS
    with open(POND_JS, "r", encoding="utf-8") as f:
        pond_content = f.read()
    with open(SHOWCASE_JS, "r", encoding="utf-8") as f:
        showcase_content = f.read()

    pond_entries = []
    showcase_entries = []

    for photo in new_photos:
        print(f"─── {photo.name} ───────────────────────────")

        # Destino
        dest = Path(IMAGES_DIR) / photo.name
        if dest.exists():
            overwrite = ask(f"'{photo.name}' já existe em images/. Sobrescrever? (s/n)", "n")
            if overwrite.lower() != "s":
                print("  ↳ Pulando.\n")
                continue

        # Escolhe a galeria
        print("  Para qual galeria?")
        print("    [1] Pond (Galeria flutuante)")
        print("    [2] Showcase (Galeria em destaque)")
        gallery_choice = ask("  Escolha", "1")
        gallery_type = "showcase" if gallery_choice == "2" else "pond"

        # Pega info do usuário
        default_year = get_image_year(photo)
        title    = ask("Título", photo.stem.replace("-", " ").replace("_", " ").title())
        location = ask("Local / Jogo", "Assetto Corsa")
        year     = ask("Ano", default_year)
        desc     = ask("Descrição", f"Automotive capture — {title}.")

        # Copia/redimensiona
        print(f"  ↳ Copiando para images/{photo.name}...")
        resize_image(str(photo), str(dest))

        # Monta a entrada JS
        src_path = f"images/{photo.name}"
        
        if gallery_type == "pond":
            next_id = get_next_id(pond_content, "pond")
            entry = (
                f"  {{\n"
                f"    id: {next_id},\n"
                f"    src: \"{src_path}\",\n"
                f"    title: \"{title}\",\n"
                f"    year: \"{year}\",\n"
                f"    location: \"{location}\",\n"
                f"    desc: \"{desc}\",\n"
                f"    rotation: 0, x: 0, y: 0, w: 220, h: 165,\n"
                f"  }},"
            )
            pond_entries.append(entry)
            pond_content = inject_into_js(pond_content, entry)
        else:
            next_id = get_next_id(showcase_content, "showcase")
            entry = (
                f"  {{\n"
                f"    id: {next_id},\n"
                f"    src: \"{src_path}\",\n"
                f"    title: \"{title}\",\n"
                f"    year: \"{year}\",\n"
                f"    location: \"{location}\",\n"
                f"    desc: \"{desc}\",\n"
                f"  }},"
            )
            showcase_entries.append(entry)
            showcase_content = inject_into_js(showcase_content, entry)
        
        print(f"  ✅ Adicionado ao {'POND' if gallery_type == 'pond' else 'SHOWCASE'}!\n")

    if not pond_entries and not showcase_entries:
        print("Nenhuma foto nova adicionada.")
        return

    # Atualiza os arquivos JS
    if pond_entries:
        with open(POND_JS, "w", encoding="utf-8") as f:
            f.write(pond_content)
        print(f"✅ {len(pond_entries)} foto(s) adicionada(s) ao pond-gallery.js!")

    if showcase_entries:
        with open(SHOWCASE_JS, "w", encoding="utf-8") as f:
            f.write(showcase_content)
        print(f"✅ {len(showcase_entries)} foto(s) adicionada(s) ao showcase.js!")

    print(f"\n💡 Dica: as posições (x, y) e rotação do POND são geradas aleatoriamente")
    print(f"   pelo JavaScript quando a página carrega — não precisa ajustar!")
    print(f"\n🚀 É só fazer commit e push para o GitHub!\n")

    # Pergunta se quer mover as fotos processadas
    mover = ask("Mover fotos processadas de new_photos/ para uma pasta 'done/'? (s/n)", "s")
    if mover.lower() == "s":
        done_dir = Path("new_photos/done")
        done_dir.mkdir(exist_ok=True)
        for photo in new_photos:
            if (Path(IMAGES_DIR) / photo.name).exists():
                shutil.move(str(photo), str(done_dir / photo.name))
        print(f"  ↳ Fotos movidas para new_photos/done/\n")


if __name__ == "__main__":
    main()