package com.krive.fashions.common;

/** The upload is not a supported kind of file (HTTP 415). */
public class UnsupportedMediaException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public UnsupportedMediaException(String message) {
        super(message);
    }
}
