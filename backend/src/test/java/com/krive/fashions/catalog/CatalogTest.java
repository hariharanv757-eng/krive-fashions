package com.krive.fashions.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.krive.fashions.common.BadRequestException;

import org.junit.jupiter.api.Test;

class CatalogTest {

    @Test
    void womenAndMenHaveTheCategoriesTheStorefrontShows() {
        assertEquals(5, Catalog.categoriesFor(Department.WOMEN).size());
        assertEquals(6, Catalog.categoriesFor(Department.MEN).size());
        assertTrue(Catalog.isValid(Department.WOMEN, "Sarees"));
        assertTrue(Catalog.isValid(Department.MEN, "Hoodies"));
    }

    @Test
    void categoriesDoNotCrossDepartments() {
        assertFalse(Catalog.isValid(Department.MEN, "Sarees"));
        assertFalse(Catalog.isValid(Department.WOMEN, "Hoodies"));
        assertFalse(Catalog.isValid(Department.WOMEN, null));
    }

    @Test
    void requireValidTrimsAndExplainsTheChoices() {
        assertEquals("Kurtis", Catalog.requireValid(Department.WOMEN, "  Kurtis "));
        BadRequestException error = assertThrows(BadRequestException.class,
                () -> Catalog.requireValid(Department.MEN, "Sarees"));
        assertTrue(error.getMessage().contains("not valid for Men"));
        assertTrue(error.getMessage().contains("Oversized Tees"));
    }

    @Test
    void departmentLabelsParseLeniently() {
        assertEquals(Department.WOMEN, Department.fromLabel(null));
        assertEquals(Department.WOMEN, Department.fromLabel(" "));
        assertEquals(Department.MEN, Department.fromLabel("men"));
        assertEquals(Department.MEN, Department.fromLabel("MEN"));
        assertEquals("Women", Department.WOMEN.label());
        assertThrows(BadRequestException.class, () -> Department.fromLabel("kids"));
    }

    @Test
    void statusLabelsParseLeniently() {
        assertEquals(ProductStatus.PUBLISHED, ProductStatus.fromLabel(null));
        assertEquals(ProductStatus.DRAFT, ProductStatus.fromLabel("draft"));
        assertEquals("Published", ProductStatus.PUBLISHED.label());
        assertThrows(BadRequestException.class, () -> ProductStatus.fromLabel("archived"));
    }
}
