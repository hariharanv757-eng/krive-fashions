package com.krive.fashions.auth;

/**
 * @param loginRequired whether this server demands an admin login at all (false only in the open dev profile)
 * @param authenticated whether the request carried valid admin credentials
 * @param username      the logged-in admin, or null
 */
public record AuthStatus(boolean loginRequired, boolean authenticated, String username) {
}
