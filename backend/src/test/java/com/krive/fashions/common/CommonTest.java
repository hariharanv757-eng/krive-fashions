package com.krive.fashions.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class CommonTest {

    @Test
    void productIdsArePaddedToThreeDigits() {
        assertEquals("KF-001", IdFormats.product(1));
        assertEquals("KF-012", IdFormats.product(12));
        assertEquals("KF-123", IdFormats.product(123));
        assertEquals("KF-1234", IdFormats.product(1234));
    }

    @Test
    void orderIdsContinueAfterTheDemoOrders() {
        assertEquals("ORD-1043", IdFormats.order(Sequences.initialValue(Sequences.ORDER)));
        assertEquals(1L, Sequences.initialValue(Sequences.PRODUCT));
    }

    @Test
    void pagingIsClampedNotRejected() {
        assertEquals(0, Paging.page(null));
        assertEquals(0, Paging.page(-5));
        assertEquals(3, Paging.page(3));
        assertEquals(Paging.DEFAULT_SIZE, Paging.size(null));
        assertEquals(1, Paging.size(0));
        assertEquals(1, Paging.size(-10));
        assertEquals(50, Paging.size(50));
        assertEquals(Paging.MAX_SIZE, Paging.size(100000));
    }

    @Test
    void blankTextBecomesNull() {
        assertNull(Text.blankToNull(null));
        assertNull(Text.blankToNull("   "));
        assertEquals("hi", Text.blankToNull("  hi "));
    }

    @Test
    void searchPatternIsLowerCasedAndWrapped() {
        assertNull(Text.likePattern(null));
        assertNull(Text.likePattern("  "));
        assertEquals("%banarasi%", Text.likePattern(" BanaRasi "));
    }

    @Test
    void insufficientStockMessagesAreFriendly() {
        assertEquals("Only 2 of 'Mehfil Lehenga' left in stock.",
                new InsufficientStockException("Mehfil Lehenga", 2).getMessage());
        assertEquals("'Mehfil Lehenga' is out of stock.",
                new InsufficientStockException("Mehfil Lehenga", 0).getMessage());
    }
}
