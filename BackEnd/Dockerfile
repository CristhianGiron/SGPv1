# @institucion   Universidad Nacional de Loja
# @carrera       Pedagogía de las Ciencias Experimentales - Informática
# @asignatura    Programación Web
# @docente       Johnny H. Sánchez L.
# @proyecto      Sistema de Gestión de Prácticas (SGP)
# @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
# @file          Dockerfile
# @fecha         2026-11-09 11:08:16
# @nota          Define la construcción y ejecución del contenedor del backend.

FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/systemsgp-0.0.1-SNAPSHOT.jar"]