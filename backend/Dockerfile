# ==============================================================================
# Front-Page Flip Backend - Multi-Stage Production Dockerfile (Java 21 + Spring Boot 3)
# ==============================================================================

# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

COPY --from=build /app/target/frontpageflip-backend-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
