package com.krive.fashions.catalog;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    /**
     * Loads the products and locks their rows until the surrounding transaction ends, so two customers
     * buying the last unit at the same moment cannot both succeed. Ordered by id to avoid deadlocks.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids order by p.id")
    List<Product> lockAllByIdIn(@Param("ids") Collection<String> ids);

    long countByStatus(ProductStatus status);

    long countByStockLessThanEqual(int stock);

    long countByStock(int stock);

    /** Null when the table is empty. */
    @Query("select sum(p.price * p.stock) from Product p")
    BigDecimal inventoryValue();

    @Query("select new com.krive.fashions.catalog.CategoryCount(p.department, p.category, count(p)) "
            + "from Product p where p.status = :status group by p.department, p.category")
    List<CategoryCount> countByCategory(@Param("status") ProductStatus status);
}
