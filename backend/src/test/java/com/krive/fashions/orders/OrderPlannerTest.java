package com.krive.fashions.orders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.krive.fashions.catalog.Department;
import com.krive.fashions.catalog.Product;
import com.krive.fashions.catalog.ProductStatus;
import com.krive.fashions.common.BadRequestException;
import com.krive.fashions.common.ConflictException;
import com.krive.fashions.common.InsufficientStockException;
import com.krive.fashions.orders.OrderPlanner.Requested;

import org.junit.jupiter.api.Test;

class OrderPlannerTest {

    private static Product product(String id, String name, String price, int stock, ProductStatus status) {
        return new Product(id, name, "Sarees", Department.WOMEN, new BigDecimal(price), stock, null, null, null, status);
    }

    private static Map<String, Product> catalogue(Product... products) {
        Map<String, Product> map = new HashMap<>();
        for (Product p : products) {
            map.put(p.getId(), p);
        }
        return map;
    }

    private static Requested want(String id, int qty) {
        return new Requested(id, qty, null, null);
    }

    @Test
    void reservesStockAndSnapshotsTheServerPrice() {
        Product saree = product("KF-001", "Royal Banarasi", "3499.00", 12, ProductStatus.PUBLISHED);
        List<OrderLine> lines = OrderPlanner.plan(List.of(want("KF-001", 2)), catalogue(saree));

        assertEquals(1, lines.size());
        assertEquals(new BigDecimal("3499.00"), lines.get(0).getUnitPrice());
        assertEquals("Royal Banarasi", lines.get(0).getProductName());
        assertEquals(2, lines.get(0).getQuantity());
        assertEquals(10, saree.getStock());
    }

    @Test
    void identicalLinesAreMerged() {
        Product saree = product("KF-001", "Royal Banarasi", "3499.00", 12, ProductStatus.PUBLISHED);
        List<OrderLine> lines = OrderPlanner.plan(
                List.of(new Requested("KF-001", 1, "M", "Red"), new Requested("KF-001", 2, "M", "Red")),
                catalogue(saree));
        assertEquals(1, lines.size());
        assertEquals(3, lines.get(0).getQuantity());
        assertEquals(9, saree.getStock());
    }

    @Test
    void differentSizesStayAsSeparateLinesButShareOneStockPool() {
        Product saree = product("KF-001", "Royal Banarasi", "3499.00", 5, ProductStatus.PUBLISHED);
        List<OrderLine> lines = OrderPlanner.plan(
                List.of(new Requested("KF-001", 2, "M", null), new Requested("KF-001", 3, "L", null)),
                catalogue(saree));
        assertEquals(2, lines.size());
        assertEquals(0, saree.getStock());

        Product other = product("KF-002", "Other", "100.00", 4, ProductStatus.PUBLISHED);
        assertThrows(InsufficientStockException.class, () -> OrderPlanner.plan(
                List.of(new Requested("KF-002", 3, "M", null), new Requested("KF-002", 3, "L", null)),
                catalogue(other)));
        assertEquals(4, other.getStock());
    }

    @Test
    void notEnoughStockIsRejectedWithAFriendlyMessage() {
        Product lehenga = product("KF-004", "Mehfil Lehenga", "4999.00", 2, ProductStatus.PUBLISHED);
        InsufficientStockException error = assertThrows(InsufficientStockException.class,
                () -> OrderPlanner.plan(List.of(want("KF-004", 3)), catalogue(lehenga)));
        assertEquals("Only 2 of 'Mehfil Lehenga' left in stock.", error.getMessage());
        assertEquals(2, lehenga.getStock());
    }

    @Test
    void aFailureOnOneProductLeavesEveryOtherProductUntouched() {
        Product plenty = product("KF-001", "Plenty", "10.00", 10, ProductStatus.PUBLISHED);
        Product scarce = product("KF-002", "Scarce", "10.00", 1, ProductStatus.PUBLISHED);
        assertThrows(InsufficientStockException.class, () -> OrderPlanner.plan(
                List.of(want("KF-001", 4), want("KF-002", 2)), catalogue(plenty, scarce)));
        assertEquals(10, plenty.getStock(), "nothing may be reserved when any line fails");
        assertEquals(1, scarce.getStock());
    }

    @Test
    void unknownProductsAreABadRequest() {
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(List.of(want("KF-999", 1)), catalogue()));
    }

    @Test
    void draftProductsCannotBeBought() {
        Product draft = product("KF-001", "Hidden", "10.00", 5, ProductStatus.DRAFT);
        ConflictException error = assertThrows(ConflictException.class,
                () -> OrderPlanner.plan(List.of(want("KF-001", 1)), catalogue(draft)));
        assertTrue(error.getMessage().contains("no longer available"));
        assertEquals(5, draft.getStock());
    }

    @Test
    void emptyOrdersAndBadQuantitiesAreRejected() {
        Product saree = product("KF-001", "Royal Banarasi", "3499.00", 50, ProductStatus.PUBLISHED);
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(List.of(), catalogue(saree)));
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(null, catalogue(saree)));
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(List.of(want("KF-001", 0)), catalogue(saree)));
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(
                List.of(want("KF-001", OrderPlanner.MAX_QUANTITY_PER_LINE + 1)), catalogue(saree)));
        assertEquals(50, saree.getStock());
    }

    @Test
    void tooManyDifferentLinesAreRejected() {
        Product saree = product("KF-001", "Royal Banarasi", "1.00", 1000, ProductStatus.PUBLISHED);
        List<Requested> many = new ArrayList<>();
        for (int i = 0; i <= OrderPlanner.MAX_LINES; i++) {
            many.add(new Requested("KF-001", 1, "S" + i, null));
        }
        assertThrows(BadRequestException.class, () -> OrderPlanner.plan(many, catalogue(saree)));
    }

    @Test
    void releaseReturnsStockAndSkipsDeletedProducts() {
        Product saree = product("KF-001", "Royal Banarasi", "3499.00", 12, ProductStatus.PUBLISHED);
        List<OrderLine> lines = OrderPlanner.plan(List.of(want("KF-001", 4)), catalogue(saree));
        assertEquals(8, saree.getStock());

        List<OrderLine> withDeleted = new ArrayList<>(lines);
        withDeleted.add(new OrderLine("KF-777", "Gone", new BigDecimal("1.00"), 2, null, null));
        OrderPlanner.release(withDeleted, catalogue(saree));
        assertEquals(12, saree.getStock());
    }

    @Test
    void orderTotalsAreComputedFromTheLinesNotTheClient() {
        Product kurti = product("KF-003", "Gulabi Grace", "1299.00", 10, ProductStatus.PUBLISHED);
        Product lehenga = product("KF-004", "Mehfil Lehenga", "4999.00", 10, ProductStatus.PUBLISHED);
        List<OrderLine> lines = OrderPlanner.plan(List.of(want("KF-003", 2), want("KF-004", 1)),
                catalogue(kurti, lehenga));

        ShopOrder order = ShopOrder.place("ORD-1043", "Ananya", "a@example.com", null, "12 MG Road", lines);
        assertEquals(new BigDecimal("7597.00"), order.getTotal());
        assertEquals(3, order.getItemCount());
        assertEquals(OrderStatus.PROCESSING, order.getStatus());
        assertEquals(2, order.getLines().size());
    }
}
