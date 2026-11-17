package com.krive.fashions.common;

/** Keeps client-supplied paging values inside sane bounds instead of rejecting the request. */
public final class Paging {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private Paging() {
    }

    public static int page(Integer requested) {
        return requested == null ? 0 : Math.max(0, requested);
    }

    public static int size(Integer requested) {
        if (requested == null) {
            return DEFAULT_SIZE;
        }
        return Math.min(MAX_SIZE, Math.max(1, requested));
    }
}
