package com.krive.fashions.orders;

import java.util.EnumSet;
import java.util.Set;

import com.krive.fashions.common.BadRequestException;

/**
 * Order lifecycle. Labels match the admin's Orders page (Processing / Shipped / Delivered).
 *
 * <pre>
 *   Processing ──► Shipped ──► Delivered
 *        └───────► Cancelled        (only before it ships; stock is returned)
 * </pre>
 */
public enum OrderStatus {
    PROCESSING("Processing"),
    SHIPPED("Shipped"),
    DELIVERED("Delivered"),
    CANCELLED("Cancelled");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public Set<OrderStatus> allowedNext() {
        return switch (this) {
            case PROCESSING -> EnumSet.of(SHIPPED, CANCELLED);
            case SHIPPED -> EnumSet.of(DELIVERED);
            case DELIVERED, CANCELLED -> EnumSet.noneOf(OrderStatus.class);
        };
    }

    public boolean canTransitionTo(OrderStatus next) {
        return allowedNext().contains(next);
    }

    public static OrderStatus fromLabel(String value) {
        if (value != null) {
            String wanted = value.trim();
            for (OrderStatus status : values()) {
                if (status.label.equalsIgnoreCase(wanted)) {
                    return status;
                }
            }
        }
        throw new BadRequestException("Unknown order status '" + value
                + "'. Use Processing, Shipped, Delivered or Cancelled.");
    }

    public static OrderStatus optional(String value) {
        return value == null || value.isBlank() ? null : fromLabel(value);
    }
}
