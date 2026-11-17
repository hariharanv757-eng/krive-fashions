package com.krive.fashions.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Boots the whole application on a random port (in-memory H2, seeded catalogue, admin login ON) and talks to
 * it over real HTTP. If this passes, the wiring (JPA, validation, security, error handling, uploads) works.
 * It only uses the JDK HTTP client, so it does not depend on any Spring test helper that may change.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:krive-smoke;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "krive.security.require-admin-login=true",
                "krive.security.admin-username=admin",
                "krive.security.admin-password=smoke-test-password",
                "krive.seed.enabled=true",
                "krive.upload.dir=${java.io.tmpdir}/krive-smoke-uploads"
        })
class ApiSmokeTest {

    private static final String ADMIN =
            "Basic " + Base64.getEncoder().encodeToString("admin:smoke-test-password".getBytes(StandardCharsets.UTF_8));

    @Value("${local.server.port}")
    private int port;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> send(String method, String path, String authorization, String json) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (authorization != null) {
            builder.header("Authorization", authorization);
        }
        if (json != null) {
            builder.header("Content-Type", "application/json");
        }
        builder.method(method, json == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(json));
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static int count(String text, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(text);
        int n = 0;
        while (matcher.find()) {
            n++;
        }
        return n;
    }

    private static String checkout(String productId, int quantity) {
        return "{\"customer\":{\"name\":\"Ananya R.\",\"email\":\"ananya@example.com\",\"phone\":\"+91 98765 43210\","
                + "\"address\":\"12 MG Road, Madurai\"},\"items\":[{\"productId\":\"" + productId
                + "\",\"quantity\":" + quantity + ",\"size\":\"M\"}]}";
    }

    @Test
    void publicCatalogueIsSeededAndFilterable() throws Exception {
        HttpResponse<String> all = send("GET", "/api/products", null, null);
        assertEquals(200, all.statusCode());
        assertEquals(12, count(all.body(), "\"id\":\"KF-\\d+\""));

        HttpResponse<String> men = send("GET", "/api/products?department=Men", null, null);
        assertEquals(6, count(men.body(), "\"id\":\"KF-\\d+\""));
        assertTrue(men.body().contains("Midnight Oversized Tee"));
        assertFalse(men.body().contains("Royal Banarasi"));

        HttpResponse<String> sarees = send("GET", "/api/products?category=Sarees", null, null);
        assertEquals(1, count(sarees.body(), "\"id\":\"KF-\\d+\""));

        assertEquals(404, send("GET", "/api/products/KF-999", null, null).statusCode());
        assertTrue(send("GET", "/api/categories", null, null).body().contains("\"department\":\"Women\""));
    }

    @Test
    void adminEndpointsNeedTheAdminLogin() throws Exception {
        HttpResponse<String> anonymous = send("GET", "/api/admin/stats", null, null);
        assertEquals(401, anonymous.statusCode());
        assertTrue(anonymous.body().contains("Admin login required"));
        assertTrue(anonymous.headers().firstValue("WWW-Authenticate").isEmpty(),
                "no WWW-Authenticate header, or browsers show their own login popup");

        String wrong = "Basic " + Base64.getEncoder().encodeToString("admin:nope".getBytes(StandardCharsets.UTF_8));
        assertEquals(401, send("GET", "/api/admin/stats", wrong, null).statusCode());

        HttpResponse<String> ok = send("GET", "/api/admin/stats", ADMIN, null);
        assertEquals(200, ok.statusCode());
        assertTrue(ok.body().contains("\"totalProducts\""));

        assertEquals(200, send("GET", "/api/auth/me", ADMIN, null).statusCode());
        assertEquals(401, send("GET", "/api/auth/me", null, null).statusCode());
        // the public catalogue stays open
        assertEquals(200, send("GET", "/api/products", null, null).statusCode());
    }

    @Test
    void checkoutReservesStockAndRefusesToOversell() throws Exception {
        // KF-004 (Mehfil Lehenga) is seeded with exactly 2 units
        HttpResponse<String> first = send("POST", "/api/orders", null, checkout("KF-004", 2));
        assertEquals(201, first.statusCode());
        assertTrue(first.body().contains("\"status\":\"Processing\""));
        assertTrue(first.body().contains("9998"), "2 x 4999 computed by the server");

        HttpResponse<String> second = send("POST", "/api/orders", null, checkout("KF-004", 1));
        assertEquals(409, second.statusCode());
        assertTrue(second.body().contains("out of stock"));

        HttpResponse<String> product = send("GET", "/api/products/KF-004", null, null);
        assertTrue(product.body().contains("\"stock\":0"));
    }

    @Test
    void cancellingAnOrderReturnsTheStock() throws Exception {
        // KF-003 (Gulabi Grace) is seeded with 3 units
        HttpResponse<String> placed = send("POST", "/api/orders", null, checkout("KF-003", 3));
        assertEquals(201, placed.statusCode());
        Matcher id = Pattern.compile("\"id\":\"(ORD-\\d+)\"").matcher(placed.body());
        assertTrue(id.find());

        assertTrue(send("GET", "/api/products/KF-003", null, null).body().contains("\"stock\":0"));

        HttpResponse<String> cancelled = send("PATCH", "/api/admin/orders/" + id.group(1) + "/status", ADMIN,
                "{\"status\":\"Cancelled\"}");
        assertEquals(200, cancelled.statusCode());
        assertTrue(send("GET", "/api/products/KF-003", null, null).body().contains("\"stock\":3"));

        HttpResponse<String> again = send("PATCH", "/api/admin/orders/" + id.group(1) + "/status", ADMIN,
                "{\"status\":\"Shipped\"}");
        assertEquals(409, again.statusCode(), "a cancelled order is final");
    }

