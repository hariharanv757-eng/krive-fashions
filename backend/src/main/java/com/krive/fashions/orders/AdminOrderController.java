package com.krive.fashions.orders;

import com.krive.fashions.common.PageResponse;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService service;

    public AdminOrderController(OrderService service) {
        this.service = service;
    }

    /** GET /api/admin/orders?status=Processing&q=ananya&page=0&size=20 (newest first) */
    @GetMapping
    public PageResponse<OrderSummary> search(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false) Integer size) {
        return service.search(status, query, page, size);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable("id") String id) {
        return service.get(id);
    }

    /** PATCH body: { "status": "Shipped" } */
    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable("id") String id, @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(id, request.status());
    }
}
