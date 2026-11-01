/**
 * KFC Việt Nam - Application Logic
 * Integrates Markdown data (.md) and Images folder.
 */

// 1. EMBEDDED FALLBACK DATA (Guarantees zero-error execution even on file:// protocol)
const DEFAULT_MD_MENU = `id,name,category,price,description,badge,image_type
kfc-01,Combo Gà Vui Vẻ,combo,89000,2 Miếng Gà Rán + 1 Khoai Tây Chiên Vừa + 1 Pepsi,Bán chạy,combo
kfc-02,Gà Rán Giòn Cay,ga-ran,38000,Gà rán chuẩn vị giòn tan ướp gia vị đậm đà,Hot,chicken
kfc-03,Gà Truyền Thống,ga-ran,38000,Gà rán công thức 11 loại thảo mộc huyền thoại,Mới,chicken
kfc-04,Burger Zinger,burger,54000,Burger phi lê gà giòn kèm sốt mayonnaise và xà lách,Bán chạy,burger
kfc-05,Burger tôm,burger,45000,Burger nhân tôm chiên xù xốt tỏi ớt thơm ngon,,burger
kfc-06,Khoai Tây Chiên (L),combo,35000,Khoai tây chiên vàng giòn kích thước lớn,,side
kfc-07,Pepsi Không Calo,nuoc-uong,19000,Nước ngọt có gas Pepsi Zero 500ml,,drink
kfc-08,Trà Đào Hạt Chia,nuoc-uong,29000,Trà đào thanh mát kết hợp hạt chia bổ dưỡng,Mới,drink`;

const DEFAULT_MD_ABOUT = `# Giới Thiệu Về KFC Việt Nam

## 1. Câu Chuyện Thương Hiệu - Đại Tá Harland Sanders

KFC (Kentucky Fried Chicken) là chuỗi nhà hàng thức ăn nhanh chuyên về gà rán nổi tiếng nhất thế giới. Thương hiệu được sáng lập bởi **Đại tá Harland Sanders** vào thập niên 1930 tại Corbin, bang Kentucky, Hoa Kỳ.

Với niềm đam mê nấu nướng và sự kiên trì phi thường, Đại tá Sanders đã sáng tạo nên công thức gà rán độc nhất vô nhị sử dụng **11 loại thảo mộc và gia vị bí mật**, kết hợp cùng kỹ thuật chiên đặc biệt giúp miếng gà giữ trọn vẹn vị ngọt mềm tự nhiên bên trong và lớp da vàng ươm giòn rụm bên ngoài.

> *"Vị ngon trên từng ngón tay" (Finger Lickin' Good) không chỉ là khẩu hiệu, mà là lời cam kết vàng về chất lượng món ăn suốt gần một thế kỷ qua.*

---

## 2. Bí Quyết Làm Nên Hương Vị Huyền Thoại

- **100% Gà Tươi Chuẩn VietGAP**: Nguồn thịt gà được kiểm định nghiêm ngặt từ các trang trại uy tín hàng đầu, đảm bảo độ tươi mới mỗi ngày.
- **Công Thức 11 Loại Thảo Mộc**: Sự kết hợp tinh tế giữa tiêu đen, ớt bột, muối biển và các loại gia vị tự nhiên tạo nên hương thơm khó cưỡng.
- **Kỹ Thuật Chiên Áp Suất Độc Quyền**: Giúp giảm thiểu lượng dầu thừa, giữ trọn độ ẩm và chất dinh dưỡng của từng thớ thịt.
- **Tiêu Chuẩn Vệ Sinh An Toàn Thực Phẩm**: Quy trình chế biến khép kín tuân thủ tiêu chuẩn quốc tế HACCP và ISO 22000.

---

## 3. Hành Trình KFC Tại Việt Nam

Năm 1997, KFC chính thức khai trương nhà hàng đầu tiên tại Thành phố Hồ Chí Minh, trở thành một trong những thương hiệu ẩm thực quốc tế tiên phong tại thị trường Việt Nam.

Trải qua hơn 25 năm phát triển, KFC đã có mặt tại hơn **32 tỉnh thành** với hơn **180 nhà hàng** hiện đại. KFC không ngừng sáng tạo để kết hợp phong vị ẩm thực quốc tế với khẩu vị người Việt, mang đến những món ăn được hàng triệu gia đình và giới trẻ yêu thích.`;

