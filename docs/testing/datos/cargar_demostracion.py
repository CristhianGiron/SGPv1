#!/usr/bin/env python3
# @institucion   Universidad Nacional de Loja
# @carrera       Pedagogía de las Ciencias Experimentales - Informática
# @asignatura    Programación Web
# @docente       Johnny H. Sánchez L.
# @proyecto      Sistema de Gestión de Prácticas (SGP)
# @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
# @file          cargar_demostracion.py
# @fecha         2026-11-09 11:08:16
# @nota          Carga datos ficticios de demostración mediante la API local.

"""Add local demo accounts and genuine workflow records through authorized APIs.
Requires requests; reads administrator credentials from environment, never prints tokens.
Only creates demo-owned records; reruns reuse them without resetting existing accounts.
"""
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse
import requests

BASE = os.environ.get('SGP_DEMO_URL', 'http://localhost:8080').rstrip('/')
PASSWORD = os.environ.get('SGP_DEMO_PASSWORD', 'DemoPracticas2026!')
INITIAL = 'InicioDemo2026!'
PREFIX = 'demo2026.'
STUDENTS = [
 ('valentina.jaramillo', 'Valentina Isabel', 'Jaramillo Cueva', 'Práctica lista para comenzar'),
 ('mateo.ortega', 'Mateo Andrés', 'Ortega Salazar', 'Práctica lista para comenzar'),
 ('camila.espinosa', 'Camila Alejandra', 'Espinosa Rojas', 'Práctica activa'),
 ('nicolas.pineda', 'Nicolás Sebastián', 'Pineda Torres', 'Práctica activa'),
 ('daniela.villavicencio', 'Daniela Belén', 'Villavicencio Ruiz', 'Plan en borrador'),
 ('sebastian.maldonado', 'Sebastián David', 'Maldonado Vélez', 'Plan en borrador'),
 ('isabela.samaniego', 'Isabela Fernanda', 'Samaniego León', 'Plan enviado'),
 ('emilio.aguirre', 'Emilio Alejandro', 'Aguirre Castillo', 'Plan con observaciones'),
 ('sofia.quezada', 'Sofía Gabriela', 'Quezada Moreno', 'Plan aprobado'),
 ('gabriel.romero', 'Gabriel Esteban', 'Romero Pardo', 'Plan aprobado'),
 ('antonella.carrion', 'Antonella María', 'Carrión Delgado', 'Práctica concluida'),
 ('david.alvarado', 'David Francisco', 'Alvarado Zambrano', 'Práctica archivada'),
]

