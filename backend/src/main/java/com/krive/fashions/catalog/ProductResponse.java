package com.krive.fashions.catalog;

import java.math.BigDecimal;

/** What the storefront and admin receive. Optional text fields are "" (never null) like the frontend expects. */
public record ProductResponse(
        String id,
        String name,
        String category,
        String department,
        BigDecimal price,
        int stock,
        String image,
        String description,
        String label,
        String status,
        String createdAt,
        String updatedAt) {
}
