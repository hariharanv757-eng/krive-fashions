package com.krive.fashions.config;

import com.krive.fashions.uploads.UploadStorage;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serves uploaded images at /uploads/**. Names are random UUIDs, so they can be cached for a long time. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final int THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

    private final UploadStorage storage;

    public WebConfig(UploadStorage storage) {
        this.storage = storage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(storage.root().toUri().toString())
                .setCachePeriod(THIRTY_DAYS_IN_SECONDS);
    }
}