class Demo:
    def __init__(self):
        if urlparse(BASE).hostname not in ('localhost', '127.0.0.1', '::1'):
            raise RuntimeError('La carga de demostración solo admite una API local.')
        self.s = requests.Session()
        self.admin = self.login(os.environ.get('SGP_DEMO_ADMIN_USER', 'admin'), os.environ['SGP_DEMO_ADMIN_PASSWORD'])['accessToken']
        self.accounts = {r['username']: r for r in self.rows('/api/account')}
        self.created = []

    def call(self, method, path, body=None, token=None):
        for attempt in range(20):
            response = self.s.request(method, BASE + path, json=body, headers={'Authorization': 'Bearer ' + (token or self.admin)}, timeout=30)
            if response.status_code != 429: break
            wait = min(30, max(5, int(response.headers.get('Retry-After', '15'))))
            print(f'Esperando {wait}s para respetar el límite de operaciones local.', flush=True)
            time.sleep(wait)
        response.encoding = 'utf-8'
        if not response.ok:
            # Do not include headers or credential payloads in diagnostics.
            try: message = response.json().get('message', response.reason)
            except ValueError: message = response.reason
            raise RuntimeError(f'{method} {path}: HTTP {response.status_code}: {message}')
        if not response.content: return None
        try: return response.json()
        except ValueError: return response.text

    def login(self, username, password):
        for attempt in range(10):
            response = self.s.post(BASE + '/api/auth/login', json={'username': username, 'password': password}, timeout=30)
            if response.status_code != 429: break
            wait = min(30, max(10, int(response.headers.get('Retry-After', '15'))))
            print(f'Esperando {wait}s para respetar el límite de autenticación local.', flush=True)
            time.sleep(wait)
        if not response.ok: raise RuntimeError(f'No se pudo autenticar {username}: HTTP {response.status_code}')
        return response.json()

    def rows(self, path, token=None):
        result, page = [], 0
        while True:
            data = self.call('GET', path + ('&' if '?' in path else '?') + f'page={page}&size=100', token=token)
            if isinstance(data, list): return data
            result.extend(data.get('content', []))
            page += 1
            if page >= data.get('totalPages', 1): return result

    def ensure(self, path, key, value, payload):
        found = next((r for r in self.rows(path) if r.get(key) == value), None)
        if found and payload.get('name') and found.get('name') != payload['name']:
            raise RuntimeError('El código reservado ya pertenece a otro registro: ' + str(value))
        return found or self.call('POST', path, payload)

    def user(self, slug, names, surnames, role, index, **relations):
        username = PREFIX + slug
        existing = self.accounts.get(username)
        if existing:
            if role not in existing.get('roles', []) or existing.get('names') != names or existing.get('lastNames') != surnames:
                raise RuntimeError('El usuario reservado ya pertenece a otro registro: ' + username)
        else:
            digits = '110' + f'{index:06d}'
            check = sum((int(n) * (2 if i % 2 == 0 else 1)) // 10 + (int(n) * (2 if i % 2 == 0 else 1)) % 10 for i, n in enumerate(digits))
            cedula = digits + str((10 - check % 10) % 10)
            account_id = self.call('POST', '/api/admin/accounts', dict(username=username, password=PASSWORD if role == 'ROLE_ESTUDIANTE' else INITIAL, names=names, lastNames=surnames, cedula=cedula, institutionalEmail=slug+'@demo.example.test', address='Loja — datos ficticios de demostración', role=role, **relations))
            existing = dict(id=account_id, username=username, names=names, lastNames=surnames, roles=[role])
            self.accounts[username] = existing
            self.created.append(username)
        try:
            if username in self.created and role != 'ROLE_ESTUDIANTE': raise RuntimeError('Cuenta nueva con contraseña inicial')
            auth = self.login(username, PASSWORD)
        except RuntimeError:
            auth = self.login(username, INITIAL)
            self.call('PATCH', '/api/account/me/password', dict(currentPassword=INITIAL, newPassword=PASSWORD, confirmPassword=PASSWORD), auth['accessToken'])
            auth = self.login(username, PASSWORD)
        return dict(**existing, token=auth['accessToken'])

    def run(self):
        defaults = self.call('GET', '/api/public/institutional-defaults')
        university, career = defaults['universityId'], defaults['careerId']
        cycles = [r for r in self.rows('/api/academic-cycles') if r.get('careerId') == career and r.get('active', True)]
        if not cycles: raise RuntimeError('Se requiere un ciclo activo en la carrera predeterminada antes de cargar los ejemplos.')
        cycle = cycles[0]['id']
        provinces = self.rows('/api/locations/provinces')
        province = next((r for r in provinces if 'loja' in r['name'].lower()), provinces[0])
        cantons = self.rows(f"/api/locations/provinces/{province['id']}/cantons")
        canton = next((r for r in cantons if r['name'].lower() == 'loja'), cantons[0])
        parish = self.rows(f"/api/locations/cantons/{canton['id']}/parishes")[0]
        school = self.ensure('/api/institutions', 'code', '11H09926', dict(code='11H09926', name='Unidad Educativa Mirador de Loja — Demostración', type='COLEGIO', support='PUBLICO', address='Sector El Mirador, Loja — dirección ficticia', email='secretaria@demo.example.test', agreementActive=True, acceptsInterns=True, provinceId=province['id'], cantonId=canton['id'], parishId=parish['id'], regime='SIERRA', modality='PRESENCIAL', teacherCount=32, studentCount=680, mission='Formar estudiantes críticos mediante una educación inclusiva.', vision='Consolidar una comunidad educativa innovadora y participativa.', institutionalValues='Respeto, responsabilidad y colaboración.', educationLevels=['BGU']))
        grade = self.ensure('/api/grades', 'code', 'DEMO2026-BGU', dict(name='Primero de Bachillerato — Demo', code='DEMO2026-BGU', level=1, institutionId=school['id'], active=True))
        parallels = []
        for letter in ['A', 'B']:
            existing = next((r for r in self.rows('/api/grade-parallels') if r.get('gradeId') == grade['id'] and r.get('letter') == letter), None)
            parallels.append(existing or self.call('POST', '/api/grade-parallels', dict(gradeId=grade['id'], letter=letter, active=True)))
        director = self.user('marcela.velez', 'Marcela Patricia', 'Vélez Samaniego', 'ROLE_DIRECTOR_PRACTICAS', 101, careerId=career)
        school_director = self.user('teresa.cabrera', 'Teresa Elizabeth', 'Cabrera Ríos', 'ROLE_DIRECTORA_INSTITUCION', 102, institutionId=school['id'], gradeId=grade['id'])
        tutors, mentors, courses, groups, practices = [], [], [], [], []
        for i, (slug, names, surnames) in enumerate([('andres.cordova', 'Andrés Mauricio', 'Córdova Molina'), ('paola.salinas', 'Paola Cristina', 'Salinas Cabrera')]):
            tutors.append(self.user(slug, names, surnames, 'ROLE_TUTOR_PRACTICAS', 110+i, institutionId=university))
        for i, (slug, names, surnames) in enumerate([('elena.benitez', 'Elena Rocío', 'Benítez Palacios'), ('javier.rios', 'Javier Eduardo', 'Ríos Valdivieso')]):
            mentors.append(self.user(slug, names, surnames, 'ROLE_TUTOR_INSTITUCIONAL', 120+i, institutionId=school['id'], gradeParallelId=parallels[i]['id']))
            name = f'Informática — Demo 2026 — Paralelo {chr(65+i)}'
            course = self.ensure('/api/courses', 'name', name, dict(name=name, description='Prácticas de demostración: observación, planificación e intervención educativa.', capacity=20, academicCycleId=cycle, startDate='2026-09-01T08:00:00', endDate='2026-12-18T12:00:00'))
            if not course.get('practiceTutor'): self.call('PATCH', f"/api/courses/{course['id']}/practice-tutor/{tutors[i]['id']}")
            if not course.get('institutionalTutor'): self.call('PATCH', f"/api/courses/{course['id']}/institutional-tutor/{mentors[i]['id']}")
            group = next((r for r in self.rows(f"/api/courses/{course['id']}/groups", tutors[i]['token']) if r['name'] == 'Grupo de intervención educativa'), None)
            group = group or self.call('POST', f"/api/courses/{course['id']}/groups", dict(name='Grupo de intervención educativa', description='Grupo de demostración con tutor institucional asignado.', capacity=20, institutionalTutorId=mentors[i]['id']), tutors[i]['token'])
            offered = self.rows(f"/api/courses/{course['id']}/practice-offerings", director['token'])
            practice = next((r for r in offered if r['name'] == 'Práctica docente — Demo 2026'), None)
            practice = practice or self.call('POST', f"/api/courses/{course['id']}/practice-offerings", dict(name='Práctica docente — Demo 2026', capacity=20, startDate='2026-09-01T08:00:00', endDate='2026-12-18T12:00:00'), director['token'])
            courses.append(course); groups.append(group); practices.append(practice)
        report = []
        for i in list(range(1, len(STUDENTS))) + [0]:
            slug, names, surnames, stage = STUDENTS[i]
            student = self.user(slug, names, surnames, 'ROLE_ESTUDIANTE', 200+i, academicCycleId=cycle)
            token, idx = student['token'], i % 2
            enrollment = next((r for r in self.rows('/api/enrollments/me', token) if r.get('courseId') == courses[idx]['id']), None)
            self.call('PUT', f"/api/courses/{courses[idx]['id']}/students/{student['id']}", token=director['token'])
            enrollment = enrollment or self.call('POST', f"/api/practice-offerings/{practices[idx]['id']}/students", dict(studentId=student['id'], groupId=groups[idx]['id']), tutors[idx]['token'])
            if enrollment['status'] == 'PENDING': enrollment = self.call('PATCH', f"/api/enrollments/{enrollment['id']}/approve", token=director['token'])
            if i >= 2 and enrollment['status'] == 'APPROVED' and not enrollment.get('groupId'): enrollment = self.call('PATCH', f"/api/enrollments/{enrollment['id']}/group/{groups[idx]['id']}", token=tutors[idx]['token'])
            plan = None
            if i >= 4:
                plan = next((r for r in self.rows('/api/activity-plans/me', token) if r.get('enrollmentId') == enrollment['id']), None)
                if not plan:
                    body = self.call('GET', f"/api/activity-plans/defaults?enrollmentId={enrollment['id']}", token=token)
                    body.update(enrollmentId=enrollment['id'], curricularOrganizationUnit='Unidad de formación profesional', subjectDenomination='Didáctica de la informática', integrativeKnowledgeProject='Recursos digitales para el aprendizaje colaborativo', practiceType='Prácticas preprofesionales docentes', teacherCount=32, studentCount=680, mission='Formar estudiantes críticos mediante una educación inclusiva.', vision='Promover una comunidad educativa innovadora.', institutionalValues='Respeto, responsabilidad y colaboración.', presentation='Propuesta de observación y acompañamiento pedagógico en el aula de informática.', generalObjective='Aplicar estrategias didácticas inclusivas en el aprendizaje de informática.', specificObjective1='Diagnosticar las necesidades del grupo de estudiantes.', specificObjective2='Diseñar actividades con recursos digitales accesibles.', specificObjective3='Evaluar el aprendizaje y reflexionar sobre la intervención.', legalResources='Convenio de prácticas y lineamientos académicos institucionales.', humanResources='Estudiante practicante, tutor de prácticas y tutor institucional.', technologicalResources='Laboratorio de informática y herramientas de colaboración.', physicalResources='Aula, proyector y material didáctico.', activityWeeks=[dict(weekNumber=1,startDate='2026-09-07',endDate='2026-09-11',activities='Observación del aula y diagnóstico de conocimientos previos.')], scheduleWeeks=[dict(weekNumber=1,startDate='2026-09-07',endDate='2026-09-11',scheduledActivities='Observación, entrevista al tutor y diseño de actividades.')])
                    plan = self.call('POST', '/api/activity-plans', body, token)
                if i >= 6 and plan['status'] == 'DRAFT': plan = self.call('PATCH', f"/api/activity-plans/{plan['id']}/submit", token=token)
                if i == 7 and plan['status'] == 'SUBMITTED': plan = self.call('PATCH', f"/api/activity-plans/{plan['id']}/review", dict(approved=False, presentationFeedback='Precisar las estrategias de inclusión y los recursos para estudiantes con distintos ritmos de aprendizaje.'), tutors[idx]['token'])
                if i >= 8 and plan['status'] == 'SUBMITTED':
                    plan = self.call('PATCH', f"/api/activity-plans/{plan['id']}/review", dict(approved=True), tutors[idx]['token'])
                    if plan['status'] == 'SUBMITTED': plan = self.call('PATCH', f"/api/activity-plans/{plan['id']}/review", dict(approved=True), director['token'])
            if i >= 2 and enrollment['status'] == 'APPROVED':
                schedules = self.rows('/api/practice-schedules/managed', mentors[idx]['token'])
                schedule = next((r for r in schedules if r.get('enrollmentId') == enrollment['id']), None)
                if not schedule: schedule = self.call('POST', '/api/practice-schedules', dict(enrollmentId=enrollment['id'], startDate='2026-09-01', endDate='2026-12-18', observations='Jornada de acompañamiento pedagógico — datos de demostración.', periods=[dict(dayOfWeek='MONDAY',startTime='08:00',endTime='10:00',place='Laboratorio de informática')]), mentors[idx]['token'])
                if not schedule.get('attendances'):
                    for n, date in enumerate(['2026-09-07', '2026-09-14', '2026-09-21'][:1 + i // 4]):
                        self.call('POST', f"/api/practice-schedules/{schedule['id']}/attendances", dict(attendanceDate=date,status='PRESENT' if n != 2 else 'LATE',startTime='08:00' if n != 2 else '08:15',endTime='10:00',totalMinutes=120 if n != 2 else 105,observations='Registro ficticio para probar indicadores de asistencia.'), mentors[idx]['token'])
            if i >= 5 and enrollment['status'] == 'APPROVED':
                forms = self.rows('/api/practice-forms/me', token)
                if not any(r.get('enrollmentId') == enrollment['id'] for r in forms):
                    self.call('POST', '/api/practice-forms', dict(enrollmentId=enrollment['id'], targetRole='INSTITUTION_DIRECTOR' if i % 2 else 'INSTITUTIONAL_TUTOR', title='Entrevista de acompañamiento pedagógico', description='Entrevista ficticia para explorar la práctica y sus necesidades de mejora.', draft=i == 5, questions=[dict(type='OPEN_TEXT',prompt='¿Qué fortalezas y necesidades de mejora observa en el trabajo del practicante?',required=True)]), token)
            if i >= 10 and enrollment['status'] == 'APPROVED': enrollment = self.call('PATCH', f"/api/enrollments/{enrollment['id']}/complete", token=director['token'])
            if i == 11 and not enrollment.get('archived'): enrollment = self.call('PATCH', f"/api/enrollments/{enrollment['id']}/archive")
            report.append(dict(username=student['username'], name=names+' '+surnames, role='ROLE_ESTUDIANTE', stage=stage, enrollmentId=enrollment['id'], status=enrollment['status'], archived=enrollment.get('archived', False), planStatus=plan['status'] if plan else None))
            print(student['username'], enrollment['status'], plan['status'] if plan else 'Sin plan', flush=True)
        for user in [director, school_director, *tutors, *mentors]: report.append(dict(username=user['username'], name=user['names']+' '+user['lastNames'], role=user['roles'][0]))
        output = Path(__file__).with_name('usuarios-demostracion.json')
        output.write_text(json.dumps(dict(created=len(self.created), accounts=report), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(f'Carga comprobada: {len(report)} cuentas de demostración; {len(self.created)} nuevas en esta ejecución.')

if __name__ == '__main__':
    Demo().run()
