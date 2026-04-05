(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');

  const COLORS = [
    'rgba(0, 240, 255, ALPHA)',
    'rgba(0, 255, 136, ALPHA)',
    'rgba(199, 125, 255, ALPHA)',
    'rgba(255, 69, 96, ALPHA)',
  ];

  let W, H, particles;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.35 + 0.05),
      life: 0,
      maxLife: Math.random() * 220 + 80,
      colorTpl: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function initParticlesList() {
    particles = Array.from({ length: 120 }, createParticle);
    particles.forEach(p => (p.life = Math.random() * p.maxLife));
  }

  function drawParticle(p) {
    const progress = p.life / p.maxLife;
    const alpha = Math.sin(progress * Math.PI) * 0.7;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.colorTpl.replace('ALPHA', alpha.toFixed(3));
    ctx.shadowColor = p.colorTpl.replace('ALPHA', (alpha * 0.6).toFixed(3));
    ctx.shadowBlur = p.r * 6;
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
        particles[i].y = H + 10;
      }
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  initParticlesList();
  animate();
})();

(function initCursor() {
  const glow = document.getElementById('cursorGlow');
  let mx = -100, my = -100;
  let cx = -100, cy = -100;

  function tick() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  tick();
})();

const sidebar = document.getElementById('cartSidebar');
const overlay = document.getElementById('cartOverlay');
const cartButton = document.getElementById('cartButton');
const closeButton = document.getElementById('closeCartButton');
const checkoutButton = document.getElementById('checkoutButton');

const cart = (() => {
  const items = {};

  const countElement = document.getElementById('cartCount');
  const itemsElement = document.getElementById('cartItems');
  const emptyElement = document.getElementById('cartEmpty');
  const totalElement = document.getElementById('cartTotalCost');

  function totalQty() {
    return Object.values(items).reduce((s, v) => s + v.qty, 0);
  }

  function totalPrice() {
    return Object.values(items).reduce((s, v) => s + v.price * v.qty, 0);
  }

  function updateCartGlow() {
    const count = totalQty();

    cartButton.classList.remove('idlePulse','glowLow','glowMid','glowHigh');

    if (count > 0) {
      cartButton.classList.add('idlePulse');

      const speed =
        count < 3 ? 0.8 :
        count < 6 ? 0.5 :
                    0.3;

      cartButton.style.animationDuration = speed + 's';

      if (count < 3) cartButton.classList.add('glowLow');
      else if (count < 6) cartButton.classList.add('glowMid');
      else cartButton.classList.add('glowHigh');
    }
  }

  function render() {
    const qty = totalQty();
    countElement.textContent = qty;
    itemsElement.innerHTML = '';

    if (qty === 0) {
      itemsElement.appendChild(emptyElement);
      emptyElement.style.display = '';
    } else {
      emptyElement.style.display = 'none';

      Object.keys(items).forEach(name => {
        const { price, qty } = items[name];
        const li = document.createElement('li');
        li.className = 'cartItem';
        li.innerHTML = `
          <span>${name}</span>
          <span>×${qty}</span>
          <span>$${(price * qty).toFixed(2)}</span>
          <button class="removeItem" data-name="${name}">✕</button>
        `;
        itemsElement.appendChild(li);
      });
    }

    totalElement.textContent = '$' + totalPrice().toFixed(2);
    updateCartGlow();
  }

  function add(name, price) {
    if (items[name]) items[name].qty++;
    else items[name] = { price: parseFloat(price), qty: 1 };
    render();
  }

  function remove(name) {
    delete items[name];
    render();
  }

  itemsElement.addEventListener('click', e => {
    const btn = e.target.closest('.removeItem');
    if (btn) remove(btn.dataset.name);
  });

  return { add };
})();

document.querySelectorAll('.addButton').forEach(btn => {
  btn.addEventListener('click', () => {
    const { name, price } = btn.dataset;
    cart.add(name, price);

    const dim = document.getElementById('addDim');
    dim.classList.add('active');
    setTimeout(() => dim.classList.remove('active'), 600);

    openCart();
  });
});

function openCart() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  cartButton.style.right = 'calc(min(400px, 92vw) + 20px)';
}

function closeCart() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  cartButton.style.right = '20px';

}

cartButton.addEventListener('click', openCart);
closeButton.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

checkoutButton.addEventListener('click', () => {
  alert('Thank you! Your order has been placed.');
  closeCart();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});
