package com.krive.fashions.catalog;

/** Result row of the "published products per category" query. */
public record CategoryCount(Department department, String category, Long count) {
}
