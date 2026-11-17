package com.krive.fashions.orders;

import java.math.BigDecimal;
import java.util.List;

/** Full order, returned on checkout and in the admin detail view. */
public record OrderResponse(
        String id,
        String status,
        Customer customer,
        List<Line> items,
        int itemCount,
        BigDecimal total,
        String createdAt) {

    public record Customer(String name, String email, String phone, String address) {
    }

    public record Line(String productId, String productName, BigDecimal unitPrice, int quantity,
                       String size, String color, BigDecimal lineTotal) {
    }
}
