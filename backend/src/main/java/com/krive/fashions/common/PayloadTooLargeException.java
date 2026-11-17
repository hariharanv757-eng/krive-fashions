package com.krive.fashions.common;

/** The upload is larger than allowed (HTTP 413). */
public class PayloadTooLargeException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public PayloadTooLargeException(String message) {
        super(message);
    }
}
