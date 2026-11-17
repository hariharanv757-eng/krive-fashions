# ---- build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- run ----
FROM eclipse-temurin:21-jre
RUN useradd --system --create-home --uid 10001 krive
WORKDIR /app
COPY --from=build /build/target/krive-fashions-api-*.jar app.jar
RUN mkdir -p /app/uploads && chown -R krive:krive /app
USER krive
ENV SPRING_PROFILES_ACTIVE=prod \
    KRIVE_UPLOAD_DIR=/app/uploads \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
VOLUME /app/uploads
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