const DEFAULT_MD_PROMO = `# Chương Trình Ưu Đãi & Khuyến Mãi KFC

## 1. Các Combo Ưu Đãi Hot Nhất Hôm Nay

| Tên Combo | Giá Gốc | Giá Ưu Đãi | Tiết Kiệm | Quà Tặng Kèm |
| :--- | :--- | :--- | :--- | :--- |
| **Combo Gà Vui Vẻ** | 115.000đ | **89.000đ** | 23% | 1 Pepsi mát lạnh + 1 Khoai tây chiên |
| **Combo Zinger Đỉnh Cao** | 95.000đ | **79.000đ** | 17% | 1 Pepsi Không Calo + 1 Bánh trứng |
| **Đại Tiệc Gà Giòn (4 người)**| 320.000đ | **249.000đ**| 22% | 4 Pepsi + 2 Khoai tây chiên lớn |

---

## 2. Mã Voucher Giảm Giá Độc Quyền

Nhập mã ưu đãi khi thanh toán hoặc đặt qua tổng đài:

- \`KFCFREESHIP\`: Miễn phí giao hàng cho mọi đơn từ **150.000đ** (bán kính 5km).
- \`KFC20K\`: Giảm ngay **20.000đ** cho đơn hàng có giá trị từ **100.000đ**.
- \`CHICKENLOVE\`: Tặng ngay **01 ly Pepsi 500ml** khi mua bất kỳ phần Gà Rán Giòn Cay hoặc Gà Truyền Thống.
- \`APPNEW\`: Giảm **15%** cho khách hàng lần đầu đặt món trực tuyến.

---

## 3. Khung Giờ Vàng "Happy Hour"

- **Giờ trưa tiết kiệm (11:00 - 13:30)**: Mua Combo trưa đồng giá chỉ **49.000đ**.
- **Tiệc trà chiều vui vẻ (14:30 - 17:00)**: Giảm 50% cho ly nước thứ 2 (Pepsi, Trà Đào Hạt Chia).
- **Thứ Ba Ăn Thả Ga**: Mua 1 miếng gà giòn cay tặng ngay 1 miếng cùng loại.`;

const DEFAULT_MD_POLICY = `# Chính Sách Giao Hàng & Đặt Món KFC

## 1. Cam Kết Giao Hàng 30 Phút Nóng Giòn

- **Thời gian giao hàng**: Cam kết giao hàng tận nơi trong vòng **30 phút** kể từ thời điểm tiếp nhận đơn thành công.
- **Bao bì giữ nhiệt chuyên dụng**: Thức ăn luôn được đóng gói trong túi giữ nhiệt công nghệ cao, giữ nguyên độ giòn rụm của gà và độ ấm nóng của khoai tây.
- **Thời gian phục vụ giao hàng**: Từ **09:00 đến 21:30** tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và ngày lễ).

---

## 2. Biểu Phí Vận Chuyển

| Khoảng Cách | Phí Giao Hàng | Áp Dụng Miễn Phí |
| :--- | :--- | :--- |
| **Dưới 3 km** | 15.000đ | Miễn phí cho đơn từ 100.000đ |
| **Từ 3 - 5 km** | 20.000đ | Miễn phí cho đơn từ 150.000đ (dùng mã \`KFCFREESHIP\`) |
| **Trên 5 km** | 25.000đ - 35.000đ | Hỗ trợ 50% phí ship cho đơn từ 250.000đ |

---

## 3. Chính Sách Đổi Trả & Hỗ Trợ Khách Hàng

- **Kiểm tra món ăn**: Khách hàng được quyền đồng kiểm tra số lượng và tình trạng sản phẩm với nhân viên giao hàng trước khi thanh toán.
- **Hỗ trợ đổi món**: Nếu phát hiện giao sai món hoặc thiếu món, KFC sẽ lập tức giao bù miễn phí trong vòng 20 phút.
- **Đường dây nóng khiếu nại**: Tổng đài Chăm sóc khách hàng **1900 6886** sẵn sàng lắng nghe mọi góp ý từ Quý khách.`;

