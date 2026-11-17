package com.krive.fashions.orders;

public final class OrderMapper {

    private OrderMapper() {
    }

    public static OrderResponse toResponse(ShopOrder order) {
        return new OrderResponse(
                order.getId(),
                order.getStatus().label(),
                new OrderResponse.Customer(
                        order.getCustomerName(),
                        order.getCustomerEmail(),
                        order.getCustomerPhone() == null ? "" : order.getCustomerPhone(),
                        order.getShippingAddress()),
                order.getLines().stream()
                        .map(line -> new OrderResponse.Line(
                                line.getProductId(),
                                line.getProductName(),
                                line.getUnitPrice(),
                                line.getQuantity(),
                                line.getSize() == null ? "" : line.getSize(),
                                line.getColor() == null ? "" : line.getColor(),
                                line.lineTotal()))
                        .toList(),
                order.getItemCount(),
                order.getTotal(),
                order.getCreatedAt().toString());
    }

    public static OrderSummary toSummary(ShopOrder order) {
        return new OrderSummary(
                order.getId(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getItemCount(),
                order.getTotal(),
                order.getStatus().label(),
                order.getCreatedAt().toString());
    }
}
