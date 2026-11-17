package com.krive.fashions.catalog;

import java.net.URI;

import com.krive.fashions.common.PageResponse;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Product management for the admin dashboard (requires the ADMIN login when enabled). */
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService service;

    public AdminProductController(ProductService service) {
        this.service = service;
    }

    /**
     * GET /api/admin/products?q=&status=Published&department=Women&category=Sarees&sort=newest&page=0&size=20
     * sort: newest (default) | oldest | name | price-asc | price-desc | stock-asc
     */
    @GetMapping
    public PageResponse<ProductResponse> search(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size) {
        return service.search(query, status, department, category, sort, page, size);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable("id") String id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/admin/products/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable("id") String id, @Valid @RequestBody ProductRequest request) {
        return service.update(id, request);
    }

    /** Quick inventory edit without resending the whole product. */
    @PatchMapping("/{id}/stock")
    public ProductResponse setStock(@PathVariable("id") String id, @Valid @RequestBody StockRequest request) {
        return service.setStock(id, request.stock());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
