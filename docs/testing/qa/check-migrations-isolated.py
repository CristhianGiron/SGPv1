# @institucion   Universidad Nacional de Loja
# @carrera       Pedagogía de las Ciencias Experimentales - Informática
# @asignatura    Programación Web
# @docente       Johnny H. Sánchez L.
# @proyecto      Sistema de Gestión de Prácticas (SGP)
# @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
# @file          check-migrations-isolated.py
# @fecha         2026-11-09 11:08:16
# @nota          Comprueba las migraciones en una instancia temporal y aislada de MariaDB.

"""Run migration regression against a disposable MariaDB, never the application DB."""
import os, pathlib, socket, subprocess, tempfile, time, shutil

project = pathlib.Path(__file__).resolve().parents[3]
work = pathlib.Path(tempfile.mkdtemp(prefix='sgp-migrations-'))
server = None
try:
    subprocess.run(['mariadb-install-db', '--no-defaults', f'--datadir={work}/data', '--auth-root-authentication-method=normal', '--skip-test-db'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0))
        port = probe.getsockname()[1]
    server = subprocess.Popen(['/usr/sbin/mariadbd', '--no-defaults', f'--datadir={work}/data', f'--socket={work}/server.sock', f'--port={port}', '--bind-address=127.0.0.1', f'--pid-file={work}/server.pid', f'--log-error={work}/server.log'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    client = ['mariadb', '--no-defaults', f'--socket={work}/server.sock', '-uroot']
    for attempt in range(100):
        if server.poll() is not None:
            raise RuntimeError((work/'server.log').read_text())
        ready = subprocess.run(client + ['-e', 'SELECT 1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if ready.returncode == 0: break
        time.sleep(.1)
    else: raise RuntimeError('Disposable MariaDB did not start')
    subprocess.run(client + ['-e', 'CREATE DATABASE sgp_migration_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE sgp_migration_boot_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE sgp_migration_legacy_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'], check=True)
    env = dict(os.environ, SGP_MIGRATION_TEST_URL=f'jdbc:mariadb://127.0.0.1:{port}/sgp_migration_test')
    log = pathlib.Path(os.environ.get('SGP_QA_OUTPUT', '/tmp/sgp-migrations-mariadb.log'))
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open('w') as output:
        result = subprocess.run(['./mvnw', '-q', '-Dtest=MigrationChainMariaDbTest', 'test'], cwd=project/'BackEnd', env=env, stdout=output, stderr=subprocess.STDOUT, timeout=180)
    print(f'MariaDB isolated migration test exit={result.returncode}; evidence: {log}')
    raise SystemExit(result.returncode)
finally:
    if server is not None:
        # Shut down over the isolated socket: sandbox PID namespaces may not
        # allow signalling the server PID returned by the process launcher.
        subprocess.run(['mariadb-admin', '--no-defaults', f'--socket={work}/server.sock', '-uroot', 'shutdown'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
        try: server.wait(timeout=15)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f'Temporary server did not stop; retained {work}')
    shutil.rmtree(work)
