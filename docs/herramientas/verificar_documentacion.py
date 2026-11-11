#!/usr/bin/env python3
# @institucion   Universidad Nacional de Loja
# @carrera       Pedagogía de las Ciencias Experimentales - Informática
# @asignatura    Programación Web
# @docente       Johnny H. Sánchez L.
# @proyecto      Sistema de Gestión de Prácticas (SGP)
# @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
# @file          verificar_documentacion.py
# @fecha         2026-11-09 11:08:16
# @nota          Comprueba los enlaces y las referencias de la documentación local.

"""Validate local documentation without network access or application changes."""
from pathlib import Path
from collections import Counter
import json
import re
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
FILES = sorted(path for path in set([ROOT / 'README.md', ROOT / 'BackEnd/README.md', ROOT / 'prototipos-interfaces/README.md', *ROOT.joinpath('docs').rglob('*.md')]) if not {'node_modules', 'target', 'build', '.git'}.intersection(path.relative_to(ROOT).parts))
errors = []
links = 0
routes = 0
mappings = []
for controller in ROOT.joinpath('BackEnd/src/main/java/com/sgp/systemsgp/controller').rglob('*.java'):
    source = controller.read_text()
    header = source.split('public class')[0]
    base = re.search(r'@RequestMapping\("([^"]+)"\)', header)
    base = base[1] if base else ''
    for method in re.finditer(r'@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?', source):
        suffixes = re.findall(r'"(/[^" ]*)"', method[2] or '') or ['']
        for suffix in suffixes:
            escaped = re.escape(base + suffix)
            pattern = re.sub(r'\\\{[^}]+\\\}', '[^/]+', escaped)
            mappings.append((method[1].upper(), re.compile('^' + pattern + '$')))

for path in FILES:
    source = path.read_text()
    name = path.relative_to(ROOT).as_posix()
    # Ignore Markdown-like text inside examples, and support backtick and tilde fences.
    inside = None
    prose = []
    for line in source.splitlines():
        fence = re.match(r'^\s{0,3}(`{3,}|~{3,})(.*)$', line)
        if fence:
            marker, tail = fence.groups()
            if inside is None:
                inside = marker
            elif marker[0] == inside[0] and len(marker) >= len(inside) and not tail.strip():
                inside = None
            continue
        if inside is None:
            prose.append(line)
    if inside:
        errors.append(f'{name}: bloque de código sin cerrar')
    prose = '\n'.join(prose)
    if len(re.findall(r'^# ', prose, re.M)) != 1:
        errors.append(f'{name}: se requiere un título principal')
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', prose):
        target = target.strip().split(' "', 1)[0].strip('<>')
        if not target or target.startswith('#') or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
            continue
        file_target = unquote(target.split('#', 1)[0])
        if not file_target:
            continue
        links += 1
        if not (path.parent / file_target).exists():
            errors.append(f'{name}: enlace inexistente: {target}')
    if ROOT.joinpath('docs/api/postman') in path.parents:
        for method, url in re.findall(r'^\| `(GET|POST|PUT|PATCH|DELETE)` \| `([^`]+)`', prose, re.M):
            endpoint = url.replace('{{baseUrl}}', '').split('?', 1)[0]
            endpoint = re.sub(r'\{\{[^}]+\}\}', '123', endpoint)
            routes += 1
            if not any(method == verb and pattern.fullmatch(endpoint) for verb, pattern in mappings):
                errors.append(f'{name}: ruta sin controlador: {method} {url}')

# Repeated migrations are a documented deployment limitation, not a docs error.
versions = Counter(path.name.split('__')[0] for path in ROOT.joinpath('BackEnd/src/main/resources/db/migration').glob('V*__*.sql'))
report = {'markdown': len(FILES), 'enlaces_locales': links, 'rutas_api_documentadas': routes,
          'versiones_migracion_duplicadas': sorted(version for version,count in versions.items() if count > 1), 'errores': errors}
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(1 if errors else 0)
