package com.krive.fashions.catalog;

import java.util.List;
import java.util.Map;

import com.krive.fashions.common.BadRequestException;

/**
 * The fixed category lists the storefront and admin already use, per department.
 * Kept in code (not the database) because the storefront filter chips are built from the same lists.
 */
public final class Catalog {

    /** "Low stock" in the admin means this many units or fewer. */
    public static final int LOW_STOCK_THRESHOLD = 5;

    private static final Map<Department, List<String>> CATEGORIES = Map.of(
            Department.WOMEN, List.of("Sarees", "Kurtis", "Salwar Suits", "Lehengas", "Indo-Western"),
            Department.MEN, List.of("Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets"));

    private Catalog() {
    }

    public static List<String> categoriesFor(Department department) {
        return CATEGORIES.get(department);
    }

    public static boolean isValid(Department department, String category) {
        return category != null && CATEGORIES.get(department).contains(category.trim());
    }

    /** Returns the canonical spelling of the category or throws a 400 listing the valid choices. */
    public static String requireValid(Department department, String category) {
        if (!isValid(department, category)) {
            throw new BadRequestException("Category '" + category + "' is not valid for " + department.label()
                    + ". Choose one of: " + String.join(", ", categoriesFor(department)) + ".");
        }
        return category.trim();
    }
}
