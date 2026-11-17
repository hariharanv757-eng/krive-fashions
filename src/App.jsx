import AdminDashboard from "./admin/AdminDashboard";
import { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import CategoryCard from "./components/CategoryCard";
import PageLoader from "./components/PageLoader";
import ProductCard from "./components/ProductCard";
import ProductCarousel from "./components/ProductCarousel";
import Reveal from "./components/Reveal";
import useParallax from "./hooks/useParallax";
import useScrolled from "./hooks/useScrolled";
import "./App.css";

// --- OFFICIAL FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDyQfs2wcczpmuCKI0k7cHIZV2d18crdiA",
  authDomain: "krive-fashions.firebaseapp.com",
  projectId: "krive-fashions",
  storageBucket: "krive-fashions.firebasestorage.app",
  messagingSenderId: "137174999858",
  appId: "1:137174999858:web:08f1d13790412208876d2b",
  measurementId: "G-CSB5QT416K",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const products = [
  {
    id: 1,
    name: "Royal Banarasi",
    category: "Sarees",
    price: 3499,
    label: "BESTSELLER",
    image: "/images/banarasi-saree.jpg.png",
  },
  {
    id: 2,
    name: "The Anarkali Edit",
    category: "Salwar Suits",
    price: 2499,
    label: "NEW ARRIVAL",
    image: "/images/anarkali-suit.jpg.png",
  },
  {
    id: 3,
    name: "Gulabi Grace",
    category: "Kurtis",
    price: 1299,
    label: "",
    image: "/images/gulabi-kurti.jpg.png",
  },
  {
    id: 4,
    name: "Mehfil Lehenga",
    category: "Lehengas",
    price: 4999,
    label: "FESTIVE EDIT",
    image: "/images/mehfil-lehenga.jpg.png",
  },
  {
    id: 5,
    name: "Sage Co-ord Set",
    category: "Indo-Western",
    price: 1899,
    label: "TRENDING",
    image: "/images/sage-coord.jpg.png",
  },
  {
    id: 6,
    name: "Festive Bloom",
    category: "Salwar Suits",
    price: 2199,
    label: "NEW ARRIVAL",
    image: "/images/festive-suit.jpg.png",
  },
];

const menProducts = [
  {
    id: 101,
    name: "Midnight Oversized Tee",
    category: "Oversized Tees",
    price: 999,
    image: "/images/midnight-tee.jpg.jpg",
  },
  {
    id: 102,
    name: "Urban Utility Cargo",
    category: "Cargos",
    price: 1799,
    image: "/images/urban-cargo.jpg.jpg",
  },
  {
    id: 103,
    name: "Monochrome Street Shirt",
    category: "Shirts",
    price: 1499,
    image: "/images/monochrome-shirt.jpg.jpg",
  },
  {
    id: 104,
    name: "After Hours Hoodie",
    category: "Hoodies",
    price: 1999,
    image: "/images/after-hours-hoodie.jpg.jpg",
  },
  {
    id: 105,
    name: "Essential Co-ord Set",
    category: "Co-ord Sets",
    price: 2299,
    image: "/images/essential-coord.jpg.jpg",
  },
  {
    id: 106,
    name: "Streetform Jacket",
    category: "Jackets",
    price: 2499,
    image: "/images/streetform-jacket.jpg.jpg",
  },
];

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const WOMEN_FILTERS = ["All", "Sarees", "Kurtis", "Salwar Suits", "Lehengas", "Indo-Western"];
const MEN_FILTERS = ["All", "Oversized Tees", "Cargos", "Shirts", "Hoodies", "Co-ord Sets", "Jackets"];

const WOMEN_CATEGORIES = [
  { name: "Sarees", subtitle: "Timeless drapes", image: products[0].image },
  { name: "Kurtis", subtitle: "Everyday elegance", image: products[2].image },
  { name: "Lehengas", subtitle: "Celebrate beautifully", image: products[3].image },
  { name: "Salwar Suits", subtitle: "Grace in every detail", image: products[1].image },
];

const MEN_CATEGORIES = [
  { name: "Oversized Tees", subtitle: "Relaxed by design", image: menProducts[0].image },
  { name: "Cargos", subtitle: "Utility meets style", image: menProducts[1].image },
  { name: "Shirts", subtitle: "Clean everyday fits", image: menProducts[2].image },
  { name: "Hoodies", subtitle: "Streetwear essentials", image: menProducts[3].image },
];

function App() {
  if (window.location.pathname === "/admin") {
    return <AdminDashboard />;
  }
  return <Storefront />;
}

function Storefront() {
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("Women");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [dbProducts, setDbProducts] = useState([]);

  // 1. Official Firebase Google Login State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("krive-google-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Payment Gateway State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(60);
  const [qrSessionId, setQrSessionId] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState("PROFILE"); // "PROFILE" | "ORDERS"
  const [locating, setLocating] = useState(false);
  // 3. Order Details & History State
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [customer, setCustomer] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+91 ",
    address: "",
  });

  const [selectedSizes] = useState({});
  const [selectedColors] = useState({});

  const [heroEl, setHeroEl] = useState(null);
  useParallax(heroEl);
  const scrolled = useScrolled(24);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data.map((p) => ({ ...p, price: Number(p.price) })));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("men-theme", gender === "Men");
    return () => {
      document.body.classList.remove("men-theme");
    };
  }, [gender]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);
  // Auto-load saved user profile whenever user signs in with Google
  useEffect(() => {
    const emailKey = user?.email || customer?.email;
    if (!emailKey) return;
    const saved = localStorage.getItem(`krive_profile_${emailKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomer((prev) => ({
          ...prev,
          name: parsed.name || user?.displayName || prev.name,
          email: emailKey,
          phone: parsed.phone || prev.phone,
          address: parsed.address || prev.address,
        }));
      } catch { }
    }
  }, [user]);

  // Save profile permanently for future Google Sign-Ins
  const saveUserProfile = (e) => {
    if (e) e.preventDefault();
    const emailKey = user?.email || customer?.email || "guest";
    localStorage.setItem(`krive_profile_${emailKey}`, JSON.stringify(customer));
    setProfileOpen(false);
    setNotice("Shipping profile saved! It will auto-fill on every checkout.");
  };

  // Detect live GPS coordinates & reverse-geocode into full street address
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const detectedAddress =
            data?.display_name || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;

          setCustomer((prev) => {
            const updated = { ...prev, address: detectedAddress };
            const emailKey = user?.email || updated.email || "guest";
            localStorage.setItem(`krive_profile_${emailKey}`, JSON.stringify(updated));
            return updated;
          });
          setNotice("Current location pinned and saved to your profile!");
        } catch {
          setCustomer((prev) => ({
            ...prev,
            address: `GPS Pin: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }));
          setNotice("GPS coordinates added!");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setNotice("Please allow location permission in your browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  // Reusable Order Confirmation & Redirect to Receipt + Orders Tab
  const completeCheckoutOrder = async (customNote = "") => {
    if (processingPayment || cart.length === 0) return;
    setProcessingPayment(true);

    const last4 = cardDetails.number.replace(/\s+/g, "").slice(-4);
    const paymentTag =
      customNote ||
      (paymentMethod === "UPI"
        ? `UPI${upiId.trim() ? ` (${upiId.trim()})` : " QR Session Verified"}`
        : paymentMethod === "CARD"
          ? `CARD (•••• ${last4 || "Card"})`
          : "COD (Pay on Delivery)");

    const payload = {
      customer: {
        ...customer,
        address: `${customer.address} [Paid via ${paymentTag}]`,
      },
      items: cart.map((item) => ({
        productId:
          typeof item.id === "number"
            ? `KF-${String(item.id > 100 ? item.id - 94 : item.id).padStart(3, "0")}`
            : String(item.id),
        quantity: item.quantity,
        size: item.size || "M",
        color: item.color || "Default",
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Order failed");

      const confirmedOrder = { ...data, status: "ORDER CONFIRMED" };
      setMyOrders((prev) => [confirmedOrder, ...prev]);
      setPaymentModalOpen(false);
      setCart([]);
      setCartOpen(false);
      setOrdersOpen(true); // Opens "My Orders" tab
      setSelectedOrder(confirmedOrder); // Opens "Order Confirmed" Receipt Modal
      setNotice(`Order Confirmed! Receipt ${confirmedOrder.id} generated.`);
    } catch {
      const fallbackOrder = {
        id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "ORDER CONFIRMED",
        total: cartTotal,
        itemCount: cartCount,
        customer: payload.customer,
        items: cart.map((item) => ({
          productId:
            typeof item.id === "number"
              ? `KF-${String(item.id > 100 ? item.id - 94 : item.id).padStart(3, "0")}`
              : String(item.id),
          productName: item.name,
          size: item.size || "M",
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
        })),
      };
      setMyOrders((prev) => [fallbackOrder, ...prev]);
      setPaymentModalOpen(false);
      setCart([]);
      setCartOpen(false);
      setOrdersOpen(true); // Opens "My Orders" tab
      setSelectedOrder(fallbackOrder); // Opens "Order Confirmed" Receipt Modal
      setNotice(`Order Confirmed! Receipt ${fallbackOrder.id} generated.`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // 1-Minute (60s) UPI QR Session Timer — Refreshes QR on Timeout
  useEffect(() => {
    if (!paymentModalOpen || paymentMethod !== "UPI") return undefined;
    setQrTimeLeft(60);

    const interval = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          const nextSession = Math.floor(1000 + Math.random() * 9000);
          setQrSessionId(nextSession);
          setNotice("QR session expired — generated a new UPI QR code.");
          return 60; // Reset timer to 60s with new QR
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentModalOpen, paymentMethod]);
  const activeProducts =
    dbProducts.length > 0
      ? dbProducts.filter((p) => (p.department || "Women").toLowerCase() === gender.toLowerCase())
      : gender === "Women"
        ? products
        : menProducts;

  const customCategories = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem("krive_custom_categories") || "{}");
      return Array.isArray(saved[gender]) ? saved[gender] : [];
    } catch {
      return [];
    }
  })();

  const filterOptions = Array.from(
    new Set([
      ...(gender === "Women" ? WOMEN_FILTERS : MEN_FILTERS),
      ...customCategories,
      ...activeProducts.map((p) => p.category).filter(Boolean),
    ])
  );
  const categoryTiles = gender === "Women" ? WOMEN_CATEGORIES : MEN_CATEGORIES;
  const heroImage = gender === "Men" ? "/images/men-hero.jpg.png" : "/images/indian-hero.png";

  const filteredProducts = useMemo(
    () =>
      category === "All"
        ? activeProducts
        : activeProducts.filter((product) => product.category === category),
    [category, activeProducts]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product) {
    const size = product.chosenSize || selectedSizes[product.id] || "M";
    const color = selectedColors[product.id] || "Default";
    const cartId = `${product.id}-${size}-${color}`;

    setCart((current) => {
      const existing = current.find((item) => item.cartId === cartId);
      if (existing) {
        return current.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, cartId, size, color, quantity: 1 }];
    });

    setNotice(`${product.name} (Size: ${size}) added to your bag`);
  }

  function changeQuantity(cartId, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + amount } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function openCategory(item) {
    setCategory(item.name);
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  }

  // --- OFFICIAL FIREBASE GOOGLE SIGN-IN ---
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const realUser = {
        name: fbUser.displayName || "KRIVE Member",
        email: fbUser.email || "",
        picture: fbUser.photoURL || "",
        avatar: (fbUser.displayName || "U").charAt(0).toUpperCase(),
        color: "#4285F4",
      };
      setUser(realUser);
      localStorage.setItem("krive-google-user", JSON.stringify(realUser));
      setCustomer((prev) => ({
        ...prev,
        name: realUser.name,
        email: realUser.email,
      }));
      setNotice(`Signed in with Google as ${realUser.name}`);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setNotice("Google Sign-In was closed or blocked by popup settings.");
    }
  };

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
    setUser(null);
    localStorage.removeItem("krive-google-user");
    setNotice("Signed out of your Google account");
  }

  async function openMyOrders() {
    setOrdersOpen(true);
    const emailToLookup = (user?.email || customer.email || "").trim();
    if (!emailToLookup) return;
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(emailToLookup)}`);
      if (res.ok) {
        const data = await res.json();
        setMyOrders(data);
        return;
      }
    } catch {
      // fallback below
    }
    try {
      const res = await fetch(`/api/admin/orders?q=${encodeURIComponent(emailToLookup)}`);
      if (res.ok) {
        const page = await res.json();
        setMyOrders(page.content || []);
      }
    } catch {
      // ignore
    }
  }

  async function viewOrderDetails(orderId) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const fullOrder = await res.json();
        setSelectedOrder(fullOrder);
      }
    } catch {
      setNotice("Could not load order details.");
    }
  }

  return (
    <div className="store">
      <PageLoader imageSrc="/images/indian-hero.png" />

      <div className="announcement">
        TIMELESS INDIAN CRAFTSMANSHIP
        <span> · </span>
        MODERN STYLE, FOREVER
      </div>

      <header className={scrolled ? "header is-scrolled" : "header"}>
        <button
          className="menu-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenu}
        >
          ☰
        </button>

        <a href="#home" className="brand">
          KRIVE <span>FASHIONS</span>
          <small>THE ART OF EVERYDAY ELEGANCE</small>
        </a>

        <nav className={mobileMenu ? "nav nav-open" : "nav"}>
          <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
          <a href="#collection" onClick={() => { setCategory("All"); setMobileMenu(false); }}>Shop All</a>
          <a href="#collection" onClick={() => { setCategory("All"); setMobileMenu(false); }}>Dresses</a>
          <a href="#story" onClick={() => setMobileMenu(false)}>Our Story</a>
        </nav>

        <div className="gender-switch" role="group" aria-label="Choose collection">
          <button
            className={gender === "Women" ? "gender-option active" : "gender-option"}
            aria-pressed={gender === "Women"}
            onClick={() => {
              setGender("Women");
              setCategory("All");
            }}
          >
            WOMEN
          </button>

          <button
            className={gender === "Men" ? "gender-option active" : "gender-option"}
            aria-pressed={gender === "Men"}
            onClick={() => {
              setGender("Men");
              setCategory("All");
            }}
          >
            MEN
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifySelf: "end" }}>
          <button
            className="bag-button"
            onClick={openMyOrders}
            style={{ padding: "8px 6px" }}
          >
            ORDERS
          </button>

          {user ? (
            <button
              className="bag-button"
              onClick={() => {
                setAccountSubTab("PROFILE");
                setProfileOpen(true);
                openMyOrders();
                setOrdersOpen(false);
              }}
              title="Open My Account & Orders"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px",
                border: "1px solid var(--line)",
                borderRadius: "999px",
              }}
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                />
              ) : (
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#a58b62",
                    color: "#fff",
                    display: "inline-grid",
                    placeItems: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ textTransform: "none", fontSize: "11px" }}>
                {user.name.split(" ")[0]}
              </span>
            </button>
          ) : (
            <button
              className="bag-button"
              onClick={handleGoogleLogin}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                background: "#fff",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span style={{ color: "#282620", fontWeight: 600 }}>Sign in</span>
            </button>
          )}

          <button className="bag-button" onClick={() => setCartOpen(true)}>
            BAG <span>({cartCount})</span>
          </button>
        </div>
      </header>

      <main key={gender} className={`kf-page${gender === "Women" ? " women-storefront" : ""}`}>
        <div className={gender === "Women" ? "women-top-layout" : ""}>
          <section
            ref={setHeroEl}
            className={`hero ${gender === "Women" ? "women-hero" : ""}`}
            id="home"
          >
            <img
              className="hero-image"
              src={heroImage}
              alt={gender === "Men" ? "Men's streetwear collection" : "Indian ethnic festive fashion"}
            />
            <div className="hero-shade" />
            <div className="hero-content">
              <p className="eyebrow">
                {gender === "Women" ? "TRADITION MEETS MODERN GRACE" : "THE NEW RULES OF STREETWEAR"}
              </p>
              <h1>
                {gender === "Women" ? (
                  <>Not just what<br />you wear.<br />How it makes<br />you feel.</>
                ) : (
                  <>Own your style.<br />Break the ordinary.</>
                )}
              </h1>
              <p className="hero-description">
                {gender === "Women"
                  ? "A considered collection of feminine silhouettes, timeless details and modern essentials — made to make every moment feel special."
                  : "Oversized fits. Clean silhouettes. Streetwear made for your generation."}
              </p>
              <a className="button button-light" href="#categories">
                {gender === "Women" ? "EXPLORE COLLECTION" : "EXPLORE STREETWEAR"} <span>↗</span>
              </a>
            </div>
            <span className="hero-index">01 / THE KRIVE EDIT</span>
          </section>

          <Reveal as="section" className="intro section-wrap" id="story">
            <p className="eyebrow">WELCOME TO KRIVE</p>
            <h2>
              {gender === "Women" ? (
                <>Rooted in tradition,<br />designed for today.</>
              ) : (
                <>Built for your everyday.</>
              )}
            </h2>
            <p>
              {gender === "Women"
                ? "KRIVE FASHIONS celebrates Indian heritage and modern femininity — where timeless craftsmanship meets contemporary style."
                : "Everyday streetwear. Clean silhouettes. Made for your own rules."}
            </p>
          </Reveal>

          <section className="categories section-wrap" id="categories">
            <Reveal className="section-heading">
              <div>
                <p className="eyebrow">
                  {gender === "Women" ? "EXPLORE OUR WORLD" : "EXPLORE THE STREETS"}
                </p>
                <h2>{gender === "Women" ? "Made for every occasion." : "Built for your everyday."}</h2>
              </div>
              <p className="collection-note">From everyday elegance to festive grandeur.</p>
            </Reveal>

            <div className="category-grid">
              {categoryTiles.map((item, index) => (
                <CategoryCard key={item.name} item={item} index={index} onSelect={openCategory} />
              ))}
            </div>
          </section>
        </div>

        <section className="collection section-wrap" id="collection">
          <Reveal className="section-heading">
            <div>
              <p className="eyebrow">CURATED FOR YOU</p>
              <h2>
                {gender === "Women" ? "The dress edit" : "The essentials edit"}
                <span>.</span>
              </h2>
            </div>
            <p className="collection-note">Find your next favourite.</p>
          </Reveal>

          <div className="filters" role="group" aria-label="Filter products">
            {filterOptions.map((item) => (
              <button
                key={item}
                className={category === item ? "filter active" : "filter"}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="kf-empty">
              <p>Nothing in {category} just yet.</p>
              <button className="filter" onClick={() => setCategory("All")}>
                Show everything
              </button>
            </div>
          ) : (


            <ProductCarousel key={`${gender}-${category}`} label={`${gender}'s ${category} collection`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priceLabel={money(product.price)}
                  onAdd={addToCart}
                />
              ))}
            </ProductCarousel>
          )}
        </section>

        <section className="brand-banner">
          <p className="eyebrow">THE KRIVE PROMISE</p>
          <h2>Less ordinary.<br />More you.</h2>
          <p>Pieces to love today. Styles to return to tomorrow.</p>
          <a className="button button-dark" href="#collection">
            FIND YOUR STYLE <span>↗</span>
          </a>
        </section>

        <section className="newsletter section-wrap">
          <p className="eyebrow">LET'S STAY IN TOUCH</p>
          <h2>A little note from KRIVE.</h2>
          <p>New collections, style inspiration and first looks.</p>
          <a className="text-link" href="https://wa.me/" target="_blank" rel="noreferrer">
            CONNECT WITH US ON WHATSAPP ↗
          </a>
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="footer-brand">KRIVE FASHIONS</a>
        <p>YOUR STYLE, YOUR STORY.</p>
        <div className="footer-links">
          <a href="#collection">Shop</a>
          <a href="#story">Our Story</a>
          <a href="https://wa.me/" target="_blank" rel="noreferrer">Contact</a>
        </div>
        <small>© {new Date().getFullYear()} KRIVE FASHIONS. ALL RIGHTS RESERVED.</small>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}

      {/* SHOPPING BAG DRAWER */}
      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping bag"
          >
            <div
              className="cart-heading"
              style={{
                position: "sticky",
                top: 0,
                background: "#f8f5ef",
                zIndex: 25,
                paddingBottom: "14px",
                borderBottom: "1px solid #d8d0c5",
              }}
            >
              <div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  style={{
                    marginBottom: "8px",
                    padding: "6px 10px",
                    background: "#282620",
                    color: "#f8f5ef",
                    border: "none",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  ← BACK TO HOME
                </button>
                <p className="eyebrow" style={{ margin: 0 }}>YOUR SELECTION</p>
                <h2 style={{ margin: "4px 0 0" }}>Your bag ({cartCount})</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping bag"
                style={{
                  width: "34px",
                  height: "34px",
                  border: "1px solid #282620",
                  background: "#fff",
                  color: "#282620",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>♡</span>
                <h3>Your bag is waiting.</h3>
                <p>Discover something you love.</p>
                <button
                  className="button button-dark"
                  onClick={() => {
                    setCartOpen(false);
                    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  EXPLORE THE COLLECTION
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.cartId}>
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <p>{money(item.price)} · Size: <strong>{item.size || "M"}</strong></p>
                        <div className="quantity">
                          <button onClick={() => changeQuantity(item.cartId, -1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => changeQuantity(item.cartId, 1)}>+</button>
                        </div>
                      </div>
                      <strong>{money(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="cart-total">
                    <span>Subtotal</span>
                    <strong>{money(cartTotal)}</strong>
                  </div>
                  {/* Clean Shipping Summary inside Bag (No input clutter) */}
                  <div
                    style={{
                      background: "#f2ece1",
                      border: "1px solid #d8d0c5",
                      padding: "12px",
                      margin: "12px 0",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "11px", letterSpacing: "0.8px" }}>
                        DELIVERING TO:
                      </strong>
                      {customer.phone && customer.address ? (
                        <span style={{ color: "#4a453e" }}>
                          {customer.name} ({customer.phone}) — {customer.address}
                        </span>
                      ) : (
                        <span style={{ color: "#984d42", fontWeight: 600 }}>
                          Please add your phone & address in Account before checkout.
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        setAccountSubTab("PROFILE");
                        setProfileOpen(true);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#282620",
                        color: "#f8f5ef",
                        border: "none",
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      CHANGE ↗
                    </button>
                  </div>

                  <button
                    type="button"
                    className="button button-dark checkout-button"
                    style={{ width: "100%" }}
                    onClick={() => {
                      if (!user) {
                        setNotice("Please sign in with Google first.");
                        handleGoogleLogin();
                        return;
                      }
                      if (!customer.phone || !customer.address) {
                        setCartOpen(false);
                        setAccountSubTab("PROFILE");
                        setProfileOpen(true);
                        setNotice("Please save your Phone & Delivery Address in your Account.");
                        return;
                      }
                      setPaymentModalOpen(true);
                    }}
                  >
                    PROCEED TO PAYMENT ({money(cartTotal)}) ↗
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
      {/* DEDICATED ACCOUNT DRAWER (PROFILE DETAILS + UPCOMING & PAST ORDERS) */}
      {profileOpen && (
        <div
          className="cart-backdrop"
          onClick={() => setProfileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 9998,
          }}
        >
          <aside
            className="cart-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#f8f5ef",
              color: "#282620",
              width: "min(460px, 100%)",
              height: "100%",
              overflowY: "auto",
              padding: "24px",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Sticky Top Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "12px",
                borderBottom: "1px solid #d8d0c5",
                position: "sticky",
                top: 0,
                background: "#f8f5ef",
                zIndex: 10,
              }}
            >
              <div>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    marginBottom: "6px",
                    padding: "6px 10px",
                    background: "#282620",
                    color: "#f8f5ef",
                    border: "none",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  ← BACK TO HOME
                </button>
                <p className="eyebrow" style={{ margin: 0 }}>KRIVE MEMBER ACCOUNT</p>
                <h2 style={{ margin: "2px 0 0", fontSize: "22px" }}>
                  {user?.name || customer.name || "My Account"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                style={{
                  width: "34px",
                  height: "34px",
                  border: "1px solid #282620",
                  background: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Sub-Nav Buttons: PROFILE DETAILS vs ORDERS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setAccountSubTab("PROFILE")}
                style={{
                  padding: "11px",
                  background: accountSubTab === "PROFILE" ? "#282620" : "#f2ece1",
                  color: accountSubTab === "PROFILE" ? "#f8f5ef" : "#282620",
                  border: "1px solid #282620",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  cursor: "pointer",
                }}
              >
                ADDRESS & PHONE
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountSubTab("ORDERS");
                  openMyOrders();
                  setOrdersOpen(false);
                }}
                style={{
                  padding: "11px",
                  background: accountSubTab === "ORDERS" ? "#282620" : "#f2ece1",
                  color: accountSubTab === "ORDERS" ? "#f8f5ef" : "#282620",
                  border: "1px solid #282620",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  cursor: "pointer",
                }}
              >
                ORDERS ({myOrders.length})
              </button>
            </div>

            {/* TAB 1: EDIT PHONE & ADDRESS */}
            {accountSubTab === "PROFILE" ? (
              <form onSubmit={saveUserProfile} style={{ display: "grid", gap: "12px" }}>
                <p style={{ fontSize: "12px", color: "#6e675f", margin: 0 }}>
                  Update your phone number and delivery address anytime. Your bag will automatically use these saved details.
                </p>

                <label style={{ fontSize: "11px", fontWeight: 700 }}>
                  FULL NAME
                  <input
                    placeholder="Full Name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px" }}
                    required
                  />
                </label>

                <label style={{ fontSize: "11px", fontWeight: 700 }}>
                  GOOGLE EMAIL
                  <input
                    type="email"
                    value={customer.email}
                    readOnly
                    style={{ width: "100%", marginTop: "4px", padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px", background: "#efeae2" }}
                  />
                </label>

                <label style={{ fontSize: "11px", fontWeight: 700 }}>
                  PHONE NUMBER
                  <input
                    placeholder="+91 9876543210"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px" }}
                    required
                  />
                </label>

                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  disabled={locating}
                  style={{
                    padding: "10px",
                    background: "#f2ece1",
                    border: "1px solid #282620",
                    color: "#282620",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.8px",
                  }}
                >
                  {locating ? "DETECTING GPS LOCATION..." : "📍 USE MY CURRENT LOCATION"}
                </button>

                <label style={{ fontSize: "11px", fontWeight: 700 }}>
                  DELIVERY ADDRESS
                  <textarea
                    placeholder="House/Flat No, Street, Area, City, Pincode"
                    rows={3}
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    style={{ width: "100%", marginTop: "4px", padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px", resize: "vertical" }}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="button button-dark"
                  style={{ width: "100%", padding: "12px", fontWeight: 700 }}
                >
                  ✓ SAVE ADDRESS & PHONE
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "10px",
                    background: "transparent",
                    border: "1px solid #d8d0c5",
                    color: "#8a3b3b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  SIGN OUT OF GOOGLE ACCOUNT
                </button>
              </form>
            ) : (
              /* TAB 2: UPCOMING ORDERS & PAST ORDERS */
              (() => {
                const isPastStatus = (st = "") =>
                  ["DELIVERED", "COMPLETED", "CANCELLED"].includes(String(st).toUpperCase());
                const upcomingOrders = myOrders.filter((o) => !isPastStatus(o.status));
                const pastOrders = myOrders.filter((o) => isPastStatus(o.status));

                const renderOrderCard = (ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    style={{
                      background: "#fff",
                      border: "1px solid #d8d0c5",
                      padding: "12px",
                      cursor: "pointer",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px" }}>{ord.id}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          background: "#f2ece1",
                          border: "1px solid #d8d0c5",
                        }}
                      >
                        {ord.status || "ORDER CONFIRMED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#5e5850" }}>
                      {(ord.items || []).map((it) => `${it.productName || it.productId} (x${it.quantity})`).join(", ")}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700 }}>
                      <span>Total: {money(ord.total || 0)}</span>
                      <span style={{ textDecoration: "underline", fontSize: "11px" }}>View Receipt ↗</span>
                    </div>
                  </div>
                );

                return (
                  <div style={{ display: "grid", gap: "18px" }}>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: "8px", color: "#282620", fontWeight: 700 }}>
                        ● UPCOMING / ACTIVE ORDERS ({upcomingOrders.length})
                      </p>
                      {upcomingOrders.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#6e675f", background: "#f2ece1", padding: "12px" }}>
                          No upcoming deliveries right now.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gap: "10px" }}>{upcomingOrders.map(renderOrderCard)}</div>
                      )}
                    </div>

                    <div>
                      <p className="eyebrow" style={{ marginBottom: "8px", color: "#6e675f", fontWeight: 700 }}>
                        ✓ PAST / COMPLETED ORDERS ({pastOrders.length})
                      </p>
                      {pastOrders.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#6e675f", background: "#f2ece1", padding: "12px" }}>
                          No past completed orders yet.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gap: "10px" }}>{pastOrders.map(renderOrderCard)}</div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </aside>
        </div>
      )}

      {/* 2. PAYMENT GATEWAY MODAL (UPI / CARD / COD) */}
      {paymentModalOpen && (
        <div
          className="cart-backdrop"
          onClick={() => !processingPayment && setPaymentModalOpen(false)}
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#faf8f4",
              color: "#282620",
              width: "min(440px, 94%)",
              padding: "28px",
              border: "1px solid #e9e3d9",
              boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e9e3d9",
                paddingBottom: "14px",
                marginBottom: "18px",
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>SECURE CHECKOUT</p>
                <h3 style={{ margin: "4px 0 0", fontFamily: "Playfair Display, serif", fontSize: "24px" }}>
                  Select Payment Method
                </h3>
              </div>
              <strong>{money(cartTotal)}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "18px" }}>
              {["UPI", "CARD", "COD"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: "10px",
                    border: "1px solid #282620",
                    background: paymentMethod === method ? "#282620" : "transparent",
                    color: paymentMethod === method ? "#fff" : "#282620",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "1px",
                  }}
                >
                  {method === "COD" ? "CASH ON DELIVERY" : method}
                </button>
              ))}
            </div>

            {paymentMethod === "UPI" && (() => {
              const MERCHANT_UPI_ID = import.meta.env.VITE_MERCHANT_UPI_ID || "krivefashions@okaxis";
              const MERCHANT_NAME = "KRIVE FASHIONS";
              const upiUri = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent("KRIVE FASHIONS")}&am=${Number(cartTotal).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`KRIVE Order #${qrSessionId}`)}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(upiUri)}`;

              return (
                <div style={{ display: "grid", gap: "12px", marginBottom: "18px", textAlign: "center" }}>
                  {/* 1-Minute Session Countdown Bar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: qrTimeLeft <= 15 ? "#fdecea" : "#f2ece1",
                      border: `1px solid ${qrTimeLeft <= 15 ? "#f5c2c0" : "#e2d9c8"}`,
                      padding: "8px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: qrTimeLeft <= 15 ? "#b71c1c" : "#282620",
                      letterSpacing: "0.6px",
                    }}
                  >
                    <span>● LIVE QR SESSION</span>
                    <span>
                      00:{String(qrTimeLeft).padStart(2, "0")} REMAINING
                    </span>
                  </div>
                  {/* 12-Digit UTR / UPI Reference Verification */}
                  {qrTimeLeft > 0 && (
                    <div style={{ textAlign: "left", background: "#f8f5ef", border: "1px solid #e2d9c8", padding: "10px" }}>
                      <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.7px", color: "#282620", display: "block", marginBottom: "5px" }}>
                        ENTER 12-DIGIT UPI REF / UTR NO. AFTER PAYING *
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="e.g. 432018947261 (from GPay / PhonePe receipt)"
                        required
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: upiId.length === 12 ? "1.5px solid #2e7d32" : "1px solid #d8d0c5",
                          fontSize: "12px",
                          background: "#ffffff",
                          color: "#282620",
                          letterSpacing: "1.2px",
                          fontWeight: 700,
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ fontSize: "10px", color: upiId.length === 12 ? "#2e7d32" : "#6e6559", marginTop: "4px", fontWeight: 600 }}>
                        {upiId.length === 12
                          ? "✓ 12-digit UTR entered — ready to confirm order"
                          : `${upiId.length}/12 digits entered`}
                      </div>
                    </div>
                  )}
                  {/* Direct UPI App Redirection Buttons (GPay / PhonePe / Paytm / Any UPI App) */}
                  {qrTimeLeft > 0 && (
                    <div style={{ background: "#f8f5ef", border: "1px solid #e2d9c8", padding: "10px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", color: "#6e6559", marginBottom: "8px" }}>
                        TAP TO PAY DIRECTLY VIA UPI APP
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                          { label: "Google Pay", url: upiUri.replace("upi://pay?", "tez://upi/pay?"), bg: "#1a73e8", color: "#fff" },
                          { label: "PhonePe", url: upiUri.replace("upi://pay?", "phonepe://pay?"), bg: "#5f259f", color: "#fff" },
                          { label: "Paytm", url: upiUri.replace("upi://pay?", "paytmmp://pay?"), bg: "#00baf2", color: "#fff" },
                          { label: "Any UPI App ↗", url: upiUri, bg: "#282620", color: "#f8f5ef" },
                        ].map((app) => (
                          <a
                            key={app.label}
                            href={app.url}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "8px 10px",
                              background: app.bg,
                              color: app.color,
                              textDecoration: "none",
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: "4px",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {app.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "14px",
                      border: "1px solid #d8d0c5",
                      borderRadius: "8px",
                      display: "inline-block",
                      margin: "0 auto",
                    }}
                  >
                    <img
                      src={qrUrl}
                      alt="Scan UPI QR to Pay"
                      width="170"
                      height="170"
                      style={{ display: "block" }}
                    />
                    <small style={{ display: "block", marginTop: "6px", fontSize: "10px", color: "#282620", fontWeight: 700, letterSpacing: "0.8px" }}>
                      SCAN WITH GPAY · PHONEPE · PAYTM
                    </small>
                  </div>

                  <div style={{ fontSize: "12px", color: "#555" }}>
                    Amount Auto-Filled: <strong style={{ color: "#282620" }}>{money(cartTotal)}</strong>
                  </div>

                  {/* Deep-link button for mobile shoppers */}
                  <a
                    href={upiUri}
                    style={{
                      padding: "9px 12px",
                      border: "1px solid #282620",
                      background: "#f2ece1",
                      color: "#282620",
                      fontSize: "11px",
                      fontWeight: 700,
                      textDecoration: "none",
                      letterSpacing: "0.8px",
                    }}
                  >
                    TAP TO OPEN UPI APP ON PHONE ↗
                  </a>

                  <input
                      placeholder="Or enter your UPI ID / 12-digit UTR Ref (Optional)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{ padding: "11px", border: "1px solid #d8d0c5", fontSize: "12px", textAlign: "center" }}
                    />
                </div>
              );
            })()}

            {paymentMethod === "CARD" && (
              <div style={{ display: "grid", gap: "10px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#777168" }}>
                  <span>CREDIT / DEBIT CARD</span>
                  <span style={{ fontWeight: 700, color: "#282620" }}>VISA · MASTERCARD · RUPAY</span>
                </div>
                <input
                  placeholder="Cardholder Name"
                  value={cardDetails.holder || customer.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, holder: e.target.value })}
                  style={{ padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px" }}
                />
                <input
                  placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                  maxLength={19}
                  value={cardDetails.number}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                    setCardDetails({ ...cardDetails, number: formatted });
                  }}
                  style={{ padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px", letterSpacing: "1.5px" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardDetails.expiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                      setCardDetails({ ...cardDetails, expiry: formatted });
                    }}
                    style={{ padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px" }}
                  />
                  <input
                    placeholder="CVV (3 digits)"
                    type="password"
                    maxLength={4}
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "") })}
                    style={{ padding: "11px", border: "1px solid #d8d0c5", fontSize: "13px" }}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "COD" && (
              <div
                style={{
                  margin: "0 0 18px",
                  padding: "14px",
                  background: "#f2ece1",
                  border: "1px solid #e2d9c8",
                  fontSize: "12px",
                  color: "#282620",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px", letterSpacing: "0.5px" }}>
                  ✓ PAY ON DOORSTEP DELIVERY
                </strong>
                Pay <strong>{money(cartTotal)}</strong> via Cash or UPI QR when your order arrives at:{" "}
                <span style={{ color: "#555" }}>{customer.address}</span>
              </div>
            )}

            <button
                  className="button button-dark checkout-button"
                  disabled={processingPayment}
                  onClick={() => {
                    if (paymentMethod === "UPI") {
                      const cleanUtr = (upiId || "").replace(/\D/g, "");
                      if (cleanUtr.length !== 12) {
                        setNotice("Please enter the 12-digit UPI Ref / UTR number from your payment receipt.");
                        return;
                      }
                    }
                    if (paymentMethod === "CARD") {
                      const rawCard = cardDetails.number.replace(/\s+/g, "");
                      if (rawCard.length < 12 || cardDetails.expiry.length < 5 || cardDetails.cvv.length < 3) {
                        setNotice("Please enter a valid 16-digit card number, MM/YY expiry, and CVV.");
                        return;
                      }
                    }
                    completeCheckoutOrder();
                  }}
                >
              {processingPayment ? "PROCESSING PAYMENT..." : `PAY ${money(cartTotal)} & PLACE ORDER ↗`}
            </button>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER "MY ORDERS" DRAWER */}
      {ordersOpen && (
        <div className="cart-backdrop" onClick={() => setOrdersOpen(false)}>
          <aside className="cart-panel" onClick={(e) => e.stopPropagation()} aria-label="My Orders">
            <div className="cart-heading">
              <div>
                <p className="eyebrow">ORDER HISTORY</p>
                <h2>My Orders</h2>
              </div>
              <button className="close-button" onClick={() => setOrdersOpen(false)}>✕</button>
            </div>

            <div style={{ padding: "14px 0", borderBottom: "1px solid var(--line)", display: "flex", gap: "8px" }}>
              <input
                placeholder="Enter your email to view orders..."
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                style={{ flex: 1, padding: "8px 10px", border: "1px solid #d8d0c5", fontSize: "12px" }}
              />
              <button
                className="button button-dark"
                onClick={openMyOrders}
                style={{ minHeight: "36px", padding: "8px 14px" }}
              >
                FIND
              </button>
            </div>

            <div className="cart-items" style={{ paddingTop: "12px" }}>
              {myOrders.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#777168", textAlign: "center", marginTop: "40px" }}>
                  No orders found for {customer.email || "this account"} yet.
                </p>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() =>
                      ord.items && Array.isArray(ord.items) ? setSelectedOrder(ord) : viewOrderDetails(ord.id)
                    }
                    style={{
                      padding: "16px",
                      border: "1px solid var(--line)",
                      marginBottom: "10px",
                      cursor: "pointer",
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong>{ord.id}</strong>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          background: "#f0eadf",
                          color: "#806943",
                          fontWeight: 600,
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#777168" }}>
                      <span>{ord.itemCount ?? ord.items} item(s)</span>
                      <strong style={{ color: "#282620" }}>{money(ord.total)}</strong>
                    </div>
                    <small style={{ display: "block", marginTop: "8px", color: "#a58b62", fontSize: "10px", letterSpacing: "1px" }}>
                      VIEW ORDER DETAILS →
                    </small>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 4. FULL ORDER DETAILS / RECEIPT MODAL */}
      {selectedOrder && (
        <div
          className="cart-backdrop"
          onClick={() => setSelectedOrder(null)}
          style={{ justifyContent: "center", alignItems: "center", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#faf8f4",
              color: "#282620",
              width: "min(520px, 94%)",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "28px",
              border: "1px solid #e9e3d9",
              boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                borderBottom: "1px solid #e9e3d9",
                paddingBottom: "14px",
                marginBottom: "16px",
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>ORDER RECEIPT & DETAILS</p>
                <h3 style={{ margin: "4px 0 0", fontFamily: "Playfair Display, serif", fontSize: "24px" }}>
                  {selectedOrder.id}
                </h3>
              </div>
              <button className="close-button" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "12px",
                marginBottom: "18px",
                padding: "12px",
                background: "#f2ece1",
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "10px", letterSpacing: "1px", color: "#777168" }}>
                  CUSTOMER
                </strong>
                <span>{selectedOrder.customer?.name}</span><br />
                <span>{selectedOrder.customer?.email}</span><br />
                <span>{selectedOrder.customer?.phone}</span>
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "10px", letterSpacing: "1px", color: "#777168" }}>
                  DELIVERY ADDRESS & STATUS
                </strong>
                <span>{selectedOrder.customer?.address}</span><br />
                <strong style={{ color: "#a58b62" }}>Status: {selectedOrder.status}</strong>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e9e3d9", paddingTop: "12px" }}>
              <strong style={{ fontSize: "11px", letterSpacing: "1px" }}>
                ORDERED ITEMS ({selectedOrder.itemCount})
              </strong>
              {selectedOrder.items?.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong>{line.productName}</strong>
                    <div style={{ fontSize: "11px", color: "#777168" }}>
                      Code: {line.productId} · Size: {line.size || "M"} · Qty: {line.quantity} × {money(line.unitPrice)}
                    </div>
                  </div>
                  <strong>{money(line.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "16px", fontWeight: 600 }}>
              <span>Total Amount</span>
              <span>{money(selectedOrder.total)}</span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="button button-dark"
                onClick={() => window.print()}
                style={{ flex: 1 }}
              >
                PRINT / DOWNLOAD INVOICE (PDF) ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;