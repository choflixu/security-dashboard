# ── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY pom.xml .
COPY /backend

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

# Directorio donde se montan/copian los scripts .sh
RUN mkdir -p /opt/security-scripts
COPY ../../scripts/*.sh /opt/security-scripts/
RUN chmod +x /opt/security-scripts/*.sh

# Puerto expuesto
EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
