const $ = (id) => document.getElementById(id);
const form = $("itemForm");
const itemsBody = $("itemsBody");
const message = $("message");
const STORAGE_KEY = "neonInventoryItemsV1";
let items = loadItems();

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveItems() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  catch { showMessage("ذخیره‌سازی مرورگر در دسترس نیست.", "error"); }
}
function faNumber(value) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(value);
}
function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `message ${type}`;
}
function render() {
  itemsBody.replaceChildren();
  $("itemCount").textContent = faNumber(items.length);
  $("totalBadge").textContent = `${faNumber(items.length)} کالا`;
  $("emptyState").hidden = items.length > 0;
  $("tableWrap").hidden = items.length === 0;
  items.forEach((item, index) => {
    const tr = document.createElement("tr");
    const values = [
      faNumber(index + 1), item.name, item.barcode, item.unit, faNumber(item.quantity)
    ];
    values.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (i === 2) td.className = "barcode";
      if (i === 4) td.className = "qty";
      tr.appendChild(td);
    });
    const actionCell = document.createElement("td");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.textContent = "حذف";
    remove.addEventListener("click", () => {
      items.splice(index, 1);
      saveItems(); render();
      showMessage("کالا از فهرست حذف شد.", "success");
    });
    actionCell.appendChild(remove);
    tr.appendChild(actionCell);
    itemsBody.appendChild(tr);
  });
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("productName").value.trim();
  const barcode = $("barcode").value.trim();
  const unit = $("unit").value;
  const quantity = Number($("quantity").value);
  if (!name || !barcode || !Number.isFinite(quantity) || quantity <= 0) {
    showMessage("نام، بارکد و مقدار معتبر را وارد کنید.", "error");
    return;
  }
  const existing = items.find(item => item.barcode === barcode);
  if (existing) {
    if (existing.unit !== unit) {
      showMessage(`این بارکد قبلاً ثبت شده است، اما واحد قبلی «${existing.unit}» است. واحد را یکسان انتخاب کنید.`, "warning");
      return;
    }
    existing.quantity += quantity;
    showMessage(`این کالا وجود دارد؛ مقدار به کالای قبلی اضافه شد. مقدار کل: ${faNumber(existing.quantity)} ${existing.unit}`, "warning");
  } else {
    items.push({ name, barcode, unit, quantity });
    showMessage("کالا با موفقیت ثبت شد.", "success");
  }
  saveItems(); render();
  $("productName").value = "";
  $("barcode").value = "";
  $("quantity").value = "";
  $("productName").focus();
});
$("clearBtn").addEventListener("click", () => {
  if (!items.length) { showMessage("فهرست خالی است.", "warning"); return; }
  if (!confirm("تمام کالاهای ثبت‌شده پاک شوند؟ این کار قابل بازگشت نیست.")) return;
  items = []; saveItems(); render(); showMessage("فهرست پاک شد.", "success");
});
$("pdfBtn").addEventListener("click", () => {
  if (!items.length) { showMessage("برای ساخت PDF ابتدا کالایی ثبت کنید.", "error"); return; }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showMessage("کتابخانه PDF بارگذاری نشد. اینترنت را بررسی و صفحه را دوباره باز کنید.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica");
  doc.setFontSize(18);
  doc.text("Inventory Item List", 148, 16, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-CA")}`, 14, 24);
  doc.autoTable({
    startY: 30,
    head: [["No.", "Product name", "Barcode", "Unit", "Total quantity"]],
    body: items.map((item, index) => [index + 1, item.name, item.barcode, item.unit, String(item.quantity)]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [16, 35, 62], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { left: 14, right: 14 }
  });
  doc.save("inventory-list.pdf");
  showMessage("فایل PDF آماده شد.", "success");
});
render();
