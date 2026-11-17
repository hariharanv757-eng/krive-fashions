package com.krive.fashions.common;

/** Names and starting values of the id counters. Orders continue after the demo ORD-1042. */
public final class Sequences {

    public static final String PRODUCT = "product";
    public static final String ORDER = "order";

    private Sequences() {
    }

    public static long initialValue(String name) {
        return ORDER.equals(name) ? 1043L : 1L;
    }
}
