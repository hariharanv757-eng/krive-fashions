package com.krive.fashions.orders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.krive.fashions.common.BadRequestException;

import org.junit.jupiter.api.Test;

class OrderStatusTest {

    @Test
    void processingCanShipOrCancel() {
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPED));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.DELIVERED));
        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.PROCESSING));
    }

    @Test
    void shippedCanOnlyBeDelivered() {
        assertTrue(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.PROCESSING));
    }

    @Test
    void deliveredAndCancelledAreFinal() {
        for (OrderStatus next : OrderStatus.values()) {
            assertFalse(OrderStatus.DELIVERED.canTransitionTo(next));
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(next));
        }
    }

    @Test
    void labelsMatchTheAdminDashboard() {
        assertEquals("Processing", OrderStatus.PROCESSING.label());
        assertEquals("Shipped", OrderStatus.SHIPPED.label());
        assertEquals("Delivered", OrderStatus.DELIVERED.label());
        assertEquals(OrderStatus.SHIPPED, OrderStatus.fromLabel("shipped"));
        assertEquals(OrderStatus.CANCELLED, OrderStatus.fromLabel(" Cancelled "));
    }

    @Test
    void unknownLabelsAreRejected() {
        assertThrows(BadRequestException.class, () -> OrderStatus.fromLabel("lost"));
        assertThrows(BadRequestException.class, () -> OrderStatus.fromLabel(null));
    }
}
