/* ===========================
   CONFIG
=========================== */
const WHATSAPP_NUMBER = "+593987262482"; // <-- Cambia esto (código país)
const ADMIN_PASSWORD = "admin123";     // <-- Cambia esto
const LS_KEY = "onestream_products_v1";

let products = [];
let activeCategory = "Todas";

let bootstrapModal = null;
let toast = null;

/* ===========================
   HELPERS
=========================== */
const $ = (sel) => document.querySelector(sel);

function showStatus(message, type = "info") {
  const box = $("#catalogStatus");
  if (!box) return;
  box.classList.remove("d-none", "alert-info", "alert-success", "alert-warning", "alert-danger");
  box.classList.add(`alert-${type}`);
  box.textContent = message;
}
function hideStatus() {
  const box = $("#catalogStatus");
  if (!box) return;
  box.classList.add("d-none");
}
function showToast(message) {
  const body = $("#toastBody");
  if (body) body.textContent = message;
  if (toast) toast.show();
}
function escapeHTML(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function normalize(text = "") {
  return (text || "").toLowerCase().trim();
}
function whatsappLinkForPlatform(platformName) {
  const msg = `Hola, quiero comprar la suscripción a ${platformName}`;
  const cleaned = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}
function generalWhatsAppLink() {
  const msg = "Hola, quiero información sobre suscripciones OneStream.";
  const cleaned = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
}

/* ===========================
   DATA LOADING
=========================== */
async function loadProducts() {
  const local = localStorage.getItem(LS_KEY);
  if (local) {
    try {
      products = JSON.parse(local);
      showStatus("Catálogo cargado desde tu navegador (localStorage).", "success");
      renderAll();
      renderCategoryChips();
      return;
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }

  try {
    showStatus("Cargando catálogo…", "info");
    const res = await fetch("products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar products.json");
    const data = await res.json();
    products = Array.isArray(data) ? data : [];
    hideStatus();
    renderAll();
    renderCategoryChips();
  } catch (err) {
    console.error(err);
    showStatus("No se pudo cargar el catálogo. Verifica products.json.", "danger");
    products = [];
    renderAll();
    renderCategoryChips();
  }
}
function persistProducts() {
  localStorage.setItem(LS_KEY, JSON.stringify(products, null, 2));
}

/* ===========================
   CATEGORIES
=========================== */
function getCategories() {
  const set = new Set(products.map(p => (p.categoria || "Otros").trim()));
  return ["Todas", ...Array.from(set).sort((a,b) => a.localeCompare(b, "es"))];
}

function renderCategoryChips() {
  const wrap = $("#categoryChips");
  if (!wrap) return;

  const cats = getCategories();
  wrap.innerHTML = cats.map(cat => `
    <button class="chip ${cat === activeCategory ? "active" : ""}" type="button" data-cat="${escapeHTML(cat)}">
      ${escapeHTML(cat)}
    </button>
  `).join("");

  wrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-cat");
      renderAll();
      renderCategoryChips();
    });
  });
}

/* ===========================
   RENDERING
=========================== */
function renderProductsGrid(list) {
  const grid = $("#productsGrid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="glass p-4">
          <h3 class="h4 mb-2">Sin resultados</h3>
          <p class="text-secondary mb-0">No hay productos para mostrar con esos filtros.</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const nombre = escapeHTML(p.nombre || "Plataforma");
    const descripcion = escapeHTML(p.descripcion || "");
    const precio = escapeHTML(p.precio || "");
    const categoria = escapeHTML(p.categoria || "Otros");
    const img = p.imagen ? escapeHTML(p.imagen) : "";
    const alt = `Suscripción a ${nombre}`;
    const wa = whatsappLinkForPlatform(p.nombre || "la plataforma");

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="product-card">
          <img class="product-img" src="${img || "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1400&q=60"}"
               alt="${escapeHTML(alt)}" loading="lazy" />
          <div class="p-4">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <h3 class="h4 product-title mb-1">${nombre}</h3>
                <div class="text-secondary small"><i class="fa-solid fa-tag me-1"></i>${categoria}</div>
              </div>
              <span class="price-badge">${precio}</span>
            </div>
            <p class="product-desc mb-3 mt-2">${descripcion}</p>
            <div class="d-grid gap-2">
              <a class="btn btn-primary glow" href="${wa}" target="_blank" rel="noopener">
                <i class="fa-brands fa-whatsapp me-2"></i> Comprar ahora
              </a>
              <button class="btn btn-outline-light" type="button" onclick="scrollToContact()">
                <i class="fa-solid fa-circle-question me-2"></i> Consultar
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  }).join("");
}

