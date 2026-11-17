package com.krive.fashions.stats;

import java.math.BigDecimal;

import com.krive.fashions.catalog.Catalog;
import com.krive.fashions.catalog.ProductRepository;
import com.krive.fashions.catalog.ProductStatus;
import com.krive.fashions.orders.OrderStatus;
import com.krive.fashions.orders.ShopOrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final ProductRepository products;
    private final ShopOrderRepository orders;

    public StatsService(ProductRepository products, ShopOrderRepository orders) {
        this.products = products;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public StatsResponse overview() {
        BigDecimal inventory = products.inventoryValue();
        BigDecimal revenue = orders.revenueExcluding(OrderStatus.CANCELLED);
        return new StatsResponse(
                products.count(),
                products.countByStatus(ProductStatus.PUBLISHED),
                products.countByStatus(ProductStatus.DRAFT),
                products.countByStockLessThanEqual(Catalog.LOW_STOCK_THRESHOLD),
                products.countByStock(0),
                inventory == null ? BigDecimal.ZERO : inventory,
                orders.count(),
                orders.countByStatus(OrderStatus.PROCESSING),
                revenue == null ? BigDecimal.ZERO : revenue);
    }
}
