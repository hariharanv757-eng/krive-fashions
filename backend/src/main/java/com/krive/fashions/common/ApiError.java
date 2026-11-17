package com.krive.fashions.common;

import java.util.List;

/** The single error shape every endpoint returns, so the frontend can show {@code message} directly. */
public record ApiError(String timestamp, int status, String error, String message, String path,
                       List<FieldProblem> fieldErrors) {

    public record FieldProblem(String field, String message) {
    }
}
