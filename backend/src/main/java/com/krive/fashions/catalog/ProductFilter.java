package com.krive.fashions.catalog;

/** Optional search criteria; any null field is ignored. */
public record ProductFilter(ProductStatus status, Department department, String category, String query) {
}
