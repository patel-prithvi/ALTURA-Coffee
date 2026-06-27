/**
 * ALTURA COFFEE - Core Engine
 * Professional Vanilla JS Refactor
 */

// --- Global State ---
const state = {
    cart: JSON.parse(localStorage.getItem('altura_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('altura_wishlist')) || [],
    // Check if user is logged in via localStorage
    isLoggedIn: localStorage.getItem('altura_logged_in') === 'true',
    activeCategory: 'all',
    searchTerm: ''
};

// --- DOM Selectors ---
const dom = {
    header: document.querySelector('.header'),
    navLinks: document.querySelector('.nav-links'),
    cartCount: document.getElementById('cart-count'),
    searchInput: document.getElementById('searchInput'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    products: document.querySelectorAll('.coffee-card'),
    newsletterForm: document.querySelector('.newsletter form'),
    cartContainer: document.getElementById('cart-items-container'),
    cartTotal: document.getElementById('cart-total-amount'),
    mobileToggle: document.querySelector('.mobile-toggle') || createMobileToggle()
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initCore();
    updateAuthUI();
    if (document.querySelector('.coffee-grid')) initMenuFilters();
    if (document.getElementById('cart-items-container')) initCartPage();
    if (document.querySelector('.hero')) initAnimations();
    updateUI();
});

// --- Authentication Logic ---

function updateAuthUI() {
    const navRight = document.querySelector('.nav-right');
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');

    if (state.isLoggedIn) {
        // Hide Login/Signup
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        // Add Logout and Profile icon if not already there
        if (!document.querySelector('.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'login-btn logout-btn';
            logoutBtn.innerHTML = 'Logout';
            logoutBtn.onclick = handleLogout;
            navRight.insertBefore(logoutBtn, document.querySelector('.cart-btn'));
        }
    }
}

function handleLogout() {
    localStorage.removeItem('altura_logged_in');
    window.location.reload();
}

// --- Core Functions ---
function initCore() {
    // Sticky Header
    window.addEventListener('scroll', () => {
        dom.header.classList.toggle('sticky', window.scrollY > 50);
    });

    // Mobile Navigation
    dom.mobileToggle.addEventListener('click', () => {
        dom.navLinks.classList.toggle('active');
    });

    // Delegate Cart/Wishlist clicks (Performance optimization)
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-cart');
        const wishBtn = e.target.closest('.wishlist');

        if (addBtn) handleAddToCart(addBtn);
        if (wishBtn) handleWishlist(wishBtn);
    });

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function createMobileToggle() {
    const btn = document.createElement('button');
    btn.className = 'mobile-toggle';
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    document.querySelector('.nav-right').prepend(btn);
    return btn;
}

// --- Cart Logic ---
function handleAddToCart(btn) {
    const card = btn.closest('.coffee-card') || btn.closest('.popular-card');
    const product = {
        id: card.querySelector('h3').textContent,
        name: card.querySelector('h3').textContent,
        price: parseInt(card.querySelector('.coffee-bottom h4, .price, span').textContent.replace('₹', '')),
        image: card.querySelector('img').src,
        qty: 1
    };

    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        state.cart.push(product);
    }

    saveState();
    updateUI();
    showToast(`Added ${product.name} to bag`);
    
    // UI Feedback
    const icon = btn.querySelector('i');
    icon.className = 'fa-solid fa-check';
    setTimeout(() => icon.className = 'fa-solid fa-plus', 1000);
}

// --- Menu Filtering (Fixes Bug 1 & 2) ---
function initMenuFilters() {
    if (dom.searchInput) {
        dom.searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value.toLowerCase();
            applyFilters();
        });
    }

    dom.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeCategory = btn.textContent.trim().toLowerCase();
            applyFilters();
        });
    });
}

function applyFilters() {
    dom.products.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const category = card.dataset.category ? card.dataset.category.toLowerCase() : 'all';
        
        const matchesSearch = title.includes(state.searchTerm);
        const matchesCategory = state.activeCategory === 'all' || category === state.activeCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
            card.classList.add('fade-up');
        } else {
            card.style.display = 'none';
        }
    });
}

// --- Cart Page Rendering ---
function initCartPage() {
    renderCart();

    const checkoutBtn = document.getElementById('checkout-proceed-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            if (!state.isLoggedIn) {
                e.preventDefault();
                // Store intended destination
                localStorage.setItem('redirect_after_login', 'checkout.html');
                showToast("Please login to continue", "error");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                window.location.href = 'checkout.html';
            }
        });
    }
}

function renderCart() {
    if (!dom.cartContainer) return;
    
    if (state.cart.length === 0) {
        dom.cartContainer.innerHTML = `<div class="empty-cart">
            <i class="fa-solid fa-mug-hot"></i>
            <p>Your bag is empty. Let's fill it with coffee!</p>
            <a href="menu.html" class="primary-btn">Browse Menu</a>
        </div>`;
        dom.cartTotal.textContent = '₹0';
        return;
    }

    let html = '';
    let total = 0;

    state.cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>₹${item.price}</p>
                </div>
                <div class="item-qty">
                    <button onclick="updateQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="updateQty(${index}, 1)">+</button>
                </div>
                <div class="item-subtotal">₹${subtotal}</div>
                <button class="remove-item" onclick="removeItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    });

    dom.cartContainer.innerHTML = html;
    dom.cartTotal.textContent = `₹${total}`;
    
    // Save total for checkout
    localStorage.setItem('altura_order_total', total);
}

window.updateQty = (index, delta) => {
    state.cart[index].qty += delta;
    if (state.cart[index].qty < 1) return removeItem(index);
    saveState();
    renderCart();
    updateUI();
};

window.removeItem = (index) => {
    state.cart.splice(index, 1);
    saveState();
    renderCart();
    updateUI();
};

// --- Wishlist Logic (Bug 4) ---
function handleWishlist(btn) {
    const card = btn.closest('.coffee-card');
    const id = card.querySelector('h3').textContent;
    const icon = btn.querySelector('i');

    if (state.wishlist.includes(id)) {
        state.wishlist = state.wishlist.filter(item => item !== id);
        icon.className = 'fa-regular fa-heart';
    } else {
        state.wishlist.push(id);
        icon.className = 'fa-solid fa-heart';
        icon.style.color = 'var(--danger)';
    }
    saveState();
}

// --- Utilities ---
function saveState() {
    localStorage.setItem('altura_cart', JSON.stringify(state.cart));
    localStorage.setItem('altura_wishlist', JSON.stringify(state.wishlist));
}

function updateUI() {
    // Update cart count
    if (dom.cartCount) {
        const totalItems = state.cart.reduce((acc, item) => acc + item.qty, 0);
        dom.cartCount.textContent = totalItems;
    }

    // Persist Wishlist hearts
    document.querySelectorAll('.coffee-card').forEach(card => {
        const id = card.querySelector('h3').textContent;
        const heart = card.querySelector('.wishlist i');
        if (heart && state.wishlist.includes(id)) {
            heart.className = 'fa-solid fa-heart';
            heart.style.color = 'var(--danger)';
        }
    });
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section, .coffee-card').forEach(el => observer.observe(el));
}
