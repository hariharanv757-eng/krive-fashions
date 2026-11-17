package com.krive.fashions.catalog;

import java.util.ArrayList;
import java.util.List;

import com.krive.fashions.common.Text;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;

/** Builds the dynamic WHERE clause. Specifications (not "param is null or ..." JPQL) work on every database. */
public final class ProductSpecs {

    private ProductSpecs() {
    }

    public static Specification<Product> matching(ProductFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            if (filter.department() != null) {
                predicates.add(cb.equal(root.get("department"), filter.department()));
            }
            String category = Text.blankToNull(filter.category());
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            String like = Text.likePattern(filter.query());
            if (like != null) {
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("id")), like),
                        cb.like(cb.lower(root.get("category")), like)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
