package com.krive.fashions.catalog;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public, read-only catalogue for the storefront. Draft products are never exposed here. */
@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    /** GET /api/products?department=Women&category=Sarees&q=banarasi */
    @GetMapping("/products")
    public List<ProductResponse> list(
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "q", required = false) String query) {
        return service.listPublished(department, category, query);
    }

    @GetMapping("/products/{id}")
    public ProductResponse get(@PathVariable("id") String id) {
        return service.getPublished(id);
    }

    /** Category lists with live counts, for building the filter chips. */
    @GetMapping("/categories")
    public List<DepartmentCategories> categories() {
        return service.categories();
    }
}