// Image mappings based on image_type or id with local priority & high-res fallbacks
const IMAGE_CONFIG = {
  localOverrides: {
    'kfc-06': 'images/products/khoai-tay-chien.jpg',
    'kfc-01': 'images/products/combo-ga-vui-ve.jpg',
    'kfc-08': 'Tra Dao/images.jpg'
  },
  typeFallbacks: {
    combo: 'images/products/combo-ga-vui-ve.jpg',
    chicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=700&q=80',
    burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    side: 'images/products/khoai-tay-chien.jpg',
    drink: 'Tra Dao/images.jpg'
  },
  idFallbacks: {
    'kfc-01': 'images/products/combo-ga-vui-ve.jpg',
    'kfc-02': 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80',
    'kfc-03': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=700&q=80',
    'kfc-04': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    'kfc-05': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80',
    'kfc-06': 'images/products/khoai-tay-chien.jpg',
    'kfc-07': 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=700&q=80',
    'kfc-08': 'Tra Dao/images.jpg'
  }
};

// 2. APPLICATION STATE
const AppState = {
  rawMenuMarkdown: DEFAULT_MD_MENU,
  documents: {
    'd_li_u_menu_m_n_n_kfc.md': DEFAULT_MD_MENU,
    'gioi_thieu.md': DEFAULT_MD_ABOUT,
    'khuyen_mai.md': DEFAULT_MD_PROMO,
    'chinh_sach.md': DEFAULT_MD_POLICY
  },
  activeDoc: 'd_li_u_menu_m_n_n_kfc.md',
  currentDocViewMode: 'html', // 'html' or 'raw'
  products: [],
  filteredProducts: [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  cart: [],
  discountAmount: 0,
  activePromoCode: '',
  shippingFee: 15000,
  selectedProductForModal: null
};

// 3. PARSERS (Dual-mode Markdown & CSV parsers)
function parseCsvMenu(csvContent) {
  if (!csvContent || typeof csvContent !== 'string') return [];
  
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // CSV split taking basic commas into account
    const values = row.split(',').map(v => v.trim());
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });

    if (obj.id && obj.name) {
      items.push({
        id: obj.id,
        name: obj.name,
        category: obj.category || 'other',
        price: parseInt(obj.price, 10) || 0,
        description: obj.description || '',
        badge: obj.badge || '',
        image_type: obj.image_type || 'chicken',
        image: resolveProductImage(obj.id, obj.image_type)
      });
    }
  }

  return items;
}

function resolveProductImage(id, imageType) {
  if (IMAGE_CONFIG.localOverrides[id]) {
    return IMAGE_CONFIG.localOverrides[id];
  }
  if (IMAGE_CONFIG.idFallbacks[id]) {
    return IMAGE_CONFIG.idFallbacks[id];
  }
  if (IMAGE_CONFIG.typeFallbacks[imageType]) {
    return IMAGE_CONFIG.typeFallbacks[imageType];
  }
  return 'images/hero-bucket.jpg';
}

