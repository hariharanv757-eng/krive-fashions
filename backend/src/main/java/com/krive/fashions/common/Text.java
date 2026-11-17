package com.krive.fashions.common;

/** Small string helpers shared by services. */
public final class Text {

    private Text() {
    }

    /** Trims; returns null for null or blank input so optional columns stay clean. */
    public static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Lower-cased LIKE pattern for case-insensitive "contains" search, or null if there is no query. */
    public static String likePattern(String query) {
        String cleaned = blankToNull(query);
        return cleaned == null ? null : "%" + cleaned.toLowerCase() + "%";
    }
}
