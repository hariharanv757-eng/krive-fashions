package com.krive.fashions.common;

/** The request is well-formed JSON but breaks a business rule (HTTP 400). */
public class BadRequestException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public BadRequestException(String message) {
        super(message);
    }
}