// Built-in Lightweight Markdown to HTML (Offline resilient)
function renderMarkdownToHtml(mdText) {
  if (window.marked && typeof window.marked.parse === 'function') {
    return window.marked.parse(mdText);
  }

  // Fallback Vanilla Markdown Parser
  let html = mdText
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks & inline code
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Tables
    .replace(/\|(.+)\|/gim, function (match) {
      const cells = match.split('|').filter(c => c.trim().length > 0);
      if (cells.some(c => c.includes('---'))) return '';
      const cellHtml = cells.map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cellHtml}</tr>`;
    })
    // Paragraphs
    .replace(/\n\n+/gim, '</p><p>');

  return `<div class="markdown-body"><p>${html}</p></div>`;
}

// 4. DATA INITIALIZATION & LOADING
async function initData() {
  const statusPill = document.getElementById('dataSourceStatus');
  const statusMsg = document.getElementById('dataSourceMsg');

  try {
    // Attempt dynamic fetch from local files
    const response = await fetch('d_li_u_menu_m_n_n_kfc.md', { cache: 'no-store' });
    if (response.ok) {
      const text = await response.text();
      AppState.rawMenuMarkdown = text;
      AppState.documents['d_li_u_menu_m_n_n_kfc.md'] = text;

      // Try fetching companion files if possible
      tryFetchCompanionFile('gioi_thieu.md');
      tryFetchCompanionFile('khuyen_mai.md');
      tryFetchCompanionFile('chinh_sach.md');

      if (statusPill) {
        statusPill.innerHTML = '<i class="bi bi-filetype-md"></i> Đã tải từ d_li_u_menu_m_n_n_kfc.md';
        statusPill.className = 'data-source-pill';
      }
    } else {
      throw new Error('Local file fetch returned non-ok status');
    }
  } catch (err) {
    // Graceful fallback for file:// protocol or offline mode
    console.info('Using embedded fallback for markdown data (file:// origin or offline):', err.message);
    if (statusPill) {
      statusPill.innerHTML = '<i class="bi bi-check-circle-fill"></i> Dữ liệu chuẩn Markdown KFC';
      statusPill.className = 'data-source-pill';
    }
  }

  // Parse products from menu markdown
  AppState.products = parseCsvMenu(AppState.rawMenuMarkdown);
  AppState.filteredProducts = [...AppState.products];

  if (statusMsg) {
    statusMsg.innerHTML = `Đã đồng bộ <strong>${AppState.products.length} món ăn</strong> từ cấu trúc bảng Markdown & thư mục Images.`;
  }

  // Render initial components
  renderMenu();
  renderMarkdownViewer();
  updateCartUI();
}

async function tryFetchCompanionFile(filename) {
  try {
    const res = await fetch(filename, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      AppState.documents[filename] = text;
      if (AppState.activeDoc === filename) {
        renderMarkdownViewer();
      }
    }
  } catch (e) {
    // Keep embedded fallback
  }
}

// 5. MENU RENDERING & FILTERING
function renderMenu() {
  const container = document.getElementById('productGrid');
  const countBadge = document.getElementById('menuItemCount');

  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${AppState.filteredProducts.length} món`;
  }

  if (AppState.filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="p-5 bg-white rounded-4 shadow-sm border">
          <i class="bi bi-search text-danger fs-1 mb-3"></i>
          <h4 class="fw-bold">Không tìm thấy món ăn phù hợp</h4>
          <p class="text-muted mb-4">Hãy thử tìm với từ khóa khác hoặc bấm xem tất cả danh mục.</p>
          <button class="btn btn-kfc-primary" onclick="resetFilters()">
            <i class="bi bi-arrow-repeat me-2"></i>Xem Tất Cả Món
          </button>
        </div>
      </div>
    `;
    return;
  }

  const html = AppState.filteredProducts.map(p => {
    let badgeHtml = '';
    if (p.badge) {
      let badgeClass = 'badge-best-seller';
      if (p.badge.toLowerCase().includes('hot')) badgeClass = 'badge-hot';
      if (p.badge.toLowerCase().includes('mới') || p.badge.toLowerCase().includes('new')) badgeClass = 'badge-new';
      badgeHtml = `<span class="product-badge-flag ${badgeClass}"><i class="bi bi-fire me-1"></i>${p.badge}</span>`;
    }

    const categoryNames = {
      'combo': 'Combo Đặc Biệt',
      'ga-ran': 'Gà Rán Giòn',
      'burger': 'Hamburger',
      'nuoc-uong': 'Thức Uống'
    };
    const catLabel = categoryNames[p.category] || 'Món Ăn Kèm';

    return `
      <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
        <div class="product-card">
          <div class="card-img-holder">
            ${badgeHtml}
            <span class="badge-category-tag">${catLabel}</span>
            <img src="${p.image}" 
                 alt="${p.name}" 
                 class="card-product-img" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='images/products/khoai-tay-chien.jpg';">
          </div>
          <div class="card-content-body">
            <h3 class="card-product-title">${p.name}</h3>
            <p class="card-product-desc">${p.description}</p>
            <div class="card-footer-action">
              <div>
                <span class="card-price-val">${p.price.toLocaleString('vi-VN')} đ</span>
              </div>
              <div class="card-btn-group">
                <button class="btn-detail-quick" title="Xem chi tiết" onclick="openProductModal('${p.id}')">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn-add-cart" onclick="addToCart('${p.id}')">
                  <i class="bi bi-cart-plus"></i> Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function filterProducts() {
  let list = [...AppState.products];

  // Category filter
  if (AppState.currentCategory !== 'all') {
    list = list.filter(p => p.category === AppState.currentCategory);
  }

  // Search filter
  if (AppState.searchQuery.trim() !== '') {
    const q = AppState.searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (AppState.sortBy === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (AppState.sortBy === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (AppState.sortBy === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  AppState.filteredProducts = list;
  renderMenu();
}

function setCategory(cat, btnEl) {
  AppState.currentCategory = cat;
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  filterProducts();
}

function resetFilters() {
  AppState.currentCategory = 'all';
  AppState.searchQuery = '';
  AppState.sortBy = 'default';

  const searchInput = document.getElementById('menuSearchInput');
  const sortSelect = document.getElementById('menuSortSelect');
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'default';

  document.querySelectorAll('.btn-filter').forEach(b => {
    b.classList.remove('active');
    if (b.dataset.cat === 'all') b.classList.add('active');
  });

  filterProducts();
}

// 6. SHOPPING CART FUNCTIONALITY
function addToCart(productId, qty = 1) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = AppState.cart.find(item => item.product.id === productId);
  if (existingItem) {
    existingItem.qty += qty;
  } else {
    AppState.cart.push({
      product: product,
      qty: qty
    });
  }

  updateCartUI();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
  triggerCartBounce();
}

function updateCartQty(productId, delta) {
  const item = AppState.cart.find(it => it.product.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    AppState.cart = AppState.cart.filter(it => it.product.id !== productId);
  }

  updateCartUI();
}

function removeFromCart(productId) {
  AppState.cart = AppState.cart.filter(it => it.product.id !== productId);
  updateCartUI();
  showToast('Đã xóa món khỏi giỏ hàng', 'info');
}

function updateCartUI() {
  const countBadges = document.querySelectorAll('.cart-count-badge');
  const totalCount = AppState.cart.reduce((sum, item) => sum + item.qty, 0);

  countBadges.forEach(badge => {
    badge.textContent = totalCount;
  });

  const cartList = document.getElementById('cartItemList');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartDiscount = document.getElementById('cartDiscount');
  const cartShipping = document.getElementById('cartShipping');
  const cartTotal = document.getElementById('cartTotal');
  const btnCheckout = document.getElementById('btnCartCheckout');

  if (!cartList) return;

  if (AppState.cart.length === 0) {
    cartList.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x text-muted fs-1 mb-3"></i>
        <p class="text-muted mb-3">Giỏ hàng của bạn đang trống</p>
        <button class="btn btn-sm btn-outline-danger" data-bs-dismiss="offcanvas">
          Khám phá thực đơn ngay
        </button>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = '0 đ';
    if (cartDiscount) cartDiscount.textContent = '0 đ';
    if (cartShipping) cartShipping.textContent = '0 đ';
    if (cartTotal) cartTotal.textContent = '0 đ';
    if (btnCheckout) btnCheckout.disabled = true;
    return;
  }

  if (btnCheckout) btnCheckout.disabled = false;

  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  
  // Free ship if subtotal >= 150.000 or with voucher
  let currentShip = AppState.shippingFee;
  if (subtotal >= 150000 || AppState.activePromoCode === 'KFCFREESHIP') {
    currentShip = 0;
  }

  const total = Math.max(0, subtotal - AppState.discountAmount + currentShip);

  cartList.innerHTML = AppState.cart.map(item => `
    <div class="cart-item-row">
      <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img" onerror="this.src='images/products/khoai-tay-chien.jpg'">
      <div class="flex-grow-1">
        <h6 class="mb-1 fw-bold fs-6">${item.product.name}</h6>
        <div class="text-danger fw-bold small">${item.product.price.toLocaleString('vi-VN')} đ</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="cart-qty-btn" onclick="updateCartQty('${item.product.id}', -1)">-</button>
        <span class="fw-bold px-1">${item.qty}</span>
        <button class="cart-qty-btn" onclick="updateCartQty('${item.product.id}', 1)">+</button>
      </div>
      <button class="btn btn-link text-muted p-1 ms-2" onclick="removeFromCart('${item.product.id}')" title="Xóa">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  `).join('');

  if (cartSubtotal) cartSubtotal.textContent = `${subtotal.toLocaleString('vi-VN')} đ`;
  if (cartDiscount) cartDiscount.textContent = `-${AppState.discountAmount.toLocaleString('vi-VN')} đ`;
  if (cartShipping) cartShipping.textContent = currentShip === 0 ? 'Miễn phí' : `${currentShip.toLocaleString('vi-VN')} đ`;
  if (cartTotal) cartTotal.textContent = `${total.toLocaleString('vi-VN')} đ`;
}

function applyVoucher() {
  const input = document.getElementById('cartPromoInput');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  const subtotal = AppState.cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  if (subtotal === 0) {
    showToast('Vui lòng thêm món vào giỏ trước khi nhập mã!', 'warning');
    return;
  }

  if (code === 'KFCFREESHIP') {
    AppState.activePromoCode = code;
    AppState.discountAmount = 0;
    showToast('Đã áp dụng mã Miễn Phí Vận Chuyển!', 'success');
  } else if (code === 'KFC20K') {
    if (subtotal < 100000) {
      showToast('Mã KFC20K áp dụng cho đơn từ 100.000đ trở lên!', 'warning');
      return;
    }
    AppState.activePromoCode = code;
    AppState.discountAmount = 20000;
    showToast('Đã áp dụng giảm 20.000đ vào đơn hàng!', 'success');
  } else if (code === 'CHICKENLOVE') {
    AppState.activePromoCode = code;
    AppState.discountAmount = 19000; // Tương đương 1 lon Pepsi
    showToast('Đã áp dụng mã: Tặng ngay 19.000đ (1 ly Pepsi)!', 'success');
  } else {
    showToast('Mã ưu đãi không hợp lệ hoặc đã hết hạn!', 'danger');
    return;
  }

  updateCartUI();
}

function triggerCartBounce() {
  const cartBtn = document.getElementById('navbarCartBtn');
  if (cartBtn) {
    cartBtn.classList.add('animate__animated', 'animate__rubberBand');
    setTimeout(() => {
      cartBtn.classList.remove('animate__animated', 'animate__rubberBand');
    }, 1000);
  }
}

// 7. PRODUCT DETAIL MODAL
function openProductModal(productId) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  AppState.selectedProductForModal = product;

  document.getElementById('modalProductImg').src = product.image;
  document.getElementById('modalProductTitle').textContent = product.name;
  document.getElementById('modalProductPrice').textContent = `${product.price.toLocaleString('vi-VN')} đ`;
  document.getElementById('modalProductDesc').textContent = product.description;
  document.getElementById('modalProductQty').value = 1;

  const modalEl = document.getElementById('productDetailModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

function addModalProductToCart() {
  if (!AppState.selectedProductForModal) return;
  const qtyInput = document.getElementById('modalProductQty');
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;

  addToCart(AppState.selectedProductForModal.id, qty);

  const modalEl = document.getElementById('productDetailModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
}

// 8. MARKDOWN VIEWER & INSPECTOR
function switchMarkdownTab(docKey) {
  AppState.activeDoc = docKey;
  
  // Update tab buttons
  document.querySelectorAll('.md-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.doc === docKey);
  });

  renderMarkdownViewer();
}

function setDocViewMode(mode) {
  AppState.currentDocViewMode = mode;
  document.getElementById('btnViewHtml').classList.toggle('active', mode === 'html');
  document.getElementById('btnViewRaw').classList.toggle('active', mode === 'raw');
  renderMarkdownViewer();
}

function renderMarkdownViewer() {
  const container = document.getElementById('markdownContentContainer');
  if (!container) return;

  const rawContent = AppState.documents[AppState.activeDoc] || '';

  if (AppState.currentDocViewMode === 'raw') {
    container.innerHTML = `
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <span class="badge bg-dark px-3 py-2">
          <i class="bi bi-code-slash me-1"></i> Tệp: ${AppState.activeDoc} (${rawContent.length} ký tự)
        </span>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" onclick="copyRawMarkdown()">
            <i class="bi bi-clipboard me-1"></i> Sao chép
          </button>
          ${AppState.activeDoc === 'd_li_u_menu_m_n_n_kfc.md' ? `
            <button class="btn btn-sm btn-kfc-primary" onclick="applyEditedMenuFromTextarea()">
              <i class="bi bi-check-lg me-1"></i> Cập nhật Menu ngay
            </button>
          ` : ''}
        </div>
      </div>
      <textarea id="rawMarkdownEditor" class="raw-markdown-view" spellcheck="false">${rawContent}</textarea>
    `;
  } else {
    const renderedHtml = renderMarkdownToHtml(rawContent);
    container.innerHTML = `
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <span class="badge bg-danger px-3 py-2">
          <i class="bi bi-file-earmark-text me-1"></i> Đang hiển thị: ${AppState.activeDoc}
        </span>
        <button class="btn btn-sm btn-outline-dark" onclick="setDocViewMode('raw')">
          <i class="bi bi-pencil me-1"></i> Xem & Sửa nội dung
        </button>
      </div>
      <div class="markdown-body p-2">
        ${renderedHtml}
      </div>
    `;
  }
}

function copyRawMarkdown() {
  const rawContent = AppState.documents[AppState.activeDoc] || '';
  navigator.clipboard.writeText(rawContent).then(() => {
    showToast('Đã sao chép nội dung Markdown vào bộ nhớ tạm!', 'success');
  });
}

function applyEditedMenuFromTextarea() {
  const editor = document.getElementById('rawMarkdownEditor');
  if (!editor) return;

  const newText = editor.value;
  AppState.documents['d_li_u_menu_m_n_n_kfc.md'] = newText;
  AppState.rawMenuMarkdown = newText;

  // Re-parse
  AppState.products = parseCsvMenu(newText);
  filterProducts();

  showToast(`Đã đồng bộ lại ${AppState.products.length} món từ nội dung Markdown vừa sửa!`, 'success');
}

// 9. LOCAL FILE DRAG & DROP / FILE INPUT HANDLER
function handleCustomMdFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const fileName = file.name;

    AppState.documents[fileName] = content;
    AppState.activeDoc = fileName;

    // Check if it's menu data (contains id, name, category, price)
    if (content.toLowerCase().includes('id,name') || content.toLowerCase().includes('price')) {
      AppState.rawMenuMarkdown = content;
      AppState.products = parseCsvMenu(content);
      filterProducts();
      showToast(`Đã nạp thực đơn thành công từ file ${fileName}!`, 'success');
    } else {
      showToast(`Đã mở file Markdown ${fileName}!`, 'info');
    }

    renderMarkdownViewer();
  };
  reader.readAsText(file);
}

// 10. CHECKOUT ORDER MODAL & SUBMISSION (Integrated with Module 2: PaymentModule)
function openCheckoutModal() {
  if (AppState.cart.length === 0) {
    showToast('Giỏ hàng trống! Hãy chọn món trước khi thanh toán.', 'warning');
    return;
  }

  // Close offcanvas cart
  const cartOffcanvasEl = document.getElementById('cartOffcanvas');
  if (cartOffcanvasEl && typeof bootstrap !== 'undefined') {
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
    if (cartOffcanvas) cartOffcanvas.hide();
  }

  // Delegate directly to Module #2: PaymentModule
  if (window.PaymentModule && typeof window.PaymentModule.openCheckout === 'function') {
    window.PaymentModule.openCheckout(AppState.cart, AppState.activePromoCode);
  }
}

function submitCheckout(e) {
  e.preventDefault();

  const name = document.getElementById('orderName').value;
  const phone = document.getElementById('orderPhone').value;
  const address = document.getElementById('orderAddress').value;

  const orderId = 'KFC' + Math.floor(100000 + Math.random() * 900000);

  // Close modal
  const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
  if (checkoutModal) checkoutModal.hide();

  // Clear cart
  AppState.cart = [];
  AppState.activePromoCode = '';
  AppState.discountAmount = 0;
  updateCartUI();

  // Show confirmation alert
  showOrderSuccessAlert(orderId, name, phone, address);
}

function showOrderSuccessAlert(orderId, name, phone, address) {
  const alertContainer = document.getElementById('orderConfirmationBox');
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show shadow-lg rounded-4 p-4 mb-4 border-2 border-success" role="alert">
      <div class="d-flex align-items-center gap-3 mb-2">
        <i class="bi bi-check-circle-fill text-success fs-1"></i>
        <div>
          <h4 class="alert-heading fw-bold mb-1">Đặt Hàng Thành Công!</h4>
          <p class="mb-0">Mã đơn hàng: <strong class="text-danger">#${orderId}</strong></p>
        </div>
      </div>
      <hr>
      <p class="mb-1">Cảm ơn bạn <strong>${name}</strong> (${phone}) đã ủng hộ KFC Việt Nam!</p>
      <p class="mb-2 text-muted">Đơn hàng đang được chuẩn bị và giao đến: <em>${address}</em> trong vòng 30 phút.</p>
      <div class="d-flex gap-2">
        <a href="tel:19006886" class="btn btn-sm btn-danger"><i class="bi bi-telephone-fill me-1"></i> Tổng đài: 1900 6886</a>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="alert">Đóng thông báo</button>
      </div>
    </div>
  `;

  // Scroll smoothly to order alert
  alertContainer.scrollIntoView({ behavior: 'smooth' });
}

// 11. TOAST NOTIFICATIONS
function showToast(message, type = 'primary') {
  const toastContainer = document.getElementById('toastNotificationArea');
  if (!toastContainer) return;

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success text-white' :
                  type === 'warning' ? 'bg-warning text-dark' :
                  type === 'danger' ? 'bg-danger text-white' : 'bg-dark text-white';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 shadow-lg`;
  toastEl.id = toastId;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">
        <i class="bi bi-info-circle-fill me-2"></i> ${message}
      </div>
      <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// 12. EVENT LISTENERS SETUP
document.addEventListener('DOMContentLoaded', () => {
  initData();

  // Search input live filter
  const searchInput = document.getElementById('menuSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      filterProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('menuSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      filterProducts();
    });
  }

  // File input picker for markdown
  const mdFileInput = document.getElementById('mdFileInput');
  if (mdFileInput) {
    mdFileInput.addEventListener('change', handleCustomMdFile);
  }

  // Checkout form submit
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', submitCheckout);
  }
});
