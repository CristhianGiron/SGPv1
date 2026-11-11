<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          secuencia-login.md
  @fecha         2026-11-09 11:20:34
  @nota          Documenta Diagrama de secuencia: iniciar sesión.
-->

# Diagrama de secuencia: iniciar sesión

El [diagrama PlantUML de CU01](artefactos/diagrama-secuencia-login.puml) utiliza un nivel intermedio de detalle, con seis participantes: usuario, pantalla de acceso, API SGP, Spring Security, base de datos y servicio JWT.

Representa los procesos destacados:

1. Captura y validación de los datos de acceso.
2. Búsqueda por usuario o correo institucional y comprobación del estado de la cuenta.
3. Verificación de la contraseña mediante BCrypt y rechazo de accesos inválidos.
4. Recarga de los datos de la cuenta autenticada y emisión de tokens JWT firmados con caducidad.
5. Almacenamiento de la autenticación y consulta del perfil mediante el token de acceso.
6. Validación del JWT y de la cuenta, carga del perfil y control del cambio obligatorio de contraseña.
7. Presentación de la ruta autorizada o del panel correspondiente a sus roles.

BCrypt verifica un **hash**: el sistema no descifra la contraseña. Los JWT están **firmados**, no cifrados; la firma permite verificar su integridad y autenticidad. El diagrama no añade cifrado de transporte ni otros mecanismos que no se desprendan de esta configuración.

Las clases internas y consultas repetidas se agrupan para mantener legible el flujo. La renovación de tokens, el cambio de contraseña completo y los errores generales de red o servidor quedan fuera de esta vista. La validación de la petición protegida agrupa las comprobaciones del filtro JWT y los servicios de cuenta; no pretende detallar cada llamada interna del filtro.

Fuentes: [LoginPage](../../FrontEnd/src/features/auth/pages/LoginPage.jsx), [AuthContext](../../FrontEnd/src/features/auth/context/AuthContext.jsx), [AuthService](../../BackEnd/src/main/java/com/sgp/systemsgp/service/AuthService.java), [SecurityConfig](../../BackEnd/src/main/java/com/sgp/systemsgp/config/SecurityConfig.java), [JwtAuthFilter](../../BackEnd/src/main/java/com/sgp/systemsgp/config/JwtAuthFilter.java), [JwtService](../../BackEnd/src/main/java/com/sgp/systemsgp/config/JwtService.java), [AppShell](../../FrontEnd/src/app/App.jsx) y [StaffHomePage](../../FrontEnd/src/features/dashboard/pages/StaffHomePage.jsx).

Abrir el archivo `.puml` con la vista previa de PlantUML.
