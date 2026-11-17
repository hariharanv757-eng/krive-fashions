package com.krive.fashions.seed;

import com.krive.fashions.catalog.ProductRepository;
import com.krive.fashions.catalog.ProductRequest;
import com.krive.fashions.catalog.ProductService;
import com.krive.fashions.common.SequenceService;
import com.krive.fashions.common.Sequences;
import com.krive.fashions.config.AppProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Runs once at startup: makes sure the id counters exist and, if enabled and the catalogue is empty,
 * loads the sample products. It never touches a database that already has products.
 */
@Component
public class CatalogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogSeeder.class);

    private final AppProperties properties;
    private final ProductRepository products;
    private final ProductService service;
    private final SequenceService sequences;

    public CatalogSeeder(AppProperties properties, ProductRepository products, ProductService service,
                         SequenceService sequences) {
        this.properties = properties;
        this.products = products;
        this.service = service;
        this.sequences = sequences;
    }

    @Override
    public void run(ApplicationArguments args) {
        sequences.ensure(Sequences.PRODUCT);
        sequences.ensure(Sequences.ORDER);

        if (!properties.seed().enabled() || products.count() > 0) {
            return;
        }
        for (ProductRequest request : SeedData.products()) {
            service.create(request);
        }
        log.info("Seeded {} sample products.", SeedData.products().size());
    }
}
