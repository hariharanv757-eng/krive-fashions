package com.krive.fashions.auth;

import com.krive.fashions.config.AppProperties;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/auth/me — a login check for the admin UI. When a login is required, a request without valid
 * credentials gets 401 (from the security filter); with valid credentials it gets 200 and the username.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppProperties properties;

    public AuthController(AppProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/me")
    public AuthStatus me(Authentication authentication) {
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
        return new AuthStatus(
                properties.security().requireAdminLogin(),
                authenticated,
                authenticated ? authentication.getName() : null);
    }
}
