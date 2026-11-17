import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useCountUp from "../hooks/useCountUp";
import useTilt from "../hooks/useTilt";
import ProductImageUploader from "./upload/ProductImageUploader";
import "./AdminDashboard.css";
import "./admin-premium.css";

const STORAGE_KEY = "krive-admin-products-v1";

const starterProducts = [
  {
    id: "KF-001",
    name: "Royal Banarasi",
    category: "Sarees",
    department: "Women",
    price: 3499,
    stock: 12,
    image: "/images/banarasi-saree.jpg.png",
    description: "A timeless Banarasi-inspired festive drape.",
    status: "Published",
  },
  {
    id: "KF-002",
    name: "The Anarkali Edit",
    category: "Salwar Suits",
    department: "Women",
    price: 2499,
    stock: 8,
    image: "/images/anarkali-suit.jpg.png",
    description: "An elegant embroidered festive ensemble.",
    status: "Published",
  },
  {
    id: "KF-003",
    name: "Gulabi Grace",
    category: "Kurtis",
    department: "Women",
    price: 1299,
    stock: 3,
    image: "/images/gulabi-kurti.jpg.png",
    description: "Soft blush styling for everyday elegance.",
    status: "Published",
  },
  {
    id: "KF-004",
    name: "Mehfil Lehenga",
    category: "Lehengas",
    department: "Women",
    price: 4999,
    stock: 2,
    image: "/images/mehfil-lehenga.jpg.png",
    description: "An occasion-ready embroidered lehenga.",
    status: "Published",
  },
];

const demoOrders = [
  {
    id: "ORD-1042",
    customer: "Ananya R.",
    items: 2,
    total: 4798,
    status: "Processing",
    date: "Recent",
  },
  {
    id: "ORD-1041",
    customer: "Priya K.",
    items: 1,
    total: 3499,
    status: "Shipped",
    date: "Recent",
  },
  {
    id: "ORD-1040",
    customer: "Meera S.",
    items: 3,
    total: 6897,
    status: "Delivered",
    date: "Recent",
  },
];
const emptyForm = {
  name: "",
  department: "Women",
  category: "Sarees",
  price: "",
  stock: "",
  image: "",
  description: "",
  status: "Published",
};


const DEFAULT_CATEGORIES = [
  "Sarees",
  "Kurtis",
  "Salwar Suits",
  "Lehengas",
  "Indo-Western",
  "Oversized Tees",
  "Cargos",
  "Shirts",
  "Hoodies",
  "Co-ord Sets",
  "Jackets",
];

const navigation = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "products", label: "Products", icon: "◇" },
  { id: "inventory", label: "Inventory", icon: "▤" },
  { id: "orders", label: "Orders", icon: "▧" },
  { id: "settings", label: "Store settings", icon: "⚙" },
];

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function readSavedProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterProducts;
  } catch {
    return starterProducts;
  }
}

function ProductImage({ product, className = "" }) {
  const [failedSrc, setFailedSrc] = useState("");
  const failed = failedSrc === product.image;

  if (!product.image || failed) {
    return (
      <div className={`product-image-fallback ${className}`}>
        <span>KF</span>
        <small>{product.category}</small>
      </div>
    );
  }

  return (
    <img
      className={`product-image ${className}`}
      src={product.image}
      alt={product.name}
      onError={() => setFailedSrc(product.image)}
    />
  );
}

function MetricCard({ label, value, detail, icon, tone = "", format, onClick }) {
  const ref = useRef(null);
  useTilt(ref, { max: 5 });
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const shown = typeof value === "number" ? (format ? format(animated) : animated) : value;
  const interactive = typeof onClick === "function";

  return (
    <article
      ref={ref}
      className={`metric-card ${tone}${interactive ? " is-clickable" : ""}`}
      {...(interactive
        ? {
          role: "link",
          tabIndex: 0,
          onClick,
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          },
        }
        : {})}
    >
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{shown}</strong>
      <span className="metric-detail">{detail}</span>
      <span className="kf-glare" aria-hidden="true" />
    </article>
  );
}

