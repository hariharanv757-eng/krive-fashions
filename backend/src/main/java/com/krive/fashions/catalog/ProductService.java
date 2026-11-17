package com.krive.fashions.catalog;

import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
public class ProductService {

    /** The storefront shows the whole catalogue at once; this is a safety cap, not a page size. */
    private static final int STOREFRONT_LIMIT = 500;

    private final ProductRepository products;
    private final SequenceService sequences;

    public ProductService(ProductRepository products, SequenceService sequences) {
        this.products = products;
        this.sequences = sequences;
    }

    /* ---------- storefront (published only) ---------- */

    @Transactional(readOnly = true)
    public List<ProductResponse> listPublished(String department, String category, String query) {
        ProductFilter filter = new ProductFilter(
                ProductStatus.PUBLISHED, Department.optional(department), category, query);
        return products
                .findAll(ProductSpecs.matching(filter), PageRequest.of(0, STOREFRONT_LIMIT, Sort.by("id").ascending()))
                .map(ProductMapper::toResponse)
                .getContent();
    }

    @Transactional(readOnly = true)
    public ProductResponse getPublished(String id) {
        Product product = find(id);
        if (!product.isPublished()) {
            throw new NotFoundException("Product " + id + " was not found.");
        }
        return ProductMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<DepartmentCategories> categories() {
        Map<String, Long> counts = new HashMap<>();
        for (CategoryCount row : products.countByCategory(ProductStatus.PUBLISHED)) {
            counts.put(row.department().name() + "|" + row.category(), row.count());
        }
        return java.util.Arrays.stream(Department.values())
                .map(department -> new DepartmentCategories(
                        department.label(),
                        Catalog.categoriesFor(department).stream()
                                .map(name -> new DepartmentCategories.CategoryEntry(
                                        name, counts.getOrDefault(department.name() + "|" + name, 0L)))
                                .toList()))
                .toList();
    }

    /* ---------- admin ---------- */

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String query, String status, String department, String category,
                                                String sort, Integer page, Integer size) {
        ProductFilter filter = new ProductFilter(
                ProductStatus.optional(status), Department.optional(department), category, query);
        PageRequest pageRequest = PageRequest.of(Paging.page(page), Paging.size(size), sortFor(sort));
        return PageResponse.of(products.findAll(ProductSpecs.matching(filter), pageRequest), ProductMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse get(String id) {
        return ProductMapper.toResponse(find(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Department department = Department.fromLabel(request.department());
        String category = Catalog.requireValid(department, request.category());
        String id = IdFormats.product(sequences.next(Sequences.PRODUCT));

        Product product = new Product(
                id,
                request.name().trim(),
                category,
                department,
                request.price().setScale(2, RoundingMode.HALF_UP),
                request.stock(),
                Text.blankToNull(request.image()),
                Text.blankToNull(request.description()),
                Text.blankToNull(request.label()),
                ProductStatus.fromLabel(request.status()));
        return ProductMapper.toResponse(products.save(product));
    }

    @Transactional
    public ProductResponse update(String id, ProductRequest request) {
        Product product = find(id);
        Department department = request.department() == null
                ? product.getDepartment()
                : Department.fromLabel(request.department());
        String category = Catalog.requireValid(department, request.category());

        product.apply(
                request.name().trim(),
                category,
                department,
                request.price().setScale(2, RoundingMode.HALF_UP),
                request.stock(),
                Text.blankToNull(request.image()),
                Text.blankToNull(request.description()),
                Text.blankToNull(request.label()),
                request.status() == null ? product.getStatus() : ProductStatus.fromLabel(request.status()));
        return ProductMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse setStock(String id, int stock) {
        Product product = find(id);
        product.setStock(stock);
        return ProductMapper.toResponse(product);
    }

    @Transactional
    public void delete(String id) {
        if (!products.existsById(id)) {
            throw new NotFoundException("Product " + id + " was not found.");
        }
        products.deleteById(id);
    }

    /* ---------- helpers ---------- */

    private Product find(String id) {
        return products.findById(id)
                .orElseThrow(() -> new NotFoundException("Product " + id + " was not found."));
    }

    /** Whitelisted sort keys, so clients can never sort by an arbitrary column. */
    static Sort sortFor(String key) {
        String normalised = key == null ? "newest" : key.trim().toLowerCase();
        return switch (normalised) {
            case "oldest" -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));
            case "name" -> Sort.by(Sort.Order.asc("name"), Sort.Order.asc("id"));
            case "price-asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"));
            case "price-desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id"));
            case "stock-asc" -> Sort.by(Sort.Order.asc("stock"), Sort.Order.asc("id"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
    }
}
