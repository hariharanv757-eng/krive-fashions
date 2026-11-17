package com.krive.fashions.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * A customer order. Named ShopOrder because ORDER is a reserved word in SQL and JPQL.
 * Totals are computed here from the line snapshots, never taken from the client.
 */
@Entity(name = "ShopOrder")
@Table(name = "orders", indexes = @Index(name = "idx_orders_status", columnList = "status"))
public class ShopOrder {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 160)
    private String customerEmail;

    @Column(length = 30)
    private String customerPhone;

    @Column(nullable = false, length = 500)
    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private OrderStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private int itemCount;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    private List<OrderLine> lines = new ArrayList<>();

    @Version
    private Long version;

    protected ShopOrder() {
    }

    /** Builds a new Processing order and computes its totals from the lines. */
    public static ShopOrder place(String id, String customerName, String customerEmail, String customerPhone,
                                  String shippingAddress, List<OrderLine> lines) {
        ShopOrder order = new ShopOrder();
        order.id = id;
        order.customerName = customerName;
        order.customerEmail = customerEmail;
        order.customerPhone = customerPhone;
        order.shippingAddress = shippingAddress;
        order.status = OrderStatus.PROCESSING;
        order.createdAt = Instant.now();
        order.updatedAt = order.createdAt;

        BigDecimal total = BigDecimal.ZERO;
        int count = 0;
        for (OrderLine line : lines) {
            line.attachTo(order);
            order.lines.add(line);
            total = total.add(line.lineTotal());
            count += line.getQuantity();
        }
        order.total = total;
        order.itemCount = count;
        return order;
    }

    /** Fallback only: {@link #place} already stamps the times. */
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

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public int getItemCount() {
        return itemCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<OrderLine> getLines() {
        return lines;
    }
}
