package com.krive.fashions.orders;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Checkout payload. Note what is NOT here: prices and totals. The server looks those up, so a
 * customer cannot buy something for the wrong price by editing the request.
 */
public record PlaceOrderRequest(
        @NotNull(message = "Customer details are required")
        @Valid
        Customer customer,

        @NotEmpty(message = "An order needs at least one item")
        @Size(max = 30, message = "An order can have at most 30 different items")
        List<@Valid Item> items) {

    public record Customer(
            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name must be 100 characters or fewer")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Email address is not valid")
            @Size(max = 160, message = "Email must be 160 characters or fewer")
            String email,

            @Pattern(regexp = "^$|^[0-9+()\\- ]{7,20}$", message = "Phone number is not valid")
            String phone,

            @NotBlank(message = "Shipping address is required")
            @Size(max = 500, message = "Address must be 500 characters or fewer")
            String address) {
    }

    public record Item(
            @NotBlank(message = "Product id is required")
            @Size(max = 20, message = "Product id is not valid")
            String productId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 10, message = "You can order at most 10 of the same item at once")
            Integer quantity,

            @Size(max = 20, message = "Size must be 20 characters or fewer")
            String size,

            @Size(max = 30, message = "Colour must be 30 characters or fewer")
            String color) {
    }
}
