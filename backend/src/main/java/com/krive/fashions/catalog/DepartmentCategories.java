package com.krive.fashions.catalog;

import java.util.List;

/** One storefront section with its categories and how many published products each holds. */
public record DepartmentCategories(String department, List<CategoryEntry> categories) {

    public record CategoryEntry(String name, long count) {
    }
}
