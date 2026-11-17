package com.krive.fashions.orders;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.krive.fashions.catalog.Product;
import com.krive.fashions.common.BadRequestException;
import com.krive.fashions.common.ConflictException;
import com.krive.fashions.common.InsufficientStockException;

/**
 * The business rules of buying, as plain Java with no framework or database.
 *
 * <ul>
 *   <li>The server decides prices: each line snapshots the product's current price.</li>
 *   <li>Identical product + size + colour lines are merged.</li>
 *   <li>Stock is validated for the whole basket first, then reserved, so a failure leaves nothing half-done.</li>
 *   <li>Draft or unknown products cannot be bought.</li>
 * </ul>
 */
public final class OrderPlanner {

    public static final int MAX_LINES = 30;
    public static final int MAX_QUANTITY_PER_LINE = 10;

    private OrderPlanner() {
    }

    /** What the customer asked for (already trimmed / null-cleaned). */
    public record Requested(String productId, int quantity, String size, String color) {
    }

    /**
     * @param products the (row-locked) products involved, keyed by id
     * @return the order lines; stock has been reserved on the given products
     */
    public static List<OrderLine> plan(List<Requested> wanted, Map<String, Product> products) {
        if (wanted == null || wanted.isEmpty()) {
            throw new BadRequestException("An order needs at least one item.");
        }

        Map<String, Requested> merged = new LinkedHashMap<>();
        for (Requested item : wanted) {
            if (item.quantity() < 1) {
                throw new BadRequestException("Quantity must be at least 1.");
            }
            String key = item.productId() + "|" + nullToEmpty(item.size()) + "|" + nullToEmpty(item.color());
            merged.merge(key, item, (a, b) ->
                    new Requested(a.productId(), a.quantity() + b.quantity(), a.size(), a.color()));
        }
        if (merged.size() > MAX_LINES) {
            throw new BadRequestException("An order can have at most " + MAX_LINES + " different items.");
        }

        // 1) validate everything, totalling the quantity wanted per product across sizes/colours
        Map<String, Integer> perProduct = new LinkedHashMap<>();
        for (Requested item : merged.values()) {
            if (item.quantity() > MAX_QUANTITY_PER_LINE) {
                throw new BadRequestException("You can order at most " + MAX_QUANTITY_PER_LINE
                        + " of the same item at once.");
            }
            Product product = products.get(item.productId());
            if (product == null) {
                throw new BadRequestException("Unknown product '" + item.productId() + "'.");
            }
            if (!product.isPublished()) {
                throw new ConflictException("'" + product.getName() + "' is no longer available.");
            }
            perProduct.merge(item.productId(), item.quantity(), Integer::sum);
        }
        for (Map.Entry<String, Integer> entry : perProduct.entrySet()) {
            Product product = products.get(entry.getKey());
            if (entry.getValue() > product.getStock()) {
                throw new InsufficientStockException(product.getName(), product.getStock());
            }
        }

        // 2) only now change anything
        for (Map.Entry<String, Integer> entry : perProduct.entrySet()) {
            products.get(entry.getKey()).reserve(entry.getValue());
        }
        List<OrderLine> lines = new ArrayList<>();
        for (Requested item : merged.values()) {
            Product product = products.get(item.productId());
            lines.add(new OrderLine(product.getId(), product.getName(), product.getPrice(),
                    item.quantity(), item.size(), item.color()));
        }
        return lines;
    }

    /** Returns the stock of a cancelled order. Products that were deleted since are skipped. */
    public static void release(List<OrderLine> lines, Map<String, Product> products) {
        for (OrderLine line : lines) {
            Product product = products.get(line.getProductId());
            if (product != null) {
                product.restock(line.getQuantity());
            }
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