function renderAdminTable() {
  const tbody = $("#adminTableBody");
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-secondary">No hay productos. Usa el formulario para agregar uno.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <strong>${escapeHTML(p.nombre || "")}</strong>
        <div class="text-secondary small">${escapeHTML(p.id || "")}</div>
      </td>
      <td>${escapeHTML(p.categoria || "Otros")}</td>
      <td>${escapeHTML(p.precio || "")}</td>
      <td class="d-none d-md-table-cell text-secondary">${escapeHTML((p.descripcion || "").slice(0, 90))}${(p.descripcion||"").length>90?"…":""}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-info me-2" onclick="adminEdit('${escapeHTML(p.id)}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="adminDelete('${escapeHTML(p.id)}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAll() {
  const q = normalize($("#searchInput")?.value || "");
  let filtered = products;

  if (activeCategory && activeCategory !== "Todas") {
    filtered = filtered.filter(p => normalize(p.categoria || "otros") === normalize(activeCategory));
  }

  if (q) {
    filtered = filtered.filter(p =>
      normalize(p.nombre).includes(q) ||
      normalize(p.descripcion).includes(q) ||
      normalize(p.categoria).includes(q)
    );
  }

  renderProductsGrid(filtered);
  renderAdminTable();
}

/* ===========================
   ADMIN
=========================== */
function openAdminModal() {
  const modalEl = $("#adminModal");
  if (!modalEl) return;
  if (!bootstrapModal) bootstrapModal = new bootstrap.Modal(modalEl);
  bootstrapModal.show();
}

function adminLogin() {
  const pass = $("#adminPassword")?.value || "";
  if (pass !== ADMIN_PASSWORD) {
    showToast("Contraseña incorrecta.");
    return;
  }
  $("#adminLoginSection")?.classList.add("d-none");
  $("#adminCrudSection")?.classList.remove("d-none");
  showToast("Bienvenido/a al panel Admin.");
}

function adminLogout() {
  $("#adminPassword").value = "";
  $("#adminLoginSection")?.classList.remove("d-none");
  $("#adminCrudSection")?.classList.add("d-none");
  adminResetForm();
  showToast("Sesión cerrada.");
}

function adminResetForm() {
  $("#productId").value = "";
  $("#productName").value = "";
  $("#productPrice").value = "";
  $("#productCategory").value = "";
  $("#productDesc").value = "";
  $("#productImg").value = "";
}

function adminUpsertFromForm(e) {
  e.preventDefault();
  const idField = $("#productId").value.trim();
  const nombre = $("#productName").value.trim();
  const precio = $("#productPrice").value.trim();
  const categoria = $("#productCategory").value.trim();
  const descripcion = $("#productDesc").value.trim();
  const imagen = $("#productImg").value.trim();

  if (!nombre || !precio || !descripcion || !categoria) {
    showToast("Completa nombre, precio, categoría y descripción.");
    return;
  }

  const id = idField || normalize(nombre).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID();

  const existingIndex = products.findIndex(p => p.id === id);
  const payload = { id, nombre, categoria, precio, descripcion, imagen };

  if (existingIndex >= 0) {
    products[existingIndex] = payload;
    showToast("Producto actualizado.");
  } else {
    if (products.some(p => p.id === id)) payload.id = `${id}-${Date.now()}`;
    products.unshift(payload);
    showToast("Producto agregado.");
  }

  persistProducts();
  adminResetForm();
  renderAll();
  renderCategoryChips();
}

function adminEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  $("#productId").value = p.id || "";
  $("#productName").value = p.nombre || "";
  $("#productPrice").value = p.precio || "";
  $("#productCategory").value = p.categoria || "";
  $("#productDesc").value = p.descripcion || "";
  $("#productImg").value = p.imagen || "";

  showToast("Editando producto…");
}

function adminDelete(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const ok = confirm(`¿Eliminar "${p.nombre}"?`);
  if (!ok) return;

  products = products.filter(x => x.id !== id);
  persistProducts();
  renderAll();
  renderCategoryChips();
  showToast("Producto eliminado.");
}

function clearLocalStorageCatalog() {
  const ok = confirm("Esto eliminará los cambios guardados y recargará products.json. ¿Continuar?");
  if (!ok) return;
  localStorage.removeItem(LS_KEY);
  showToast("localStorage limpiado. Recargando…");
  loadProducts();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.export.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("JSON exportado.");
}

/* ===========================
   CONTACT FORM (DEMO)
=========================== */
function setupContactForm() {
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = $("#name");
    const email = $("#email");
    const message = $("#message");

    const valid = name.value.trim() && email.validity.valid && message.value.trim();
    if (!valid) {
      form.classList.add("was-validated");
      showToast("Revisa los campos del formulario.");
      return;
    }

    const subject = encodeURIComponent("Consulta OneStream");
    const body = encodeURIComponent(
      `Nombre: ${name.value}\nEmail: ${email.value}\n\nMensaje:\n${message.value}`
    );
    window.location.href = `mailto:tuemail@dominio.com?subject=${subject}&body=${body}`;

    showToast("Abriendo tu app de correo…");
    form.reset();
    form.classList.remove("was-validated");
  });
}

/* ===========================
   SEARCH + NAV
=========================== */
function setupSearch() {
  $("#searchInput")?.addEventListener("input", renderAll);
  $("#btnReset")?.addEventListener("click", () => {
    $("#searchInput").value = "";
    activeCategory = "Todas";
    renderAll();
    renderCategoryChips();
  });
}

function scrollToContact() {
  document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" });
}

/* ===========================
   INIT
=========================== */
document.addEventListener("DOMContentLoaded", async () => {
  const toastEl = $("#appToast");
  if (toastEl) toast = new bootstrap.Toast(toastEl, { delay: 2200 });

  const waBtn = $("#whatsAppGeneral");
  if (waBtn) waBtn.href = generalWhatsAppLink();

  $("#btnAdmin")?.addEventListener("click", openAdminModal);
  $("#btnAdminLogin")?.addEventListener("click", adminLogin);
  $("#btnAdminLogout")?.addEventListener("click", adminLogout);
  $("#btnFormReset")?.addEventListener("click", adminResetForm);
  $("#productForm")?.addEventListener("submit", adminUpsertFromForm);
  $("#btnClearLocal")?.addEventListener("click", clearLocalStorageCatalog);
  $("#btnExport")?.addEventListener("click", exportJSON);

  $("#adminPassword")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") adminLogin();
  });

  setupContactForm();
  setupSearch();

  await loadProducts();
});

window.adminEdit = adminEdit;
window.adminDelete = adminDelete;
window.scrollToContact = scrollToContact;
