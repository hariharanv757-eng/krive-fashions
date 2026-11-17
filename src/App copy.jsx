import AdminDashboard from "./admin/AdminDashboard";
import { useEffect, useMemo, useState } from "react";
import CategoryCard from "./components/CategoryCard";
import PageLoader from "./components/PageLoader";
import ProductCard from "./components/ProductCard";
import ProductCarousel from "./components/ProductCarousel";
import Reveal from "./components/Reveal";
import useParallax from "./hooks/useParallax";
import useScrolled from "./hooks/useScrolled";
import "./App.css";


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
  }).format(amount);

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

/*
  App is a thin router. The storefront lives in <Storefront /> so its hooks are
  never called conditionally (the old early `return <AdminDashboard />` sat
  above the hooks, which breaks React's Rules of Hooks).
*/
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

  const [selectedSizes] = useState({});
  const [selectedColors] = useState({});

  const [heroEl, setHeroEl] = useState(null);
  useParallax(heroEl);
  const scrolled = useScrolled(24);

  useEffect(() => {
    document.body.classList.toggle("men-theme", gender === "Men");

    return () => {
      document.body.classList.remove("men-theme");
    };
  }, [gender]);

  // The bag notice used to stay on screen forever; clear it after a moment.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeProducts = gender === "Women" ? products : menProducts;
  const filterOptions = gender === "Women" ? WOMEN_FILTERS : MEN_FILTERS;
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
    const size = selectedSizes[product.id] || "M";
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

    setNotice(`${product.name} added to your bag`);
  }

  // Matches on cartId (the unique cart line), not product id — two sizes of the
  // same product are separate lines and must not change each other.
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
          <a
            href="#collection"
            onClick={() => {
              // "Dresses" has no products of its own, so it used to show an empty grid.
              setCategory("All");
              setMobileMenu(false);
            }}
          >
            Dresses
          </a>
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

        <button className="bag-button" onClick={() => setCartOpen(true)}>
          BAG <span>({cartCount})</span>
        </button>
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

          <p className="sample-note">
            Sample collection · Product names, prices and images are for
            demonstration. Replace them with your real inventory.
          </p>
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

      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
            aria-label="Shopping bag"
          >
            <div className="cart-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>Your bag ({cartCount})</h2>
              </div>
              <button
                className="close-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close shopping bag"
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
                        <p>{money(item.price)}</p>
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
                  <p>Shipping and taxes calculated at checkout.</p>
                  <button
                    className="button button-dark checkout-button"
                    onClick={() => setNotice("Checkout will be added in Phase 3.")}
                  >
                    CONTINUE TO CHECKOUT ↗
                  </button>
                  <p className="demo-note">Demo only · No order or payment has been placed.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
