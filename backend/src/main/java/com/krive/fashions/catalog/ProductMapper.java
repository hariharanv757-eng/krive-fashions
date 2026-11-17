package com.krive.fashions.catalog;

public final class ProductMapper {

    private ProductMapper() {
    }

    public static ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getDepartment().label(),
                product.getPrice(),
                product.getStock(),
                orEmpty(product.getImage()),
                orEmpty(product.getDescription()),
                orEmpty(product.getLabel()),
                product.getStatus().label(),
                product.getCreatedAt() == null ? "" : product.getCreatedAt().toString(),
                product.getUpdatedAt() == null ? "" : product.getUpdatedAt().toString());
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value;
    }
}
