package com.krive.fashions.catalog;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body of create (POST) and full update (PUT). Field names match the admin dashboard's form, so
 * {@code { name, category, price, stock, image, description, status }} works as-is.
 * {@code department} ("Women"/"Men") and {@code label} are optional extras the storefront uses.
 */
public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 120, message = "Product name must be 120 characters or fewer")
        String name,

        @NotBlank(message = "Category is required")
        @Size(max = 60, message = "Category must be 60 characters or fewer")
        String category,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        @DecimalMax(value = "10000000.00", message = "Price is too large")
        @Digits(integer = 10, fraction = 2, message = "Price can have at most 2 decimal places")
        BigDecimal price,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        @Max(value = 1000000, message = "Stock is too large")
        Integer stock,

        @Size(max = 500, message = "Image URL must be 500 characters or fewer")
        @Pattern(regexp = "^$|^(/|https?://).*",
                message = "Image must be an uploaded file URL (/uploads/...), a /images/... path or an http(s) URL")
        String image,

        @Size(max = 2000, message = "Description must be 2000 characters or fewer")
        String description,

        @Size(max = 40, message = "Label must be 40 characters or fewer")
        String label,

        @Pattern(regexp = "(?i)^(Published|Draft)?$", message = "Status must be Published or Draft")
        String status,

        @Size(max = 10, message = "Department must be Women or Men")
        String department) {
}
