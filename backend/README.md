# KRIVE FASHIONS API

Spring Boot **4.1** · Java 21 · JPA · Spring Security · H2 (dev) / PostgreSQL (prod).
It gives the storefront a real catalogue, checkout with stock control, an admin API, and the image-upload
endpoint used by the 3D uploader.

```
backend/
├─ src/main/java/com/krive/fashions/
│  ├─ catalog/   products, categories, search          ├─ uploads/  image storage + type detection
│  ├─ orders/    checkout, stock, order lifecycle      ├─ stats/    admin overview numbers
│  ├─ auth/      login check                           ├─ seed/     the 12 sample products
│  ├─ config/    security, CORS, errors, properties    └─ common/   ids, paging, exceptions
├─ src/test/…    unit tests + one end-to-end smoke test
├─ api.http      every endpoint, ready to run          ├─ Dockerfile, docker-compose.yml
```

## Run it (development)

```bash
cd backend
mvn spring-boot:run          # http://localhost:8080  (Java 21 + Maven needed)
```
Then, in the project root, `npm run dev`. The Vite dev server already proxies `/api` and `/uploads` to port 8080,
so the admin's **3D uploader works immediately**: pick an image in *Add product* and it is stored in `backend/uploads/`.

First start seeds the 12 products your storefront shows (ids `KF-001`…`KF-012`) into a file database in `backend/data/`.
Delete that folder to start fresh.

> **Dev profile = open admin API.** So the existing dashboard (which has no login screen) works unchanged.
> The server prints a warning at startup. Never expose the dev profile to a network. See *Going to production*.

## Endpoints

| Who | Method & path | What |
|---|---|---|
| public | `GET /api/products?department=&category=&q=` | published products (array) |
| public | `GET /api/products/{id}` | one published product (drafts → 404) |
| public | `GET /api/categories` | categories per department with live counts |
| public | `POST /api/orders` | checkout → `201`; server prices, reserves stock |
| public | `GET /uploads/{file}` | uploaded images |
| admin | `GET /api/admin/products?q=&status=&department=&category=&sort=&page=&size=` | paged list. `sort`: newest, oldest, name, price-asc, price-desc, stock-asc |
| admin | `GET/POST/PUT/DELETE /api/admin/products[/{id}]` | manage products |
| admin | `PATCH /api/admin/products/{id}/stock` | quick stock edit |
| admin | `GET /api/admin/orders?status=&q=&page=&size=` · `GET /api/admin/orders/{id}` | orders, newest first |
| admin | `PATCH /api/admin/orders/{id}/status` | `Shipped` / `Delivered` / `Cancelled` |
| admin | `GET /api/admin/stats` | the numbers for the Overview cards |
| admin | `POST /api/uploads` (multipart `file`) · `DELETE /api/uploads/{name}` | image upload / delete |
| admin | `GET /api/auth/me` | login check |
| ops | `GET /actuator/health` | liveness |

Product JSON matches the admin form: `id, name, category, department, price, stock, image, description, label, status, createdAt, updatedAt`.
Errors are always `{ timestamp, status, error, message, path, fieldErrors[] }`; show `message` directly.

## How checkout protects you

* **Prices come from the server.** The request carries product ids and quantities only. A customer cannot edit the price.
* **No overselling.** Product rows are locked (`SELECT … FOR UPDATE`, sorted to avoid deadlocks) while stock is checked and reserved, in one transaction. Two people buying the last unit cannot both succeed; any failure rolls everything back.
* **History is stable.** Each order line snapshots the name and price at purchase time. Later price edits or product deletion never change past orders.
* **Lifecycle:** `Processing → Shipped → Delivered`, or `Processing → Cancelled`. Cancelling returns the stock exactly once. Final states cannot change.

## Uploads

Files are stored under random UUID names (the client's name is never used), the type is verified from the file's **bytes** (JPG/PNG/GIF/WEBP/AVIF; SVG is refused because it can carry scripts), and size is capped at 8 MB. Product `image` fields accept only `/…` paths or `http(s)://` URLs, never `data:` URLs.

## Going to production

1. Use the `prod` profile (`SPRING_PROFILES_ACTIVE=prod`, already set in the Docker image). It **requires** the admin login and **refuses to start** without a strong `KRIVE_ADMIN_PASSWORD`.
2. `docker compose up --build` (after `cp .env.example .env` and filling it in) starts PostgreSQL + the API. Or run the jar yourself with the variables below.
3. Serve the API over **HTTPS** (a reverse proxy such as Caddy/nginx). Admin login is HTTP Basic, which is only safe over TLS.
4. The admin dashboard needs a login screen that sends `Authorization: Basic …` on `/api/admin/**` and `/api/uploads` calls. (Today's dashboard has none, which is why the dev profile is open.)

| Variable | Meaning |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection (prod) |
| `KRIVE_ADMIN_USER`, `KRIVE_ADMIN_PASSWORD` | the single admin account |
| `KRIVE_CORS_ORIGINS` | storefront origin(s), comma separated |
| `KRIVE_UPLOAD_DIR` | where images are stored (mount a volume) |
| `KRIVE_SEED_CATALOG` | `true` to load the sample products on first start |

## Tests: what is verified, honestly

`mvn test` runs:
* **Unit tests** (stock rules, order planning, totals, status lifecycle, image detection, ids, paging, categories). 41 tests.
* **`ApiSmokeTest`**, which boots the whole app on a random port and drives it over HTTP: seeded catalogue, filters, 401 without login, checkout and oversell refusal, cancel-restocks, validation messages, product CRUD, real image upload and serving, rejection of a script renamed `.png`.

**Verification status of this code:** it was written in an environment with no Maven, no network and no Spring jars.
* ✅ Every file compiles with the real Java 21 compiler against stand-ins for the Spring/JPA/validation APIs.
* ✅ The 41 unit tests, plus 18 service-level checks using in-memory repositories (id sequences, checkout, cancel/restock, stats = the dashboard's ₹77,875, seeding), were actually executed and pass.
* ✅ Validation regexes and the seed data (compared field by field to the storefront source) were checked.
* ❌ **Not executed:** the real Spring context, Hibernate/JPQL against a database, Spring Security, and `ApiSmokeTest`. **Run `mvn test` first.** If something in the framework wiring is off, that single command will show it. The most likely places are JPQL syntax and a Spring Boot 4 starter or annotation name.

## Design notes and known limits

* **Boot 4.1** was chosen because 3.5 reached end of life on 2026-06-30. Bump `pom.xml` to the latest 4.1.x patch.
* **Schema:** Hibernate `ddl-auto=update` creates and extends tables. For a long-lived production database add Flyway migrations and switch to `validate`.
* **Auth:** one admin account, HTTP Basic, stateless (so CSRF protection is deliberately off). For several staff accounts or token logins, replace the in-memory user with a database user store / JWT.
* **No rate limiting, payments, emails or order lookup for customers.** Checkout records the order; `Checkout will be added in Phase 3` on the storefront is still true.
* Product categories are fixed lists in `Catalog.java` (the same ones the storefront filter chips use).
* Uploaded files live on local disk. Behind several servers, use shared storage or S3.
* Deleting a product keeps its images and its past orders intact.
