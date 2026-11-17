package com.krive.fashions.config;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security model:
 * <ul>
 *   <li>Public: the catalogue (GET /api/products, /api/categories), checkout (POST /api/orders), /uploads/**.</li>
 *   <li>ADMIN only (HTTP Basic): /api/admin/**, POST/DELETE /api/uploads, GET /api/auth/me.</li>
 *   <li>Stateless: no session cookies, so CSRF protection is not needed and is switched off.</li>
 *   <li>The login can be disabled ONLY via krive.security.require-admin-login=false (the dev profile does this).</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private static final String DEFAULT_PASSWORD = "change-me";

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AppProperties properties) throws Exception {
        boolean locked = properties.security().requireAdminLogin();
        if (!locked) {
            log.warn("ADMIN LOGIN IS DISABLED (krive.security.require-admin-login=false): "
                    + "/api/admin/** and /api/uploads are open to anyone who can reach this server. Development only.");
        }

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    if (locked) {
                        auth.requestMatchers("/api/admin/**", "/api/uploads", "/api/uploads/**").hasRole("ADMIN");
                        auth.requestMatchers("/api/auth/me").authenticated();
                    }
                    auth.anyRequest().permitAll();
                })
                // The custom entry point answers 401 with JSON and WITHOUT a "WWW-Authenticate: Basic" header,
                // which stops browsers from popping their own login dialog over the admin dashboard.
                .httpBasic(basic -> basic.authenticationEntryPoint(SecurityConfig::unauthorized))
                .exceptionHandling(errors -> errors.accessDeniedHandler(SecurityConfig::forbidden));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(AppProperties properties, PasswordEncoder encoder, Environment environment) {
        String password = properties.security().adminPassword();
        boolean weak = password == null || password.isBlank() || DEFAULT_PASSWORD.equals(password);

        if (properties.security().requireAdminLogin() && weak) {
            if (environment.acceptsProfiles(Profiles.of("prod"))) {
                throw new IllegalStateException(
                        "Refusing to start: set KRIVE_ADMIN_PASSWORD to a strong value (it is missing or still 'change-me').");
            }
            log.warn("The admin password is the default 'change-me'. Set KRIVE_ADMIN_PASSWORD before deploying.");
        }

        UserDetails admin = User.withUsername(properties.security().adminUsername())
                .password(encoder.encode(password == null ? "" : password))
                .roles("ADMIN")
                .build();
        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(properties.cors().allowedOrigins());
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        cors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    private static void unauthorized(HttpServletRequest request, HttpServletResponse response,
                                     AuthenticationException exception) throws IOException {
        writeJson(response, HttpStatus.UNAUTHORIZED, "Admin login required.");
    }

    private static void forbidden(HttpServletRequest request, HttpServletResponse response,
                                  AccessDeniedException exception) throws IOException {
        writeJson(response, HttpStatus.FORBIDDEN, "You do not have permission to do that.");
    }

    private static void writeJson(HttpServletResponse response, HttpStatus status, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status.value()
                + ",\"error\":\"" + status.getReasonPhrase() + "\",\"message\":\"" + message + "\"}");
    }
}
