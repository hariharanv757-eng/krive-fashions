package com.krive.fashions.common;

/** Not enough units are available to fulfil an order line (HTTP 409). */
public class InsufficientStockException extends ConflictException {
    private static final long serialVersionUID = 1L;

    public InsufficientStockException(String productName, int available) {
        super(available <= 0
                ? "'" + productName + "' is out of stock."
                : "Only " + available + " of '" + productName + "' left in stock.");
    }
}
