#!/usr/bin/env python3
# @institucion   Universidad Nacional de Loja
# @carrera       Pedagogía de las Ciencias Experimentales - Informática
# @asignatura    Programación Web
# @docente       Johnny H. Sánchez L.
# @proyecto      Sistema de Gestión de Prácticas (SGP)
# @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
# @file          actualizar_cabeceras.py
# @fecha         2026-11-09 11:08:16
# @nota          Mantiene y comprueba las cabeceras institucionales y su índice de cobertura.

"""Mantiene las cabeceras académicas sin cambiar el contenido ejecutable."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import argparse
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'docs/metadatos/cabeceras-archivos.json'
COMMON = [
    ('institucion', 'Universidad Nacional de Loja'),
    ('carrera', 'Pedagogía de las Ciencias Experimentales - Informática'),
    ('asignatura', 'Programación Web'),
    ('docente', 'Johnny H. Sánchez L.'),
    ('proyecto', 'Sistema de Gestión de Prácticas (SGP)'),
    ('estudiante', 'Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)'),
]
SPECIAL = {
    'diagrama-secuencia-login': 'Representa la secuencia de inicio de sesión, validación de la cuenta y selección del espacio de trabajo.',
    'PracticeArchiveExportController': 'Expone la descarga del expediente de una práctica como archivo ZIP.',
    'PracticeArchiveExportService': 'Reúne los documentos y evidencias autorizados de una práctica para exportar su expediente ZIP.',
    'EnrollmentService': 'Gestiona la asignación administrativa de estudiantes y el ciclo de vida de sus prácticas.',
    'EnrollmentController': 'Expone las consultas y transiciones de estado de las inscripciones y prácticas.',
    'PracticeOfferingService': 'Gestiona las prácticas ofrecidas a un paralelo y su período de inscripción.',
    'PracticeOfferingController': 'Expone la creación de prácticas y la inscripción de estudiantes por personal autorizado.',
    'CourseMembershipService': 'Gestiona la pertenencia académica a paralelos y comprueba la compatibilidad del ciclo.',
    'PracticeAccessService': 'Centraliza las comprobaciones de acceso y del estado operativo de las prácticas.',
    'PracticeCompletionService': 'Calcula las advertencias documentales y de horas para el cierre manual de una práctica.',
    'PracticePeriod': 'Resuelve las fechas de la práctica y la compatibilidad con registros anteriores.',
    'SystemsgpApplication': 'Inicia la aplicación del sistema de gestión de prácticas con Spring Boot.',
    'SecurityConfig': 'Configura la autenticación y las reglas de autorización de las rutas de la API.',
    'JwtService': 'Gestiona los tokens JWT utilizados en la autenticación de la API.',
    'LoginPage': 'Presenta el acceso institucional y envía las credenciales al flujo de autenticación del sistema.',
    'RegisterStudentPage': 'Presenta el registro público de estudiantes y sus datos de acceso.',
    'ForcePasswordChangePage': 'Permite actualizar la contraseña cuando la cuenta requiere un cambio inicial.',
    'PracticeWorkspacePage': 'Presenta las prácticas asignadas y permite abrir las actividades de cada práctica.',
    'CoursesPage': 'Permite gestionar los paralelos, sus prácticas, estudiantes, grupos y asignaciones autorizadas.',
    'PracticeOfferingsPanel': 'Permite crear prácticas del paralelo e inscribir a los estudiantes de su listado académico.',
    'CourseRoster': 'Permite al personal autorizado gestionar la pertenencia académica de estudiantes al paralelo.',
    'PracticeArchivePage': 'Presenta el historial y las acciones autorizadas de conclusión, reapertura y archivo de prácticas.',
    'PracticeFormsPage': 'Gestiona los formularios de entrevistas y observación asociados a las prácticas.',
    'PhotosPage': 'Permite registrar y consultar las evidencias fotográficas de las prácticas.',
    'SchedulesPage': 'Presenta las jornadas de prácticas y los registros de asistencia según los permisos de cada usuario.',
    'DocumentsPage': 'Presenta los módulos documentales de la práctica y sus operaciones autorizadas.',
    'DidacticPlansPage': 'Gestiona las planificaciones didácticas y sus recomendaciones dentro del alcance del usuario.',
    'AccountsPage': 'Presenta la administración de cuentas, roles y estado de acceso al sistema.',
    'ProfilePage': 'Presenta los datos de la cuenta y las opciones de actualización del perfil.',
    'NotificationsPage': 'Presenta las notificaciones de la cuenta y permite consultar sus eventos relacionados.',
    'DashboardPage': 'Presenta el panel de entrada y la información disponible según el rol del usuario.',
    'StaffHomePage': 'Presenta los accesos a las tareas del personal autorizado según su rol.',
    'InstitutionWorkPage': 'Agrupa las tareas y asignaciones vinculadas al trabajo de la institución.',
    'EvidenceViewerPage': 'Presenta la consulta de evidencias y archivos relacionados con una práctica.',
    'InstitutionsPage': 'Presenta la gestión y consulta de las instituciones del sistema.',
    'PracticeInstitutionsPage': 'Presenta los centros receptores y su información para el desarrollo de prácticas.',
    'UniversitiesPage': 'Presenta la estructura universitaria y su gestión según los permisos del usuario.',
    'LocationsPage': 'Presenta los catálogos de ubicación geográfica utilizados por el sistema.',
    'ReportsPage': 'Presenta los reportes y filtros de consulta autorizados.',
    'CatalogWorkflowPage': 'Organiza la gestión de catálogos y sus relaciones en la interfaz.',
}
AREAS = {
    'AcademicCycle': 'los ciclos académicos', 'Account': 'las cuentas de usuario',
    'ActivityEvaluation': 'la evaluación de actividades (L.4)', 'ActivityPlan': 'el plan de actividades (L.2)',
    'CompletedActivityRecord': 'el registro de actividades cumplidas (L.6)',
    'PracticeFollowUp': 'el seguimiento de prácticas (L.5)', 'FinalReport': 'el informe del tutor institucional (L.3)',
    'PracticeReport': 'el informe de actividades cumplidas (L.1)', 'PracticeSchedule': 'las jornadas de prácticas',
    'PracticeAttendance': 'la asistencia a prácticas', 'PracticeForm': 'los instrumentos de entrevista y observación',
    'DidacticPlan': 'las planificaciones didácticas', 'CourseGroup': 'los grupos del paralelo',
    'CourseStudent': 'la pertenencia académica de estudiantes', 'Course': 'los paralelos académicos',
    'PracticeOffering': 'las prácticas ofrecidas a un paralelo', 'Enrollment': 'las inscripciones y prácticas asignadas',
    'Institution': 'las instituciones', 'Career': 'las carreras universitarias', 'Faculty': 'las facultades universitarias',
    'Subject': 'las asignaturas', 'Notification': 'las notificaciones', 'PracticePhoto': 'las evidencias fotográficas',
    'WorkspaceDraft': 'los borradores de trabajo', 'EntityImage': 'las imágenes de las entidades',
    'Auth': 'la autenticación de usuarios', 'Location': 'los catálogos geográficos',
    'Pdf': 'los documentos PDF', 'GradeParallel': 'los paralelos de los centros receptores', 'Grade': 'los grados educativos',
}


def area(stem):
    return next((label for key, label in AREAS.items() if key.lower() in stem.lower()),
                'el módulo ' + re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', stem))


def description(path, text):
    name = path.name
    stem = path.stem
    if name == 'actualizar_cabeceras.py':
        return ['Mantiene y comprueba las cabeceras institucionales y su índice de cobertura.']
    if name == 'check-migrations-isolated.py':
        return ['Comprueba las migraciones en una instancia temporal y aislada de MariaDB.']
    if name.endswith(('.test.jsx', '.test.js')) or '/src/test/' in path.as_posix() or '/qa/' in path.as_posix():
        return ['Comprueba el comportamiento de ' + area(stem.replace('.test', '')) + ' mediante pruebas de regresión.']
    if stem in SPECIAL:
        return [SPECIAL[stem]]
    if path.suffix == '.java':
        label = area(stem)
        if '/dto/' in path.as_posix():
            return [('Define los datos de entrada para ' if stem.endswith('Request') else 'Define los datos de respuesta para ') + label + '.']
        for ending, phrase in [('Controller', 'Expone las operaciones HTTP relacionadas con '), ('Service', 'Implementa la lógica de aplicación de '), ('Repository', 'Define las consultas de persistencia para '), ('Specification', 'Define los criterios de filtrado de ')]:
            if stem.endswith(ending):
                return [phrase + label + '.']
        if '/model/' in path.as_posix():
            return ['Representa los datos persistentes de ' + label + '.']
        if '/enums/' in path.as_posix():
            return ['Define los valores permitidos de ' + label + '.']
        if '/exception/' in path.as_posix():
            return ['Define el tratamiento de errores de ' + label + '.']
        if '/config/' in path.as_posix():
            return ['Configura los componentes de ' + label + ' en el backend.']
        return ['Implementa el componente ' + stem + ' del backend del SGP.']
    if path.suffix == '.html':
        if 'prototipos-interfaces' in path.parts:
            screens = {
                'index': 'la navegación general de los prototipos del SGP',
                'cobertura': 'la cobertura de las pantallas y flujos del prototipo',
                '01-iniciar-sesion': 'el acceso mediante usuario o correo y contraseña',
                '02-registrar-estudiante': 'el registro de estudiantes',
                '03-oferta-publica': 'la consulta pública de la oferta de prácticas',
                '04-perfil': 'la consulta y edición del perfil de la cuenta',
                '05-cuentas': 'la administración de cuentas de usuario',
                '06-catalogos': 'la administración de catálogos académicos',
                '07-instituciones': 'la consulta y gestión de instituciones',
                '08-cursos-grupos': 'la gestión de paralelos y grupos de prácticas',
                '09-inscripcion': 'la asignación de prácticas a estudiantes',
                '09b-resolver-inscripciones': 'la gestión administrativa de las inscripciones',
                '10-asignar-grupo': 'la asignación de estudiantes a grupos',
                '11-estado-practica': 'la consulta del estado y avance de una práctica',
                '12-archivo': 'el archivo y la consulta de prácticas históricas',
                '13-documentos': 'la navegación de los documentos de una práctica',
                '13b-plan-actividades': 'la preparación del plan de actividades',
                '13c-informe-actividades': 'la preparación del informe de actividades cumplidas',
                '13d-informe-final': 'la preparación del informe final de práctica',
                '14-revision': 'la revisión de documentos de prácticas',
                '15-evaluacion': 'la evaluación de las actividades de práctica',
                '15b-seguimiento': 'el seguimiento de estudiantes en prácticas',
                '16-registro-actividades': 'el registro de las actividades cumplidas',
                '17-evidencias': 'el registro y consulta de evidencias',
                '18-entrevistas': 'la preparación y consulta de entrevistas de la práctica',
                '18b-respuestas-entrevista': 'la consulta de respuestas de entrevistas',
                '18c-ficha-observacion': 'el registro e interpretación de fichas de observación',
                '19-jornadas': 'la organización de jornadas y registros de asistencia',
                '20-planificacion': 'la elaboración de planificaciones didácticas',
                '21-panel': 'el panel de tareas y accesos del usuario',
                '21b-notificaciones': 'la consulta de notificaciones del usuario',
                '22-anuncios': 'la publicación y consulta de anuncios',
                '23-reportes': 'la consulta de reportes del sistema',
                '24-imagenes': 'la gestión de imágenes del sistema',
                '25-documento-pdf': 'la visualización de documentos PDF',
                '26-recuperar-acceso': 'la recuperación del acceso a una cuenta',
            }
            notes = ['Presenta el prototipo de interfaz para ' + screens.get(stem, stem) + '.']
            if stem == '01-iniciar-sesion':
                notes = ['Permite ingresar al sistema mediante usuario o correo y contraseña; valida credenciales y el estado de la cuenta.',
                         'Redirige al panel según el rol y obliga el cambio inicial de contraseña cuando corresponda.']
            return notes + ['La maqueta utiliza datos de demostración; las validaciones operativas corresponden a la aplicación.']
        return ['Define el documento HTML de entrada de la interfaz web del SGP.']
    if path.suffix in {'.js', '.jsx', '.cjs'}:
        if path.as_posix() == 'FrontEnd/src/index.js':
            return ['Inicia la interfaz React y monta los proveedores y componentes principales del sistema.']
        if name in {'App.js', 'App.jsx'}:
            return ['Compone la aplicación web y resuelve las rutas según la sesión y los permisos del usuario.']
        folder = path.parent.name
        if folder == 'config':
            return ['Define la configuración de ' + stem + ' utilizada por la interfaz.']
        if folder in {'hooks', 'contexts', 'auth'}:
            return ['Gestiona el estado y la integración de ' + stem + ' en la interfaz React.']
        if folder in {'utils', 'api'}:
            return ['Proporciona las funciones de ' + stem + ' utilizadas por la interfaz del SGP.']
        return ['Implementa el componente ' + stem + ' de la interfaz del SGP.']
    if path.suffix == '.css':
        return ['Define los estilos de ' + ('los prototipos de interfaz.' if 'prototipos-interfaces' in path.parts else 'la interfaz del SGP para ' + stem + '.')]
    if path.suffix == '.md':
        heading = re.search(r'^#\s+(.+)', text, re.M)
        return ['Documenta ' + (heading.group(1).strip().rstrip('.') if heading else stem) + '.']
    if path.suffix == '.sql':
        return ['Define la migración ' + stem.replace('__', ': ').replace('_', ' ') + ' del esquema de datos.']
    if name == 'pom.xml':
        return ['Define las dependencias y el proceso de construcción del backend con Maven.']
    if path.suffix in {'.properties', '.factories'}:
        return ['Define la configuración de ' + name + ' utilizada por el backend y sus herramientas.']
    if name == 'Dockerfile':
        return ['Define la construcción y ejecución del contenedor del backend.']
    if name == 'robots.txt':
        return ['Define las reglas de acceso de los rastreadores web al frontend.']
    if path.suffix == '.puml':
        return ['Describe el diagrama de casos de uso del SGP mediante PlantUML.']
    if path.suffix == '.svg':
        return ['Define el icono vectorial de la aplicación SGP.']
    if path.suffix == '.py':
        return [{'actualizar_cabeceras.py': 'Mantiene y comprueba las cabeceras institucionales y su índice de cobertura.', 'verificar_documentacion.py': 'Comprueba los enlaces y las referencias de la documentación local.', 'cargar_demostracion.py': 'Carga datos ficticios de demostración mediante la API local.', 'check-migrations-isolated.py': 'Comprueba las migraciones en una instancia temporal y aislada de MariaDB.'}.get(name, 'Automatiza las tareas de ' + stem + ' del proyecto.')]
    if name in {'.gitignore', '.dockerignore', '.gitattributes'}:
        return ['Define las reglas de ' + name + ' para las herramientas del proyecto.']
    if name == 'package.json':
        return ['Declara las dependencias y los scripts de ejecución del frontend.']
    if name == 'package-lock.json':
        return ['Fija las versiones y la integridad del árbol de dependencias del frontend.']
    if path.suffix == '.json':
        return ['Conserva los datos estructurados de ' + name + '.']
    if path.suffix in {'.png', '.jpg', '.ico'}:
        return ['Contiene un recurso gráfico del proyecto: ' + name + '.']
    return ['Conserva el recurso ' + name + ' del proyecto SGP.']


def kind(path):
    value = path.as_posix()
    if value.startswith('BackEnd/src/main/resources/db/migration/'):
        return None, 'Migración histórica: conservar los checksums de Flyway.'
    if path.name in {'mvnw', 'mvnw.cmd', 'maven-wrapper.properties'}:
        return None, 'Herramienta generada de terceros: conservar su contenido y licencia.'
    if path.suffix in {'.log', '.csv', '.pdf', '.xlsx', '.png', '.jpg', '.ico'}:
        return None, 'Evidencia, datos tabulares o recurso binario: no alterar su contenido.'
    if path.suffix == '.json' or path.name == '.hintrc':
        return None, 'JSON no admite comentarios; los metadatos se registran en este índice.'
    if path.suffix in {'.java', '.js', '.jsx', '.cjs', '.css'}:
        return 'block', None
    if path.suffix in {'.html', '.xml', '.md', '.svg'}:
        return 'html', None
    if path.suffix == '.puml':
        return 'plantuml', None
    if path.suffix in {'.py', '.properties', '.factories'} or path.name in {'Dockerfile', '.gitignore', '.dockerignore', '.gitattributes', 'robots.txt'}:
        return 'hash', None
    return None, 'Formato sin sintaxis de comentario habilitada: metadatos en este índice.'


def separate(text, style):
    """Conserva prólogos que deben preceder a los comentarios."""
    prefix = ''
    if text.startswith('\ufeff'):
        prefix, text = '\ufeff', text[1:]
    patterns = [r'^<\?xml[^>]*\?>[^\S\r\n]*(?:\r?\n)?', r'^<!doctype[^>]*>[^\S\r\n]*(?:\r?\n)?', r'^@startuml[^\r\n]*(?:\r?\n)?', r'^@charset[^\r\n]*(?:\r?\n)?']
    for pattern in patterns:
        match = re.match(pattern, text, re.I)
        if match:
            prefix += match.group();text = text[match.end():];break
    if text.startswith('#!'):
        match = re.match(r'^#![^\r\n]*(?:\r?\n)?', text)
        prefix += match.group();text = text[match.end():]
    if style == 'hash' and re.match(r'^#.*coding[:=]', text):
        match = re.match(r'^#[^\r\n]*(?:\r?\n)?', text)
        prefix += match.group();text = text[match.end():]
    original = ''
    patterns = {
        'block': r'^/\*\s*\r?\n\s*\*?\s*@institucion\b[\s\S]*?\*/\r?\n(?:\r?\n)?',
        'html': r'^(?:<!--\s*@(?:institucion|carrera|asignatura|docente|proyecto|estudiante|file|fecha|nota)\b[\s\S]*?-->\r?\n)+(?:\r?\n)?',
        'hash': r'^(?:#\s*@(?:institucion|carrera|asignatura|docente|proyecto|estudiante|file|fecha|nota)\b[^\r\n]*\r?\n)+(?:\r?\n)?',
        'plantuml': r"^/'\s*\r?\n\s*@institucion\b[\s\S]*?'/(?:\r?\n)(?:\r?\n)?",
    }
    match = re.match(patterns[style], text)
    if match:
        original, text = match.group(), text[match.end():]
    return prefix, original, text


def header(path, notes, style, date, newline):
    fields = COMMON + [('file', path.name), ('fecha', date)] + [('nota', note) for note in notes]
    lines = [f'@{key:<13} {value}' for key, value in fields]
    lines = [line.replace('*/', '* /').replace('--', '—').replace("'/", "' /") for line in lines]
    if style == 'block':
        return newline.join(['/*', *(' * ' + line for line in lines), ' */', '', ''])
    if style == 'html':
        return newline.join(['<!--', *('  ' + line for line in lines), '-->', '', ''])
    if style == 'plantuml':
        return newline.join(["/'", *('  ' + line for line in lines), "'/", '', ''])
    return newline.join(['# ' + line for line in lines] + ['', ''])


def inventory():
    raw = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=ROOT)
    paths = {Path(item.decode('utf-8')) for item in raw.split(b'\0') if item}
    paths.add(INDEX.relative_to(ROOT))
    return sorted((path for path in paths if (ROOT / path).is_file() or path == INDEX.relative_to(ROOT)), key=lambda p: p.as_posix())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--aplicar', action='store_true', help='Añade o actualiza las cabeceras y el índice.')
    args = parser.parse_args()
    now = datetime.now(ZoneInfo('America/Guayaquil')).strftime('%Y-%m-%d %H:%M:%S')
    entries, changed, errors, protected = [], [], [], []
    previous = json.loads(INDEX.read_text()) if INDEX.exists() else {'archivos': []}
    previous_entries = {entry['ruta']: entry for entry in previous['archivos']}
    for path in inventory():
        full = ROOT / path
        style, reason = kind(path)
        data = full.read_bytes() if full.exists() else b''
        text = ''
        try:
            text = data.decode('utf-8')
        except UnicodeDecodeError:
            style, reason = None, 'Recurso binario: conservar sus bytes y registrar metadatos en el índice.'
        old = previous_entries.get(path.as_posix(), {})
        date = old.get('fecha', now)
        body = text
        if style:
            prefix, original, body = separate(text, style)
            stamp = re.search(r'@fecha\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', original)
            if stamp and all(value in original for _, value in COMMON):
                date = stamp.group(1)
            notes = description(path, body)
            newline = '\r\n' if '\r\n' in text else '\n'
            expected = prefix + header(path, notes, style, date, newline) + body
            # Institutional metadata is the only permitted change.
            if separate(expected, style)[2] != body:
                raise RuntimeError('Cambió el contenido fuera de la cabecera: ' + str(path))
            if expected != text:
                changed.append(path.as_posix())
                if args.aplicar:
                    full.write_bytes(expected.encode('utf-8'))
                else:
                    errors.append('Cabecera ausente o desactualizada: ' + str(path))
        else:
            notes = description(path, text)
            protected.append(path.as_posix())
        entry = {'ruta': path.as_posix(), 'fecha': date, 'notas': notes, 'cabeceraEnArchivo': bool(style)}
        if style:
            entry['contenidoSinCabeceraSha256'] = hashlib.sha256((prefix + body).encode('utf-8')).hexdigest()
        else:
            entry['motivo'] = reason
            if path != INDEX.relative_to(ROOT):
                entry['sha256'] = hashlib.sha256(data).hexdigest()
        entries.append(entry)
    document = {'institucion': COMMON[0][1], 'carrera': COMMON[1][1], 'asignatura': COMMON[2][1], 'docente': COMMON[3][1], 'proyecto': COMMON[4][1], 'estudiantes': [value for key, value in COMMON if key == 'estudiante'], 'zonaHoraria': 'America/Guayaquil', 'fechaSignificado': 'Fecha de incorporación de la cabecera o del registro de metadatos; no implica fecha original de creación del archivo.', 'archivos': entries}
    rendered = json.dumps(document, ensure_ascii=False, indent=2) + '\n'
    if args.aplicar:
        INDEX.parent.mkdir(parents=True, exist_ok=True);INDEX.write_text(rendered, encoding='utf-8')
    elif not INDEX.exists() or INDEX.read_text() != rendered:
        errors.append('Índice de cabeceras ausente o desactualizado.')
    for error in errors[:20]:
        print(error)
    print(json.dumps({'archivos': len(entries), 'conCabecera': len(entries)-len(protected), 'metadatosEnIndice': len(protected), 'actualizados': len(changed), 'errores': len(errors)}, ensure_ascii=False))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
