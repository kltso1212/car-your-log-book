# --- Stage 1: Build ---
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

# --- Stage 2: Run ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# Cloud Run provides PORT; server.port=${PORT:5000} picks it up.
EXPOSE 5000
CMD ["java", "-jar", "app.jar"]
