package com.krive.fashions.orders;

import java.math.BigDecimal;

/** One row of the admin Orders table (same fields as the dashboard's demo orders, plus the email). */
public record OrderSummary(
        String id,
        String customer,
        String customerEmail,
        int items,
        BigDecimal total,
        String status,
        String date) {
}
