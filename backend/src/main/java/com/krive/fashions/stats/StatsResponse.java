package com.krive.fashions.stats;

import java.math.BigDecimal;

/** Everything the admin Overview and Inventory cards show, in one request. */
public record StatsResponse(
        long totalProducts,
        long publishedProducts,
        long draftProducts,
        long lowStockProducts,
        long outOfStockProducts,
        BigDecimal inventoryValue,
        long totalOrders,
        long processingOrders,
        BigDecimal revenue) {
}