function AdminProductCard({ product, onEdit, onDelete }) {
  const ref = useRef(null);
  useTilt(ref, { max: 5 });
  const stock = Number(product.stock);
  const stockClass = stock === 0 ? "stock-out" : stock <= 5 ? "stock-low" : "stock-good";

  return (
    <article className="apc" ref={ref}>
      <div className="apc-media">
        <ProductImage product={product} />
      </div>
      <div className="apc-body">
        <div>
          <strong>{product.name}</strong>
          <small>{product.id} · {product.category}</small>
        </div>
        <b>{money(product.price)}</b>
      </div>
      <div className="apc-foot">
        <span className={`stock-badge ${stockClass}`}>
          {stock === 0 ? "Out of stock" : stock <= 5 ? `${stock} left` : stock}
        </span>
        <span className={`status-dot ${product.status === "Draft" ? "status-draft" : ""}`}>
          {product.status || "Published"}
        </span>
        <div className="table-actions">
          <button className="icon-button" title="Edit product" aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}>✎</button>
          <button className="icon-button danger" title="Delete product" aria-label={`Delete ${product.name}`} onClick={() => onDelete(product)}>×</button>
        </div>
      </div>
      <span className="kf-glare" aria-hidden="true" />
    </article>
  );
}

export default function AdminDashboard() {
  const [departmentFilter, setDepartmentFilter] = useState("All"); // "All" | "Women" | "Men"
  const [newCatDept, setNewCatDept] = useState("Men");
  const [newCatName, setNewCatName] = useState("");
  const [customCats, setCustomCats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("krive_custom_categories") || '{"Women":[],"Men":[]}');
    } catch {
      return { Women: [], Men: [] };
    }
  });
  const womenCategories = Array.from(
    new Set(["Sarees", "Kurtis", "Salwar Suits", "Lehengas", "Indo-Western", ...(customCats.Women || [])])
  );
  const menCategories = Array.from(
    new Set(["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])])
  );

  const categories =
    departmentFilter === "Women"
      ? womenCategories
      : departmentFilter === "Men"
        ? menCategories
        : Array.from(new Set([...womenCategories, ...menCategories]));
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    return sessionStorage.getItem("krive-admin-unlocked") === "true";
  });
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [products, setProducts] = useState(readSavedProducts);
  const [orders, setOrders] = useState(demoOrders);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [page, setPage] = useState("overview");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const closeTimer = useRef(0);
  const [orderStatuses, setOrderStatuses] = useState(
    Object.fromEntries(demoOrders.map((order) => [order.id, order.status]))
  );
  const [storeInfo, setStoreInfo] = useState({
    name: "KRIVE FASHIONS",
    email: "hello@krivefashions.com",
    phone: "+91 98765 43210",
    address: "12 MG Road, Madurai, Tamil Nadu",
  });

  const refreshBackendData = useCallback(() => {
    fetch("/api/admin/products?size=100")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((pageData) => {
        if (pageData?.content) {
          setProducts(pageData.content.map((p) => ({ ...p, price: Number(p.price) })));
        }
      })
      .catch(() => { });

    fetch("/api/admin/orders?size=100")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((pageData) => {
        if (pageData?.content && pageData.content.length > 0) {
          const mapped = pageData.content.map((o) => ({
            id: o.id,
            customer: o.customer,
            items: o.items,
            total: Number(o.total),
            status: o.status,
            date: o.date ? new Date(o.date).toLocaleDateString("en-IN") : "Recent",
          }));
          setOrders(mapped);
          setOrderStatuses(Object.fromEntries(mapped.map((o) => [o.id, o.status])));
        }
      })
      .catch(() => { });

    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data?.name) setStoreInfo(data);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      window.setTimeout(
        () => setNotice("Browser storage is full or unavailable. Changes may not persist."),
        0
      );
    }
  }, [products]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock) <= 5),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        `${product.name} ${product.category} ${product.id}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "Low stock" && Number(product.stock) <= 5) ||
        (stockFilter === "In stock" && Number(product.stock) > 5) ||
        (stockFilter === "Out of stock" && Number(product.stock) === 0);

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price) * Number(product.stock),
    0
  );

  const closeForm = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setShowForm(false);
      setClosing(false);
      setEditingId(null);
      setForm(emptyForm);
      setUploading(false);
    }, 260);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!showForm) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (uploading) {
        setNotice("An upload is in progress. Cancel it first, or wait for it to finish.");
        return;
      }
      closeForm();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm, uploading, closeForm]);

  function cancelPendingClose() {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
  }

  function openNewProduct() {
    cancelPendingClose();
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditProduct(product) {
    cancelPendingClose();
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || "",
      description: product.description || "",
      status: product.status || "Published",
    });
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function saveProduct(event) {
    event.preventDefault();

    if (uploading) {
      setNotice("Please wait for the image upload to finish.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim()) {
      setNotice("Please enter a product name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setNotice("Please enter a price greater than zero.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setNotice("Stock must be a whole number of zero or more.");
      return;
    }

    const menCats = ["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets"];
    const department = menCats.includes(form.category) ? "Men" : "Women";

    const productData = {
      ...form,
      name: form.name.trim(),
      department,
      image: form.image.trim().startsWith("data:") ? "" : form.image.trim(),
      description: form.description.trim(),
      price,
      stock,
    };

    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })
      .then(async (res) => {
        const saved = await res.json();
        if (!res.ok) throw new Error(saved?.message || "Failed to save to backend");
        if (editingId) {
          setProducts((current) =>
            current.map((product) =>
              product.id === editingId ? { ...saved, price: Number(saved.price) } : product
            )
          );
          setNotice("Product updated in Spring Boot database!");
        } else {
          setProducts((current) => [{ ...saved, price: Number(saved.price) }, ...current]);
          setNotice(`Product ${saved.id} added to your catalogue!`);
        }
      })
      .catch((err) => {
        setNotice(err.message || "Error saving to backend");
      });

    closeForm();
    setPage("products");
  }

  function deleteProduct(product) {
    const confirmed = window.confirm(
      `Remove "${product.name}" from the catalogue?`
    );

    if (!confirmed) return;

    fetch(`/api/admin/products/${product.id}`, { method: "DELETE" })
      .then(() => {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        setNotice("Product removed from the database.");
      })
      .catch(() => {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        setNotice("Product removed locally.");
      });
  }

  function updateOrderStatus(orderId, status) {
    fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Could not update order status");
        setOrderStatuses((current) => ({ ...current, [orderId]: data.status }));
        refreshBackendData();
        setNotice(`Order ${orderId} updated to ${data.status}.`);
      })
      .catch((err) => {
        setOrderStatuses((current) => ({ ...current, [orderId]: status }));
        setNotice(err.message || "Order status updated locally.");
      });
  }

  function openOrderDetail(orderId) {
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setSelectedOrderDetail(data))
      .catch(() => setNotice("Full details are available for live database orders."));
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setShowForm(false);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProductTable(list = filteredProducts, inventoryOnly = false) {
    if (list.length === 0) {
      return (
        <div className="admin-empty">
          <span>◇</span>
          <h3>No products found</h3>
          <p>Try another search or add a new piece to your collection.</p>
          <button className="admin-button admin-button-dark" onClick={openNewProduct}>
            + Add a product
          </button>
        </div>
      );
    }

    return (
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              {!inventoryOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list
              .filter((product) => {
                if (departmentFilter === "All") return true;
                const prodDept =
                  product.department ||
                  product.gender ||
                  (["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])].includes(
                    product.category
                  )
                    ? "Men"
                    : "Women");
                return prodDept.toLowerCase() === departmentFilter.toLowerCase();
              })
              .map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage product={product} />
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        marginRight: "6px",
                        padding: "2px 6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background:
                          (["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])].includes(product.category) || product.department === "Men")
                            ? "#282620"
                            : "#e8dfd1",
                        color:
                          (["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])].includes(product.category) || product.department === "Men")
                            ? "#f8f5ef"
                            : "#282620",
                      }}
                    >
                      {(["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])].includes(product.category) || product.department === "Men")
                        ? "MEN"
                        : "WOMEN"}
                    </span>
                    {product.category}
                  </td>
                  <td className="price-cell">{money(product.price)}</td>
                  <td>
                    <span
                      className={`stock-badge ${product.stock === 0
                        ? "stock-out"
                        : product.stock <= 5
                          ? "stock-low"
                          : "stock-good"
                        }`}
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : product.stock <= 5
                          ? `${product.stock} left`
                          : product.stock}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-dot ${product.status === "Draft" ? "status-draft" : ""
                        }`}
                    >
                      {product.status || "Published"}
                    </span>
                  </td>
                  {!inventoryOnly && (
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEditProduct(product)}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-button danger"
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => deleteProduct(product)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProductGrid(list = filteredProducts) {
    if (list.length === 0) return renderProductTable(list);
    return (
      <div className="apc-grid">
        {list
          .filter((product) => {
            if (departmentFilter === "All") return true;
            const prodDept =
              product.department ||
              product.gender ||
              (["Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets", ...(customCats.Men || [])].includes(
                product.category
              )
                ? "Men"
                : "Women");
            return prodDept.toLowerCase() === departmentFilter.toLowerCase();
          })
          .map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              onEdit={openEditProduct}
              onDelete={deleteProduct}
            />
          ))}
      </div>
    );
  }

  function renderOverview() {
    return (
      <>
        <section className="welcome-banner">
          <div>
            <p className="admin-eyebrow">YOUR BRAND, YOUR VISION</p>
            <h2>Every detail tells a story.</h2>
            <p>
              Manage your collections and keep your store beautifully organised.
            </p>
            <button
              className="admin-button admin-button-light"
              onClick={openNewProduct}
            >
              + Add a new dress
            </button>
          </div>
          <div className="welcome-monogram" aria-hidden="true">KF</div>
        </section>

        <section className="metric-grid">
          <MetricCard
            label="Total products"
            value={products.length}
            detail="Items in catalogue"
            icon="◇"
            onClick={() => navigate("products")}
          />
          <MetricCard
            label="Low stock"
            value={lowStockProducts.length}
            detail="Products with 5 or fewer units"
            icon="!"
            tone="metric-warning"
            onClick={() => navigate("inventory")}
          />
          <MetricCard
            label="Inventory value"
            value={inventoryValue}
            format={money}
            detail="Retail price × available units"
            icon="₹"
            onClick={() => navigate("inventory")}
          />
          <MetricCard
            label="Total orders"
            value={orders.length}
            detail="Customer orders in database"
            icon="▧"
            onClick={() => navigate("orders")}
          />
        </section>

        {lowStockProducts.length > 0 && (
          <section className="alert-banner">
            <span className="alert-symbol">!</span>
            <div>
              <strong>Inventory needs attention</strong>
              <p>
                {lowStockProducts.length} product(s) have five or fewer units.
                Review your stock before accepting more orders.
              </p>
            </div>
            <button
              className="text-action"
              onClick={() => navigate("inventory")}
            >
              Review stock →
            </button>
          </section>
        )}

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="admin-eyebrow">THE COLLECTION</p>
              <h2>Recently added products</h2>
            </div>
            <button className="text-action" onClick={() => navigate("products")}>
              View catalogue →
            </button>
          </div>
          {renderProductTable([...products].slice(0, 5))}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="admin-eyebrow">ORDER MANAGEMENT</p>
              <h2>Recent orders</h2>
            </div>
            <button className="text-action" onClick={() => navigate("orders")}>
              View orders →
            </button>
          </div>
          {renderOrders(true)}
        </section>
      </>
    );
  }

  function renderOrders(compact = false) {
    const list = compact ? orders.slice(0, 3) : orders;

    return (
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              {!compact && <th>Update status</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((order) => {
              const currentStatus = orderStatuses[order.id] || order.status || "Processing";
              return (
                <tr key={order.id}>
                  <td>
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => openOrderDetail(order.id)}
                      style={{ padding: 0, fontWeight: 700 }}
                    >
                      {order.id} (View details ↗)
                    </button>
                    <small className="table-subtitle">{order.date}</small>
                  </td>
                  <td>{order.customer}</td>
                  <td>{order.items}</td>
                  <td className="price-cell">{money(order.total)}</td>
                  <td>
                    <span className={`order-status order-${currentStatus.toLowerCase()}`}>
                      {currentStatus}
                    </span>
                  </td>
                  {!compact && (
                    <td>
                      <select
                        className="status-select"
                        value={currentStatus}
                        onChange={(event) =>
                          updateOrderStatus(order.id, event.target.value)
                        }
                        aria-label={`Update ${order.id} status`}
                      >
                        <option>Processing</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProductsPage() {
    return (
      <>
        <section className="page-intro">
          <div>
            <p className="admin-eyebrow">YOUR COLLECTION</p>
            <h2>Product catalogue</h2>
            <p>Curate every piece in the KRIVE FASHIONS collection.</p>
          </div>
          <button className="admin-button admin-button-dark" onClick={openNewProduct}>
            + Add product
          </button>
        </section>
        {/* MEN / WOMEN DEPARTMENT SWITCHER & STOREFRONT CATEGORY ADDER */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            marginBottom: "14px",
            background: "#f8f5ef",
            border: "1px solid #e2d9c8",
          }}
        >
          {/* 1. Differentiate All / Women / Men Products */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", marginRight: "6px", color: "#282620" }}>
              COLLECTION:
            </span>
            {["All", "Women", "Men"].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  setDepartmentFilter(dept);
                  setCategoryFilter("All");
                }}
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.6px",
                  cursor: "pointer",
                  border: "1px solid #282620",
                  background: departmentFilter === dept ? "#282620" : "#fff",
                  color: departmentFilter === dept ? "#f8f5ef" : "#282620",
                }}
              >
                {dept.toUpperCase()}
              </button>
            ))}
          </div>

          {/* 2. Add New Category to "The essentials edit." Bar on User UI */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={newCatDept}
                onChange={(e) => setNewCatDept(e.target.value)}
                style={{ padding: "7px 10px", border: "1px solid #d8d0c5", fontSize: "12px", background: "#fff", color: "#282620" }}
              >
                <option value="Women">Women's Edit</option>
                <option value="Men">Men's Edit</option>
              </select>
              <input
                type="text"
                placeholder="Type category name (e.g. Denim)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("add-essential-cat-btn")?.click();
                  }
                }}
                style={{ padding: "7px 12px", border: "1px solid #d8d0c5", fontSize: "12px", minWidth: "220px", background: "#fff", color: "#282620" }}
              />
              <button
                id="add-essential-cat-btn"
                type="button"
                onClick={() => {
                  const trimmed = newCatName.trim();
                  if (!trimmed) {
                    alert("Please type a category name in the box first (e.g., Denim or Kurta Sets)!");
                    return;
                  }
                  const currentList = Array.isArray(customCats[newCatDept]) ? customCats[newCatDept] : [];
                  const updated = {
                    ...customCats,
                    [newCatDept]: Array.from(new Set([...currentList, trimmed])),
                  };
                  setCustomCats(updated);
                  localStorage.setItem("krive_custom_categories", JSON.stringify(updated));
                  window.dispatchEvent(new Event("storage"));
                  setNewCatName("");
                }}
                style={{
                  padding: "8px 14px",
                  background: "#282620",
                  color: "#f8f5ef",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.6px",
                }}
              >
                + ADD TO ESSENTIALS EDIT
              </button>
            </div>

            {/* Show added custom categories as removable chips right below */}
            {((customCats.Women?.length > 0) || (customCats.Men?.length > 0)) && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "10px" }}>
                {["Women", "Men"].map((dept) =>
                  (customCats[dept] || []).map((cat) => (
                    <span
                      key={`${dept}-${cat}`}
                      style={{
                        background: "#e8dfd1",
                        color: "#282620",
                        padding: "2px 8px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {dept.toUpperCase()}: {cat}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...customCats,
                            [dept]: (customCats[dept] || []).filter((c) => c !== cat),
                          };
                          setCustomCats(updated);
                          localStorage.setItem("krive_custom_categories", JSON.stringify(updated));
                          window.dispatchEvent(new Event("storage"));
                        }}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 700 }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <section className="dashboard-panel">
          <div className="filter-bar">
            <input
              className="search-input"
              placeholder="Search products, categories or IDs..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search products"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option>All</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              aria-label="Filter by stock"
            >
              <option>All</option>
              <option>In stock</option>
              <option>Low stock</option>
              <option>Out of stock</option>
            </select>
            <div className="view-toggle" role="group" aria-label="Product layout">
              <button
                type="button"
                className={viewMode === "table" ? "active" : ""}
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                Gallery
              </button>
            </div>
          </div>
          {viewMode === "grid" ? renderProductGrid() : renderProductTable()}
        </section>
      </>
    );
  }

  function renderInventoryPage() {
    return (
      <>
        <section className="page-intro">
          <div>
            <p className="admin-eyebrow">STOCK CONTROL</p>
            <h2>Inventory</h2>
            <p>Keep track of availability across your collection.</p>
          </div>
          <button
            className="admin-button admin-button-dark"
            onClick={() => navigate("products")}
          >
            Manage products
          </button>
        </section>

        <section className="metric-grid inventory-metrics">
          <MetricCard label="Total SKUs" value={products.length} detail="Unique products" icon="◇" />
          <MetricCard
            label="Units in stock"
            value={products.reduce((sum, item) => sum + Number(item.stock), 0)}
            detail="Across all products"
            icon="▤"
          />
          <MetricCard label="Low-stock items" value={lowStockProducts.length} detail="5 or fewer units" icon="!" tone="metric-warning" />
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="admin-eyebrow">STOCK OVERVIEW</p>
              <h2>Availability by product</h2>
            </div>
          </div>
          {renderProductTable(products, true)}
          <p className="admin-note">
            Edit a product from the Products section to update its stock.
          </p>
        </section>
      </>
    );
  }

  function renderSettingsPage() {
    return (
      <section className="dashboard-panel settings-panel">
        <p className="admin-eyebrow">YOUR BRAND</p>
        <h2>Store settings</h2>
        <p className="admin-muted">
          Update the contact details for your store. Changes are saved to the Spring Boot database.
        </p>
        <form
          className="settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(storeInfo),
              });
              if (!res.ok) throw new Error();
              setNotice("Store settings saved to Spring Boot database.");
            } catch {
              setNotice("Settings updated locally.");
            }
          }}
        >
          <label>
            Store name
            <input name="name" value={storeInfo.name} onChange={(event) => setStoreInfo({ ...storeInfo, name: event.target.value })} required />
          </label>
          <label>
            Business email
            <input name="email" type="email" value={storeInfo.email} onChange={(event) => setStoreInfo({ ...storeInfo, email: event.target.value })} placeholder="hello@krivefashions.com" />
          </label>
          <label>
            Contact number
            <input name="phone" value={storeInfo.phone} onChange={(event) => setStoreInfo({ ...storeInfo, phone: event.target.value })} placeholder="+91 ..." />
          </label>
          <label>
            Business address
            <textarea name="address" rows="3" value={storeInfo.address} onChange={(event) => setStoreInfo({ ...storeInfo, address: event.target.value })} placeholder="Business address" />
          </label>
          <button className="admin-button admin-button-dark" type="submit">
            Save settings
          </button>
        </form>
      </section>
    );
  }

  const pageTitles = {
    overview: "Overview",
    products: "Products",
    inventory: "Inventory",
    orders: "Orders",
    settings: "Settings",
  };
  if (!adminUnlocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "radial-gradient(ellipse at 20% 0%, #3c382d 0%, #191814 70%)",
          color: "#f8f4eb",
          fontFamily: "'DM Sans', sans-serif",
          padding: "20px",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (adminPassInput === "pratheebarithik189") {
              sessionStorage.setItem("krive-admin-unlocked", "true");
              setAdminUnlocked(true);
              setAdminLoginError("");
            } else {
              setAdminLoginError("Invalid owner password. Access denied.");
            }
          }}
          style={{
            width: "min(400px, 100%)",
            padding: "40px 32px",
            background: "#24241f",
            border: "1px solid #454238",
            boxShadow: "0 28px 80px rgba(0,0,0,0.6)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "34px",
              letterSpacing: "4px",
              display: "block",
            }}
          >
            KRIVE
          </span>
          <small
            style={{
              color: "#c3ad84",
              fontSize: "9px",
              letterSpacing: "3.5px",
              display: "block",
              marginTop: "6px",
              marginBottom: "28px",
            }}
          >
            ADMINISTRATION STUDIO
          </small>

          <input
            type="password"
            placeholder="Enter Owner Password"
            value={adminPassInput}
            onChange={(e) => setAdminPassInput(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "13px 14px",
              background: "#181814",
              border: "1px solid #454238",
              color: "#fff",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          />

          {adminLoginError && (
            <p style={{ color: "#e4857c", fontSize: "12px", margin: "0 0 12px" }}>
              {adminLoginError}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: "#c3ad84",
              color: "#191814",
              border: 0,
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "1.5px",
              cursor: "pointer",
            }}
          >
            UNLOCK ADMIN STUDIO →
          </button>

          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "20px",
              fontSize: "11px",
              color: "#a39b8b",
              textDecoration: "none",
            }}
          >
            ← Return to Storefront
          </a>
        </form>
      </div>
    );
  }

  return (

    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a
          href="/admin"
          className="brand-lockup"
          onClick={(event) => {
            event.preventDefault();
            navigate("overview");
          }}
        >
          <span className="brand-name">KRIVE</span>
          <span className="brand-subtitle">F A S H I O N S</span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "inventory" && lowStockProducts.length > 0 && (
                <span className="nav-count">{lowStockProducts.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-brand-card">
            <span className="sidebar-monogram">KF</span>
            <p>Thoughtfully curated.</p>
            <small>Elegance in every detail.</small>
          </div>
          <div className="sidebar-footer">
            <span className="connection-dot" />
            <a href="/" style={{ color: "inherit", textDecoration: "none" }}>← BACK TO STOREFRONT</a>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="breadcrumb">KRIVE / </span>
            <strong>{pageTitles[page]}</strong>
          </div>
          <div className="topbar-right">
            <span className="preview-pill">SPRING BOOT API</span>
            <div className="owner-avatar" title="Store owner">KF</div>
          </div>
        </header>

        <div className="admin-content">
          <div className="page-heading-row">
            <div>
              <p className="admin-eyebrow">STORE MANAGEMENT</p>
              <h1>{page === "overview" ? "Good day, welcome back." : pageTitles[page]}</h1>
              <p className="page-subtitle">
                {page === "overview"
                  ? "A considered view of your brand, collection and inventory."
                  : page === "products"
                    ? "Every piece in your collection, beautifully organised."
                    : page === "inventory"
                      ? "Know what is available and what needs replenishing."
                      : page === "orders"
                        ? "Click any order ID below to inspect items, sizes, and customer delivery details."
                        : "Manage your store identity and contact information."}
              </p>
            </div>
            {page !== "settings" && (
              <button
                className="admin-button admin-button-dark heading-action"
                onClick={openNewProduct}
              >
                + Add product
              </button>
            )}
          </div>

          <div className="admin-page" key={page}>
            {page === "overview" && renderOverview()}
            {page === "products" && renderProductsPage()}
            {page === "inventory" && renderInventoryPage()}
            {page === "orders" && (
              <section className="dashboard-panel">
                <div className="panel-heading">
                  <div>
                    <p className="admin-eyebrow">ORDER MANAGEMENT</p>
                    <h2>Customer orders</h2>
                  </div>
                  <span className="preview-pill">LIVE DB</span>
                </div>
                {renderOrders()}
              </section>
            )}
            {page === "settings" && renderSettingsPage()}
          </div>

          <footer className="admin-footer">
            <span>KRIVE FASHIONS</span>
            <span>Timeless Indian craftsmanship · Modern style, forever.</span>
          </footer>
        </div>
      </main>

      {showForm && (
        <div
          className={`modal-backdrop${closing ? " is-closing" : ""}`}
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (uploading) {
              setNotice("An upload is in progress. Cancel it first, or wait for it to finish.");
              return;
            }
            closeForm();
          }}
        >
          <section
            className={`product-modal${closing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="admin-eyebrow">
                  {editingId ? "REFINE YOUR COLLECTION" : "COLLECTION MANAGEMENT"}
                </p>
                <h2 id="product-modal-title">
                  {editingId ? "Edit product" : "Add a new dress"}
                </h2>
                <p>Enter the details of this piece.</p>
              </div>
              <button
                className="modal-close"
                aria-label="Close form"
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form className="product-form" onSubmit={saveProduct}>
              <label>
                Product name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Emerald Anarkali"
                  required
                />
              </label>

              <div className="form-columns">
                <label>
                Collection (Women / Men) *
                <select
                  name="department"
                  value={
                    form.department ||
                    (menCategories.includes(form.category) ? "Men" : "Women")
                  }
                  onChange={(event) => {
                    const nextDept = event.target.value;
                    const nextCats = nextDept === "Men" ? menCategories : womenCategories;
                    setForm((prev) => ({
                      ...prev,
                      department: nextDept,
                      gender: nextDept,
                      category: nextCats[0] || "",
                    }));
                  }}
                >
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                </select>
              </label>

              <label>
                Category *
                <select name="category" value={form.category} onChange={updateField}>
                  {((form.department || (menCategories.includes(form.category) ? "Men" : "Women")) === "Men"
                    ? menCategories
                    : womenCategories
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
                <label>
                  Listing status
                  <select name="status" value={form.status} onChange={updateField}>
                    <option>Published</option>
                    <option>Draft</option>
                  </select>
                </label>
              </div>

              <div className="form-columns">
                <label>
                  Price (₹) *
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={updateField}
                    placeholder="2999"
                    required
                  />
                </label>
                <label>
                  Stock quantity *
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={updateField}
                    placeholder="10"
                    required
                  />
                </label>
              </div>

              <ProductImageUploader
                value={form.image}
                onChange={(url) => setForm((current) => ({ ...current, image: url }))}
                onBusyChange={setUploading}
              />

              <label>
                Or use an image path / URL
                <input
                  name="image"
                  value={form.image.startsWith("data:") ? "Image stored in this browser" : form.image}
                  readOnly={form.image.startsWith("data:")}
                  onChange={updateField}
                  placeholder="/images/new-dress.jpg"
                />
                <small className="field-help">
                  Uploading above is the easiest way. You can still point to a file in your
                  public/images folder.
                </small>
              </label>

              <label>
                Product description
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Fabric, design, occasion and details..."
                />
              </label>

              <div className="modal-actions">
                <button
                  className="admin-button admin-button-outline"
                  type="button"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button className="admin-button admin-button-dark" type="submit" disabled={uploading}>
                  {uploading ? "Uploading image…" : editingId ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ADMIN FULL ORDER DETAILS MODAL */}
      {selectedOrderDetail && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedOrderDetail(null)}>
          <section
            className="product-modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ padding: "28px" }}
          >
            <div className="modal-heading" style={{ padding: "0 0 18px 0" }}>
              <div>
                <p className="admin-eyebrow">ORDER DETAILS</p>
                <h2>
                  {selectedOrderDetail.id} — {selectedOrderDetail.status}
                </h2>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                padding: "16px 0",
                borderBottom: "1px solid #e7e2d8",
              }}
            >
              <div>
                <p className="admin-eyebrow">CUSTOMER</p>
                <strong>{selectedOrderDetail.customer?.name}</strong>
                <p style={{ margin: "4px 0" }}>{selectedOrderDetail.customer?.email}</p>
                <p style={{ margin: 0 }}>{selectedOrderDetail.customer?.phone}</p>
              </div>
              <div>
                <p className="admin-eyebrow">SHIPPING ADDRESS & PAYMENT</p>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  {selectedOrderDetail.customer?.address}
                </p>
              </div>
            </div>

            <div style={{ padding: "16px 0" }}>
              <p className="admin-eyebrow">
                ITEMS ORDERED ({selectedOrderDetail.itemCount})
              </p>
              <table className="product-table" style={{ minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderDetail.items?.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{item.productName}</strong>{" "}
                        <small>({item.productId})</small>
                      </td>
                      <td>{item.size || "M"}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitPrice)}</td>
                      <td className="price-cell">{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #e7e2d8",
              }}
            >
              <span style={{ fontSize: "12px", color: "#898477" }}>
                Ordered on{" "}
                {selectedOrderDetail.createdAt
                  ? new Date(selectedOrderDetail.createdAt).toLocaleString("en-IN")
                  : "Recent"}
              </span>
              <strong style={{ fontSize: "18px" }}>
                Total: {money(selectedOrderDetail.total)}
              </strong>
            </div>
          </section>
        </div>
      )}

      {notice && (
        <div className="admin-toast" role="status">
          <span>✓</span>
          {notice}
        </div>
      )}
    </div>
  );
}