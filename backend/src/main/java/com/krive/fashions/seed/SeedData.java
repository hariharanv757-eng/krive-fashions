package com.krive.fashions.seed;

import java.math.BigDecimal;
import java.util.List;

import com.krive.fashions.catalog.ProductRequest;

/**
 * The sample catalogue, taken from the storefront's hard-coded lists so the shop looks the same once it
 * reads from the API. Generated ids: women KF-001..KF-006, men KF-007..KF-012. Stock numbers are samples.
 * Note: the old admin starter data priced Mehfil Lehenga at 5,999; the storefront showed 4,999, which wins here.
 */
final class SeedData {

    private SeedData() {
    }

    private static ProductRequest women(String name, String category, int price, int stock, String image,
                                        String label, String description) {
        return new ProductRequest(name, category, BigDecimal.valueOf(price), stock, image, description, label,
                "Published", "Women");
    }

    private static ProductRequest men(String name, String category, int price, int stock, String image,
                                      String description) {
        return new ProductRequest(name, category, BigDecimal.valueOf(price), stock, image, description, null,
                "Published", "Men");
    }

    static List<ProductRequest> products() {
        return List.of(
                women("Royal Banarasi", "Sarees", 3499, 12, "/images/banarasi-saree.jpg.png", "BESTSELLER",
                        "A timeless Banarasi-inspired festive drape."),
                women("The Anarkali Edit", "Salwar Suits", 2499, 8, "/images/anarkali-suit.jpg.png", "NEW ARRIVAL",
                        "An elegant embroidered festive ensemble."),
                women("Gulabi Grace", "Kurtis", 1299, 3, "/images/gulabi-kurti.jpg.png", null,
                        "Soft blush styling for everyday elegance."),
                women("Mehfil Lehenga", "Lehengas", 4999, 2, "/images/mehfil-lehenga.jpg.png", "FESTIVE EDIT",
                        "An occasion-ready embroidered lehenga."),
                women("Sage Co-ord Set", "Indo-Western", 1899, 15, "/images/sage-coord.jpg.png", "TRENDING",
                        "A relaxed, modern co-ord in a calm sage tone."),
                women("Festive Bloom", "Salwar Suits", 2199, 6, "/images/festive-suit.jpg.png", "NEW ARRIVAL",
                        "Floral festive styling with a graceful drape."),

                men("Midnight Oversized Tee", "Oversized Tees", 999, 25, "/images/midnight-tee.jpg.jpg",
                        "A relaxed, heavyweight oversized tee in deep black."),
                men("Urban Utility Cargo", "Cargos", 1799, 18, "/images/urban-cargo.jpg.jpg",
                        "Utility cargos with a clean, modern silhouette."),
                men("Monochrome Street Shirt", "Shirts", 1499, 20, "/images/monochrome-shirt.jpg.jpg",
                        "A graphic street shirt for an everyday statement."),
                men("After Hours Hoodie", "Hoodies", 1999, 4, "/images/after-hours-hoodie.jpg.jpg",
                        "A soft, structured hoodie made for late nights."),
                men("Essential Co-ord Set", "Co-ord Sets", 2299, 9, "/images/essential-coord.jpg.jpg",
                        "A matching set that works from day to night."),
                men("Streetform Jacket", "Jackets", 2499, 7, "/images/streetform-jacket.jpg.jpg",
                        "A sharp layering jacket with a streetwear edge."));
    }
}
