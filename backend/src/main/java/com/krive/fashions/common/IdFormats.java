package com.krive.fashions.common;

import java.util.Locale;

/** Human-friendly identifiers that match what the storefront and admin already display. */
public final class IdFormats {

    private IdFormats() {
    }

    /** 1 -> KF-001, 12 -> KF-012, 1234 -> KF-1234 */
    public static String product(long number) {
        return String.format(Locale.ROOT, "KF-%03d", number);
    }

    /** 1043 -> ORD-1043 */
    public static String order(long number) {
        return "ORD-" + number;
    }
}
