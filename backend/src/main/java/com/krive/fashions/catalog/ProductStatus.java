package com.krive.fashions.catalog;

import com.krive.fashions.common.BadRequestException;

/** Matches the admin dashboard's "Listing status": Published / Draft. */
public enum ProductStatus {
    PUBLISHED("Published"),
    DRAFT("Draft");

    private final String label;

    ProductStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Null or blank means Published; anything unrecognised is a 400. */
    public static ProductStatus fromLabel(String value) {
        if (value == null || value.isBlank()) {
            return PUBLISHED;
        }
        String wanted = value.trim();
        for (ProductStatus status : values()) {
            if (status.label.equalsIgnoreCase(wanted)) {
                return status;
            }
        }
        throw new BadRequestException("Unknown status '" + value + "'. Use Published or Draft.");
    }

    public static ProductStatus optional(String value) {
        return value == null || value.isBlank() ? null : fromLabel(value);
    }
}
