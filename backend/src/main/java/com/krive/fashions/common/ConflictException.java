package com.krive.fashions.common;

/** The request conflicts with the current state of the data (HTTP 409). */
public class ConflictException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public ConflictException(String message) {
        super(message);
    }
}
