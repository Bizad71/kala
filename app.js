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
  if (!items.length) {
    showMessage("برای ساخت PDF ابتدا کالایی ثبت کنید.", "error");
    return;
  }

  // Render the report as real HTML so the browser handles Persian shaping and RTL correctly.
  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td dir="ltr">${escapeHtml(item.barcode)}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td>${escapeHtml(String(item.quantity))}</td>
    </tr>`).join("");

  const report = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>فهرست کالاها</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #172033; margin: 0; }
  h1 { text-align: center; font-size: 22px; margin: 0 0 8px; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; color: #536078; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 9px 8px; text-align: right; overflow-wrap: anywhere; }
  th { background: #14233e; color: white; }
  tbody tr:nth-child(even) { background: #f1f5f9; }
  td:first-child, th:first-child { text-align: center; width: 50px; }
  td:nth-child(3) { text-align: left; font-family: Arial, sans-serif; }
  @media screen { body { padding: 22px; } .print-hint { text-align:center; color:#536078; margin:0 0 18px; font-size:12px; } }
  @media print { .print-hint { display:none; } }
</style>
</head>
<body>
<p class="print-hint">در پنجره چاپ، مقصد را روی «ذخیره به‌صورت PDF» قرار دهید.</p>
<h1>فهرست کالاهای ثبت‌شده</h1>
<div class="meta"><span>تاریخ تهیه: ${new Date().toLocaleDateString("fa-IR")}</span><span>تعداد اقلام: ${items.length.toLocaleString("fa-IR")}</span></div>
<table>
<thead><tr><th>ردیف</th><th>نام کالا</th><th>بارکد</th><th>واحد</th><th>مقدار کل</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));<\/script>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showMessage("پنجره PDF مسدود شد؛ اجازه بازشدن پنجره‌های جدید را در مرورگر فعال کنید.", "error");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(report);
  printWindow.document.close();
  showMessage("گزارش آماده است؛ در پنجره چاپ گزینه «ذخیره به‌صورت PDF» را انتخاب کنید.", "success");
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
render();
