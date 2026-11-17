package com.krive.fashions.orders;

import java.math.BigDecimal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, String>, JpaSpecificationExecutor<ShopOrder> {

    long countByStatus(OrderStatus status);

    /** Total of all orders except the given status (cancelled). Null when there are no orders. */
    @Query("select sum(o.total) from ShopOrder o where o.status <> :excluded")
    BigDecimal revenueExcluding(@Param("excluded") OrderStatus excluded);
}
