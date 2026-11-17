package com.krive.fashions.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Everything under {@code krive.*} in application.yml, as one typed object. */
@ConfigurationProperties(prefix = "krive")
public record AppProperties(Upload upload, Security security, Cors cors, Seed seed) {

    public record Upload(String dir, long maxBytes) {
    }

    public record Security(boolean requireAdminLogin, String adminUsername, String adminPassword) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Seed(boolean enabled) {
    }
}
