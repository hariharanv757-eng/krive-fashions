package com.krive.fashions.orders;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.krive.fashions.catalog.Product;
import com.krive.fashions.catalog.ProductRepository;
import com.krive.fashions.common.ConflictException;
import com.krive.fashions.common.IdFormats;
import com.krive.fashions.common.NotFoundException;
import com.krive.fashions.common.PageResponse;
import com.krive.fashions.common.Paging;
import com.krive.fashions.common.SequenceService;
import com.krive.fashions.common.Sequences;
import com.krive.fashions.common.Text;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final ShopOrderRepository orders;
    private final ProductRepository products;
    private final SequenceService sequences;

    public OrderService(ShopOrderRepository orders, ProductRepository products, SequenceService sequences) {
        this.orders = orders;
        this.products = products;
        this.sequences = sequences;
    }

    /**
     * Places an order atomically: lock the products, check and reserve stock, snapshot prices, save.
     * Any failure rolls the whole transaction back, so stock is never left half-reserved.
     */
    @Transactional
    public OrderResponse place(PlaceOrderRequest request) {
        List<OrderPlanner.Requested> wanted = request.items().stream()
                .map(item -> new OrderPlanner.Requested(
                        item.productId().trim(),
                        item.quantity(),
                        Text.blankToNull(item.size()),
                        Text.blankToNull(item.color())))
                .toList();

        Map<String, Product> locked = lockProducts(wanted.stream().map(OrderPlanner.Requested::productId).toList());
        List<OrderLine> lines = OrderPlanner.plan(wanted, locked);

        PlaceOrderRequest.Customer customer = request.customer();
        ShopOrder order = ShopOrder.place(
                IdFormats.order(sequences.next(Sequences.ORDER)),
                customer.name().trim(),
                customer.email().trim().toLowerCase(),
                Text.blankToNull(customer.phone()),
                customer.address().trim(),
                lines);
        return OrderMapper.toResponse(orders.save(order));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummary> search(String status, String query, Integer page, Integer size) {
        PageRequest pageRequest = PageRequest.of(Paging.page(page), Paging.size(size),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return PageResponse.of(
                orders.findAll(OrderSpecs.matching(OrderStatus.optional(status), query), pageRequest),
                OrderMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderResponse get(String id) {
        return OrderMapper.toResponse(find(id));
    }

    /** Moves an order along its lifecycle. Cancelling returns the reserved stock. */
    @Transactional
    public OrderResponse updateStatus(String id, String statusLabel) {
        ShopOrder order = find(id);
        OrderStatus next = OrderStatus.fromLabel(statusLabel);

        if (!order.getStatus().canTransitionTo(next)) {
            String allowed = order.getStatus().allowedNext().isEmpty()
                    ? "none (the order is final)"
                    : order.getStatus().allowedNext().stream().map(OrderStatus::label)
                            .collect(Collectors.joining(", "));
            throw new ConflictException("Order " + id + " cannot move from " + order.getStatus().label()
                    + " to " + next.label() + ". Allowed next: " + allowed + ".");
        }

        if (next == OrderStatus.CANCELLED) {
            Map<String, Product> locked = lockProducts(
                    order.getLines().stream().map(OrderLine::getProductId).toList());
            OrderPlanner.release(order.getLines(), locked);
        }
        order.setStatus(next);
        return OrderMapper.toResponse(order);
    }

    /** Locks the rows in a stable (sorted) order so concurrent orders cannot deadlock each other. */
    private Map<String, Product> lockProducts(List<String> ids) {
        List<String> sorted = ids.stream().distinct().sorted().toList();
        Map<String, Product> byId = new HashMap<>();
        for (Product product : products.lockAllByIdIn(sorted)) {
            byId.put(product.getId(), product);
        }
        return byId;
    }

    private ShopOrder find(String id) {
        return orders.findById(id).orElseThrow(() -> new NotFoundException("Order " + id + " was not found."));
    }
}
