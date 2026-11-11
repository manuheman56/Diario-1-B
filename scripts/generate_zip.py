#!/usr/bin/env python3
import os
import zipfile

PROJECT_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
OUTPUT_ZIP_PUBLIC = os.path.join(PROJECT_ROOT, 'public', 'el-diario-del-aula-1b.zip')
OUTPUT_ZIP_ROOT = os.path.join(PROJECT_ROOT, 'el-diario-del-aula-1b.zip')

EXCLUDE_DIRS = {
    'node_modules',
    'dist',
    '.git',
    '.cache',
    '.aistudio',
    '__pycache__',
}

EXCLUDE_FILES = {
    '.env',
    '.env.local',
    'el-diario-del-aula-1b.zip',
}

def create_zip(target_path):
    print(f"Creando paquete ZIP en: {target_path}...")
    with zipfile.ZipFile(target_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Filtrar carpetas excluidas en el recorrido
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in sorted(files):
                if file in EXCLUDE_FILES or file.endswith('.zip'):
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)

                # Evitar incluir cualquier archivo dentro de las carpetas excluidas
                parts = rel_path.split(os.sep)
                if any(p in EXCLUDE_DIRS for p in parts):
                    continue

                zf.write(full_path, rel_path)
                print(f"  + {rel_path}")

    size_mb = os.path.getsize(target_path) / (1024 * 1024)
    print(f"✓ ZIP generado con éxito: {size_mb:.2f} MB")

if __name__ == '__main__':
    create_zip(OUTPUT_ZIP_PUBLIC)
    # Copiar también a la raíz
    import shutil
    shutil.copy2(OUTPUT_ZIP_PUBLIC, OUTPUT_ZIP_ROOT)
    print("✓ Copia creada en la raíz del proyecto.")
