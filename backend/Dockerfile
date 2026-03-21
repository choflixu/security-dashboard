# ── Build stage ──────────────────────────────────────────────────────────────
# IMPORTANTE: Railway usa la RAIZ del repo como contexto de build.
# En Railway: Settings -> Build -> Dockerfile Path = backend/Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY backend/pom.xml .
COPY backend/src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Herramientas Linux necesarias para los scripts Bash
RUN apk add --no-cache \
    bash \
    util-linux \
    net-tools \
    iproute2 \
    openssh-client \
    procps \
    shadow

# Copiar JAR
COPY --from=builder /app/target/dashboard-*.jar app.jar

# Scripts dentro de backend/scripts/ para que siempre esten
# disponibles en el contexto de build (commiteados junto al codigo)
RUN mkdir -p /opt/security-scripts
COPY backend/scripts/*.sh /opt/security-scripts/
RUN find /opt/security-scripts -name "*.sh" -exec chmod +x {} \;

# Puerto expuesto
EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