    @Test
    void invalidRequestsGetClearMessages() throws Exception {
        HttpResponse<String> empty = send("POST", "/api/orders", null,
                "{\"customer\":{\"name\":\"A\",\"email\":\"a@example.com\",\"address\":\"x\"},\"items\":[]}");
        assertEquals(400, empty.statusCode());
        assertTrue(empty.body().contains("at least one item"));

        HttpResponse<String> badEmail = send("POST", "/api/orders", null,
                "{\"customer\":{\"name\":\"A\",\"email\":\"nope\",\"address\":\"x\"},"
                        + "\"items\":[{\"productId\":\"KF-001\",\"quantity\":1}]}");
        assertEquals(400, badEmail.statusCode());
        assertTrue(badEmail.body().contains("\"field\":\"customer.email\""));

        assertEquals(400, send("POST", "/api/orders", null, "{not json").statusCode());

        HttpResponse<String> badCategory = send("POST", "/api/admin/products", ADMIN,
                "{\"name\":\"X\",\"category\":\"Hoodies\",\"price\":10,\"stock\":1,\"department\":\"Women\"}");
        assertEquals(400, badCategory.statusCode());
        assertTrue(badCategory.body().contains("not valid for Women"));

        HttpResponse<String> dataUrl = send("POST", "/api/admin/products", ADMIN,
                "{\"name\":\"X\",\"category\":\"Sarees\",\"price\":10,\"stock\":1,\"image\":\"data:image/png;base64,AAAA\"}");
        assertEquals(400, dataUrl.statusCode());
    }

    @Test
    void adminCanCreateEditAndDeleteAProduct() throws Exception {
        HttpResponse<String> created = send("POST", "/api/admin/products", ADMIN,
                "{\"name\":\"Ivory Anarkali\",\"category\":\"Salwar Suits\",\"price\":3499,\"stock\":8,"
                        + "\"image\":\"/uploads/example.jpg\",\"description\":\"Test\",\"status\":\"Draft\"}");
        assertEquals(201, created.statusCode());
        Matcher id = Pattern.compile("\"id\":\"(KF-\\d+)\"").matcher(created.body());
        assertTrue(id.find());
        String productId = id.group(1);
        assertTrue(created.body().contains("\"status\":\"Draft\""));

        // drafts are invisible to the public
        assertEquals(404, send("GET", "/api/products/" + productId, null, null).statusCode());
        assertEquals(200, send("GET", "/api/admin/products/" + productId, ADMIN, null).statusCode());

        HttpResponse<String> updated = send("PUT", "/api/admin/products/" + productId, ADMIN,
                "{\"name\":\"Ivory Anarkali\",\"category\":\"Salwar Suits\",\"price\":3299.50,\"stock\":8,\"status\":\"Published\"}");
        assertEquals(200, updated.statusCode());
        assertTrue(updated.body().contains("3299.50"));
        assertEquals(200, send("GET", "/api/products/" + productId, null, null).statusCode());

        HttpResponse<String> stock = send("PATCH", "/api/admin/products/" + productId + "/stock", ADMIN, "{\"stock\":2}");
        assertTrue(stock.body().contains("\"stock\":2"));

        HttpResponse<String> list = send("GET", "/api/admin/products?q=ivory&size=5", ADMIN, null);
        assertTrue(list.body().contains("\"totalElements\":1"));

        assertEquals(204, send("DELETE", "/api/admin/products/" + productId, ADMIN, null).statusCode());
        assertEquals(404, send("GET", "/api/admin/products/" + productId, ADMIN, null).statusCode());
    }

    @Test
    void uploadsAcceptRealImagesAndRejectEverythingElse() throws Exception {
        byte[] png = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        HttpResponse<String> anonymous = upload(null, "pixel.png", "image/png", png);
        assertEquals(401, anonymous.statusCode());

        HttpResponse<String> stored = upload(ADMIN, "pixel.png", "image/png", png);
        assertEquals(201, stored.statusCode());
        Matcher url = Pattern.compile("\"url\":\"(/uploads/[0-9a-f-]+\\.png)\"").matcher(stored.body());
        assertTrue(url.find(), stored.body());

        HttpResponse<byte[]> served = http.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + url.group(1))).build(),
                HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, served.statusCode());
        assertEquals(png.length, served.body().length);

        // a script renamed to .png is still rejected, because the bytes are checked, not the name
        HttpResponse<String> fake = upload(ADMIN, "evil.png", "image/png",
                "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8));
        assertEquals(415, fake.statusCode());
        assertTrue(fake.body().contains("Only JPG, PNG"));
    }

    private HttpResponse<String> upload(String authorization, String filename, String contentType, byte[] content)
            throws Exception {
        String boundary = "----krive" + System.nanoTime();
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" + filename
                + "\"\r\nContent-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(content);
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/uploads"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()));
        if (authorization != null) {
            builder.header("Authorization", authorization);
        }
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }
}
