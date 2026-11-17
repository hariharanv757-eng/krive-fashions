package com.krive.fashions.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import com.krive.fashions.common.InsufficientStockException;

import org.junit.jupiter.api.Test;

class ProductTest {

    private static Product product(int stock, ProductStatus status) {
        return new Product("KF-001", "Royal Banarasi", "Sarees", Department.WOMEN,
                new BigDecimal("3499.00"), stock, "/images/x.png", "d", "BESTSELLER", status);
    }

    @Test
    void reserveTakesUnitsOutOfStock() {
        Product p = product(5, ProductStatus.PUBLISHED);
        p.reserve(2);
        assertEquals(3, p.getStock());
        p.reserve(3);
        assertEquals(0, p.getStock());
    }

    @Test
    void reservingMoreThanAvailableFailsAndChangesNothing() {
        Product p = product(2, ProductStatus.PUBLISHED);
        InsufficientStockException error = assertThrows(InsufficientStockException.class, () -> p.reserve(3));
        assertEquals("Only 2 of 'Royal Banarasi' left in stock.", error.getMessage());
        assertEquals(2, p.getStock());
    }

    @Test
    void soldOutProductsSayOutOfStock() {
        Product p = product(0, ProductStatus.PUBLISHED);
        InsufficientStockException error = assertThrows(InsufficientStockException.class, () -> p.reserve(1));
        assertEquals("'Royal Banarasi' is out of stock.", error.getMessage());
    }

    @Test
    void restockPutsUnitsBack() {
        Product p = product(1, ProductStatus.PUBLISHED);
        p.restock(4);
        assertEquals(5, p.getStock());
    }

    @Test
    void quantitiesMustBePositive() {
        Product p = product(5, ProductStatus.PUBLISHED);
        assertThrows(IllegalArgumentException.class, () -> p.reserve(0));
        assertThrows(IllegalArgumentException.class, () -> p.reserve(-1));
        assertThrows(IllegalArgumentException.class, () -> p.restock(0));
    }

    @Test
    void onlyPublishedProductsAreOnSale() {
        assertTrue(product(1, ProductStatus.PUBLISHED).isPublished());
        assertFalse(product(1, ProductStatus.DRAFT).isPublished());
    }

    @Test
    void applyReplacesEveryEditableField() {
        Product p = product(1, ProductStatus.PUBLISHED);
        p.apply("New", "Kurtis", Department.WOMEN, new BigDecimal("10.00"), 9, null, null, null, ProductStatus.DRAFT);
        assertEquals("New", p.getName());
        assertEquals("Kurtis", p.getCategory());
        assertEquals(9, p.getStock());
        assertEquals(ProductStatus.DRAFT, p.getStatus());
        assertEquals("KF-001", p.getId());
    }
}
