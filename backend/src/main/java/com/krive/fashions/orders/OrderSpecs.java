package com.krive.fashions.orders;

import java.util.ArrayList;
import java.util.List;

import com.krive.fashions.common.Text;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;

public final class OrderSpecs {

    private OrderSpecs() {
    }

    public static Specification<ShopOrder> matching(OrderStatus status, String query) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            String like = Text.likePattern(query);
            if (like != null) {
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("id")), like),
                        cb.like(cb.lower(root.get("customerName")), like),
                        cb.like(cb.lower(root.get("customerEmail")), like)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
