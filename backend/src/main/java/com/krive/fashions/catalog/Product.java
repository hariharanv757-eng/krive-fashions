package com.krive.fashions.catalog;

import java.math.BigDecimal;
import java.time.Instant;

import com.krive.fashions.common.InsufficientStockException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * A catalogue item. The id is the human-readable code the admin already shows (KF-001).
 * Stock rules live here ({@link #reserve}, {@link #restock}) so they can be tested without a database.
 */
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_department_category", columnList = "department,category"),
        @Index(name = "idx_products_status", columnList = "status")
})
public class Product {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 60)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Department department;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int stock;

    @Column(length = 500)
    private String image;

    @Column(length = 2000)
    private String description;

    /** Optional ribbon text such as "BESTSELLER" or "NEW ARRIVAL". */
    @Column(length = 40)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private ProductStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected Product() {
    }

    public Product(String id, String name, String category, Department department, BigDecimal price, int stock,
                   String image, String description, String label, ProductStatus status) {
        this.id = id;
        assign(name, category, department, price, stock, image, description, label, status);
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /** Replaces every editable field (used by PUT). */
    public void apply(String name, String category, Department department, BigDecimal price, int stock,
                      String image, String description, String label, ProductStatus status) {
        assign(name, category, department, price, stock, image, description, label, status);
    }

    private void assign(String name, String category, Department department, BigDecimal price, int stock,
                        String image, String description, String label, ProductStatus status) {
        this.name = name;
        this.category = category;
        this.department = department;
        this.price = price;
        this.stock = stock;
        this.image = image;
        this.description = description;
        this.label = label;
        this.status = status;
    }

    /** Takes {@code quantity} units out of stock for an order. */
    public void reserve(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive.");
        }
        if (quantity > stock) {
            throw new InsufficientStockException(name, stock);
        }
        stock -= quantity;
    }

    /** Puts units back (cancelled order). */
    public void restock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive.");
        }
        stock += quantity;
    }

    public boolean isPublished() {
        return status == ProductStatus.PUBLISHED;
    }

    /** Fallback only: the constructor already stamps the times. */
    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public Department getDepartment() {
        return department;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getImage() {
        return image;
    }

    public String getDescription() {
        return description;
    }

    public String getLabel() {
        return label;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
