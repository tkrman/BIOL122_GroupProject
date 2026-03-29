/**
 * AbyssalShop — script.js
 * Handles:
 *  1. Bioluminescent particle background
 *  2. Custom cursor glow (follows mouse, changes color on hover)
 *  3. Shopping cart (add, remove, count, total)
 *  4. Cart sidebar open/close
 */

/* =====================================================
   1. BIOLUMINESCENT PARTICLE BACKGROUND
   ===================================================== */
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');

  const COLORS = [
    'rgba(0, 240, 255, ALPHA)',   // cyan
    'rgba(0, 255, 136, ALPHA)',   // green
    'rgba(199, 125, 255, ALPHA)', // purple
    'rgba(255, 69, 96, ALPHA)',   // red
  ];

  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomColor(alpha) {
    const tpl = COLORS[Math.floor(Math.random() * COLORS.length)];
    return tpl.replace('ALPHA', alpha.toFixed(2));
  }

  function createParticle() {
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    Math.random() * 2.2 + 0.4,
      vx:   (Math.random() - 0.5) * 0.25,
      vy:   -(Math.random() * 0.35 + 0.05), // drift upward
      life: 0,
      maxLife: Math.random() * 220 + 80,
      colorTpl: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function initParticleList() {
    particles = Array.from({ length: 120 }, createParticle);
    // Spread initial life so they don't all start at once
    particles.forEach(p => { p.life = Math.random() * p.maxLife; });
  }

  function drawParticle(p) {
    const progress = p.life / p.maxLife;
    // Fade in and out
    const alpha = Math.sin(progress * Math.PI) * 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.colorTpl.replace('ALPHA', alpha.toFixed(3));
    ctx.shadowColor = p.colorTpl.replace('ALPHA', (alpha * 0.6).toFixed(3));
    ctx.shadowBlur  = p.r * 6;
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      drawParticle(p);
      if (p.life >= p.maxLife) {
        particles[i] = createParticle();
        particles[i].life = 0;
        particles[i].x = Math.random() * W;
        particles[i].y = H + 10; // respawn at bottom
      }
    });
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  initParticleList();
  animate();
})();


/* =====================================================
   2. CUSTOM CURSOR GLOW
   ===================================================== */
(function initCursor() {
  const glow = document.getElementById('cursor-glow');
  let mx = -100, my = -100;
  let cx = -100, cy = -100;

  // Smooth follow
  function tick() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Expand and change color when hovering interactive elements
  const HOVER_COLORS = {
    cyan:   'radial-gradient(circle, rgba(0,240,255,0.65) 0%, transparent 70%)',
    green:  'radial-gradient(circle, rgba(0,255,136,0.65) 0%, transparent 70%)',
    purple: 'radial-gradient(circle, rgba(199,125,255,0.65) 0%, transparent 70%)',
    red:    'radial-gradient(circle, rgba(255,69,96,0.65) 0%, transparent 70%)',
    default:'radial-gradient(circle, rgba(0,240,255,0.55) 0%, transparent 70%)',
  };

  function getCursorColor(el) {
    if (!el) return 'default';
    if (el.matches('.btn-cyan, .glow-btn-cyan, .nav-link.glow-cyan, .checkout-btn')) return 'cyan';
    if (el.matches('.btn-green,  .nav-link.glow-green'))  return 'green';
    if (el.matches('.btn-purple, .nav-link.glow-purple')) return 'purple';
    if (el.matches('.btn-red,    .nav-link.glow-red'))    return 'red';
    if (el.closest('.card.featured'))    return 'cyan';
    if (el.closest('.card.deal'))        return 'green';
    if (el.closest('.card.new-arrival')) return 'purple';
    if (el.closest('.card.low-stock'))   return 'red';
    return 'default';
  }

  document.addEventListener('mouseover', e => {
    const color = getCursorColor(e.target);
    glow.style.background = HOVER_COLORS[color];
    const isInteractive = e.target.matches('button, a, [role="button"]');
    glow.style.width  = isInteractive ? '44px' : '28px';
    glow.style.height = isInteractive ? '44px' : '28px';
  });

  tick();
})();


/* =====================================================
   3. SHOPPING CART
   ===================================================== */
const cart = (() => {
  const items = {}; // { name: { price, qty } }

  const countEl     = document.getElementById('cart-count');
  const itemsEl     = document.getElementById('cart-items');
  const emptyEl     = document.getElementById('cart-empty');
  const totalEl     = document.getElementById('cart-total-price');

  function totalQty() {
    return Object.values(items).reduce((s, v) => s + v.qty, 0);
  }

  function totalPrice() {
    return Object.values(items).reduce((s, v) => s + v.price * v.qty, 0);
  }

  function render() {
    // Update count badge
    const qty = totalQty();
    countEl.textContent = qty;
    countEl.style.background = qty > 0 ? 'var(--cyan)' : '';

    // Rebuild list
    itemsEl.innerHTML = '';
    const names = Object.keys(items);
    if (names.length === 0) {
      itemsEl.appendChild(emptyEl);
      emptyEl.style.display = '';
    } else {
      emptyEl.style.display = 'none';
      names.forEach(name => {
        const { price, qty } = items[name];
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <span class="cart-item-name">${escHtml(name)}</span>
          <span class="cart-item-qty">×${qty}</span>
          <span class="cart-item-price">$${(price * qty).toFixed(2)}</span>
          <button class="remove-item" data-name="${escHtml(name)}" aria-label="Remove ${escHtml(name)}">✕</button>
        `;
        itemsEl.appendChild(li);
      });
    }

    // Update total
    totalEl.textContent = '$' + totalPrice().toFixed(2);
  }

  function add(name, price) {
    if (items[name]) {
      items[name].qty++;
    } else {
      items[name] = { price: parseFloat(price), qty: 1 };
    }
    render();
  }

  function remove(name) {
    delete items[name];
    render();
  }

  // Delegate remove-item clicks
  itemsEl.addEventListener('click', e => {
    const btn = e.target.closest('.remove-item');
    if (btn) remove(btn.dataset.name);
  });

  return { add, remove };
})();


/* =====================================================
   4. ADD-TO-CART BUTTON LISTENERS
   ===================================================== */
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const { name, price } = btn.dataset;
    cart.add(name, price);

    // Flash the parent card
    const card = btn.closest('.card');
    card.classList.remove('added-flash');
    void card.offsetWidth; // reflow to restart animation
    card.classList.add('added-flash');
    card.addEventListener('animationend', () => card.classList.remove('added-flash'), { once: true });

    // Brief button feedback
    const orig = btn.textContent;
    btn.textContent = '✓ Added';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 900);

    // Open cart sidebar
    openCart();
  });
});


/* =====================================================
   5. CART SIDEBAR OPEN / CLOSE
   ===================================================== */
const sidebar = document.getElementById('cart-sidebar');
const overlay = document.getElementById('cart-overlay');
const cartBtn  = document.getElementById('cart-btn');
const closeBtn = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');

function openCart() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeCart() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

cartBtn.addEventListener('click',   openCart);
closeBtn.addEventListener('click',  closeCart);
overlay.addEventListener('click',   closeCart);

checkoutBtn.addEventListener('click', () => {
  alert('🌊 Thank you for shopping at AbyssalShop!\nYour order has drifted into the deep…');
  closeCart();
});

// Keyboard accessibility: close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});


/* =====================================================
   UTILITY
   ===================================================== */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
