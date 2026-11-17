package com.krive.fashions.catalog;

import com.krive.fashions.common.BadRequestException;

/** The two storefront sections. The API speaks the same labels the frontend uses: "Women" / "Men". */
public enum Department {
    WOMEN("Women"),
    MEN("Men");

    private final String label;

    Department(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Null or blank means the default (Women); anything unrecognised is a 400. */
    public static Department fromLabel(String value) {
        if (value == null || value.isBlank()) {
            return WOMEN;
        }
        String wanted = value.trim();
        for (Department department : values()) {
            if (department.label.equalsIgnoreCase(wanted) || department.name().equalsIgnoreCase(wanted)) {
                return department;
            }
        }
        throw new BadRequestException("Unknown department '" + value + "'. Use Women or Men.");
    }

    /** Like {@link #fromLabel} but returns null for null/blank (used by optional filters). */
    public static Department optional(String value) {
        return value == null || value.isBlank() ? null : fromLabel(value);
    }
}
