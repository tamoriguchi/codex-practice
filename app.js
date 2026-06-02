const storageKey = "lifeAssetManager:v1";

const today = new Date();
const isoToday = localDateString(today);

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const demoState = {
  accounts: [
    { id: "cash", name: "現金", type: "cash", balance: 180000 },
    { id: "bank", name: "メイン銀行", type: "bank", balance: 1020000 },
    { id: "broker", name: "証券口座", type: "bank", balance: 500000 },
    { id: "credit", name: "クレジットカード", type: "credit", balance: -300000 },
  ],
  categories: [
    { id: "food", name: "食費", monthlyBudget: 50000, carryOver: false },
    { id: "social", name: "交際費", monthlyBudget: 30000, carryOver: true },
    { id: "learning", name: "学習費", monthlyBudget: 25000, carryOver: true },
    { id: "hobby", name: "趣味", monthlyBudget: 20000, carryOver: false },
    { id: "rent", name: "家賃", monthlyBudget: 120000, carryOver: false },
    { id: "income", name: "収入", monthlyBudget: 0, carryOver: false },
  ],
  transactions: [
    { id: crypto.randomUUID(), type: "income", amount: 400000, categoryId: "income", accountId: "bank", memo: "給与", tags: ["給与"], satisfaction: 5, regret: 1, createdAt: isoToday },
    { id: crypto.randomUUID(), type: "expense", amount: 120000, categoryId: "rent", accountId: "bank", memo: "家賃", tags: ["固定費"], satisfaction: 3, regret: 1, createdAt: isoToday },
    { id: crypto.randomUUID(), type: "expense", amount: 15000, categoryId: "food", accountId: "credit", memo: "自炊用まとめ買い", tags: ["食費"], satisfaction: 4, regret: 1, createdAt: isoToday },
    { id: crypto.randomUUID(), type: "expense", amount: 12000, categoryId: "social", accountId: "credit", memo: "友人と食事", tags: ["交際費"], satisfaction: 5, regret: 1, createdAt: isoToday },
    { id: crypto.randomUUID(), type: "expense", amount: 19000, categoryId: "hobby", accountId: "credit", memo: "ガジェット小物", tags: ["趣味", "浪費"], satisfaction: 3, regret: 3, createdAt: isoToday },
    { id: crypto.randomUUID(), type: "expense", amount: 18000, categoryId: "learning", accountId: "credit", memo: "技術書と講座", tags: ["自己投資"], satisfaction: 5, regret: 1, createdAt: isoToday },
  ],
  assets: [
    { id: crypto.randomUUID(), name: "MacBook Pro", category: "PC", purchasePrice: 300000, purchasedAt: "2024-06-01", usefulLifeMonths: 60, condition: "良好" },
    { id: crypto.randomUUID(), name: "iPhone", category: "スマホ", purchasePrice: 150000, purchasedAt: "2025-06-01", usefulLifeMonths: 36, condition: "良好" },
    { id: crypto.randomUUID(), name: "ワークチェア", category: "家具", purchasePrice: 80000, purchasedAt: "2023-06-01", usefulLifeMonths: 84, condition: "普通" },
  ],
};

let state = loadState();
let editingTransactionId = null;
let editingAssetId = null;

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(demoState);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(demoState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(Math.round(value));
}

function percent(value) {
  return `${Math.round(value)}%`;
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id) || { name: "未分類", monthlyBudget: 0 };
}

function getAccount(id) {
  return state.accounts.find((account) => account.id === id) || { name: "未設定", type: "cash" };
}

function isThisMonth(dateString) {
  const date = new Date(dateString);
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function monthsElapsed(dateString) {
  const date = new Date(dateString);
  return Math.max(0, (today.getFullYear() - date.getFullYear()) * 12 + today.getMonth() - date.getMonth());
}

function currentAssetValue(asset) {
  const remainingMonths = Math.max(0, asset.usefulLifeMonths - monthsElapsed(asset.purchasedAt));
  return asset.purchasePrice * (remainingMonths / asset.usefulLifeMonths);
}

function remainingAssetMonths(asset) {
  return Math.max(0, asset.usefulLifeMonths - monthsElapsed(asset.purchasedAt));
}

function monthlyAssetDepreciation(asset) {
  return remainingAssetMonths(asset) > 0 ? asset.purchasePrice / asset.usefulLifeMonths : 0;
}

function monthlyTransactions() {
  return state.transactions.filter((transaction) => isThisMonth(transaction.createdAt));
}

function totals() {
  const transactions = monthlyTransactions();
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const investmentAccounts = state.accounts.filter((account) => account.name.includes("証券") || account.type === "crypto");
  const cashAssets = state.accounts
    .filter((account) => !investmentAccounts.includes(account) && ["cash", "bank"].includes(account.type) && account.balance > 0)
    .reduce((sum, account) => sum + account.balance, 0);
  const investmentAssets = investmentAccounts.reduce((sum, account) => sum + Math.max(0, account.balance), 0);
  const liabilities = state.accounts.filter((account) => account.balance < 0 || account.type === "credit").reduce((sum, account) => sum + Math.min(0, account.balance), 0);
  const physicalAssets = state.assets.reduce((sum, asset) => sum + currentAssetValue(asset), 0);
  return { income, expense, cashAssets, investmentAssets, liabilities, physicalAssets, netWorth: cashAssets + investmentAssets + physicalAssets + liabilities };
}

function renderDashboard() {
  const data = totals();
  document.querySelector("#incomeTotal").textContent = yen(data.income);
  document.querySelector("#expenseTotal").textContent = yen(data.expense);
  document.querySelector("#cashFlow").textContent = yen(data.income - data.expense);
  document.querySelector("#netWorth").textContent = yen(data.netWorth);
  document.querySelector("#cashAssets").textContent = yen(data.cashAssets);
  document.querySelector("#investmentAssets").textContent = yen(data.investmentAssets);
  document.querySelector("#physicalAssets").textContent = yen(data.physicalAssets);
  document.querySelector("#liabilities").textContent = yen(data.liabilities);
  document.querySelector("#assetizedRate").textContent = `資産化率 ${percent(data.expense ? (data.physicalAssets / (data.physicalAssets + data.expense)) * 100 : 0)}`;
  renderAssetValuePanel();
}

function renderAssetValuePanel() {
  const panel = document.querySelector("#assetValuePanel");
  const purchaseTotal = state.assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const currentTotal = state.assets.reduce((sum, asset) => sum + currentAssetValue(asset), 0);
  const monthlyDepreciation = state.assets.reduce((sum, asset) => sum + monthlyAssetDepreciation(asset), 0);
  const replacementSoon = state.assets.filter((asset) => remainingAssetMonths(asset) <= 6).length;
  document.querySelector("#monthlyDepreciation").textContent = `今月の償却 ${yen(monthlyDepreciation)}`;
  if (!state.assets.length) {
    panel.innerHTML = `<p class="list-meta">資産を登録すると、購入額に対して今いくら価値が残っているか確認できます。</p>`;
    return;
  }
  const rows = [...state.assets]
    .sort((a, b) => currentAssetValue(b) - currentAssetValue(a))
    .map((asset) => {
      const value = currentAssetValue(asset);
      const ratio = asset.purchasePrice ? (value / asset.purchasePrice) * 100 : 0;
      const remainingMonths = remainingAssetMonths(asset);
      const status = remainingMonths <= 6 ? "danger" : ratio <= 35 ? "warn" : "";
      return `
        <div class="asset-value-row">
          <div class="asset-value-main">
            <strong>${asset.name}</strong>
            <span class="list-meta">現在 ${yen(value)} / 購入 ${yen(asset.purchasePrice)}・残り${remainingMonths}ヶ月</span>
          </div>
          <div class="asset-value-meter">
            <span>${percent(ratio)}</span>
            <div class="progress-shell">
              <div class="progress-fill ${status}" style="width:${Math.min(ratio, 100)}%"></div>
            </div>
          </div>
        </div>
      `;
    });
  panel.innerHTML = `
    <div class="asset-value-summary">
      <div><span>購入総額</span><strong>${yen(purchaseTotal)}</strong></div>
      <div><span>現在価値</span><strong>${yen(currentTotal)}</strong></div>
      <div><span>価値減少</span><strong>${yen(purchaseTotal - currentTotal)}</strong></div>
      <div><span>買い替え目安</span><strong>${replacementSoon}件</strong></div>
    </div>
    <div class="asset-value-list">${rows.join("")}</div>
  `;
}

function renderBudgets() {
  const grid = document.querySelector("#budgetGrid");
  const expenses = monthlyTransactions().filter((transaction) => transaction.type === "expense");
  const cards = state.categories
    .filter((category) => category.monthlyBudget > 0)
    .map((category) => {
      const used = expenses.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0);
      const ratio = category.monthlyBudget ? (used / category.monthlyBudget) * 100 : 0;
      const status = ratio >= 100 ? "danger" : ratio >= 85 ? "warn" : "";
      return `
        <article class="budget-card">
          <div class="budget-title">
            <strong>${category.name}</strong>
            <span class="list-meta">${category.carryOver ? "繰越あり" : "月次リセット"}</span>
          </div>
          <div class="progress-shell" aria-label="${category.name} 使用率">
            <div class="progress-fill ${status}" style="width:${Math.min(ratio, 100)}%"></div>
          </div>
          <div class="budget-title">
            <span>${yen(Math.max(0, category.monthlyBudget - used))} / ${yen(category.monthlyBudget)}</span>
            <strong>${percent(ratio)}</strong>
          </div>
        </article>
      `;
    });
  grid.innerHTML = cards.join("");
}

function renderTransactions() {
  const list = document.querySelector("#transactionList");
  const sorted = [...state.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.querySelector("#transactionCount").textContent = `${sorted.length}件`;
  list.innerHTML = sorted.map((transaction) => {
    const sign = transaction.type === "income" ? "+" : "-";
    const amountClass = transaction.type === "income" ? "amount-income" : "amount-expense";
    const meta = `${transaction.createdAt} / ${getCategory(transaction.categoryId).name} / ${getAccount(transaction.accountId).name}`;
    return `
      <div class="list-item">
        <div class="list-main">
          <strong>${transaction.memo || getCategory(transaction.categoryId).name}</strong>
          <span class="list-meta">${meta}</span>
          <span class="list-meta">満足 ${transaction.satisfaction}/5・後悔 ${transaction.regret}/5</span>
        </div>
        <div class="list-side">
          <strong class="${amountClass}">${sign}${yen(transaction.amount)}</strong>
          <div class="item-actions">
            <button type="button" data-action="edit-transaction" data-id="${transaction.id}">編集</button>
            <button type="button" data-action="delete-transaction" data-id="${transaction.id}">削除</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderAssets() {
  const list = document.querySelector("#assetList");
  document.querySelector("#assetCount").textContent = `${state.assets.length}件`;
  list.innerHTML = state.assets.map((asset) => {
    const value = currentAssetValue(asset);
    const ratio = (value / asset.purchasePrice) * 100;
    return `
      <div class="list-item">
        <div class="list-main">
          <strong>${asset.name}</strong>
          <span class="list-meta">${asset.category} / ${asset.purchasedAt} / ${asset.usefulLifeMonths}ヶ月 / ${asset.condition}</span>
          <span class="list-meta">購入 ${yen(asset.purchasePrice)} → 現在 ${yen(value)}</span>
        </div>
        <div class="list-side">
          <strong>${percent(ratio)}</strong>
          <div class="item-actions">
            <button type="button" data-action="edit-asset" data-id="${asset.id}">編集</button>
            <button type="button" data-action="delete-asset" data-id="${asset.id}">削除</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderAnalysis() {
  const expenses = monthlyTransactions().filter((transaction) => transaction.type === "expense");
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const tagged = (keyword) => expenses.filter((item) => (item.tags || []).some((tag) => tag.includes(keyword))).reduce((sum, item) => sum + item.amount, 0);
  const fixed = expenses.filter((item) => ["rent"].includes(item.categoryId) || (item.tags || []).includes("固定費")).reduce((sum, item) => sum + item.amount, 0);
  const selfInvestment = expenses.filter((item) => item.categoryId === "learning" || (item.tags || []).includes("自己投資")).reduce((sum, item) => sum + item.amount, 0);
  const regretWeighted = expenses.reduce((sum, item) => sum + (item.amount * item.regret) / 5, 0);
  const signals = [
    ["固定費率", fixed, "住居費・固定費タグ"],
    ["浪費率", regretWeighted, "後悔度で加重"],
    ["自己投資率", selfInvestment, "学習費・自己投資タグ"],
    ["カフェ比率", tagged("カフェ"), "カフェタグ"],
    ["サブスク比率", tagged("サブスク"), "サブスクタグ"],
    ["資産化率", totals().physicalAssets, "現物資産の現在価値"],
  ];
  document.querySelector("#analysisGrid").innerHTML = signals.map(([label, value, note]) => `
    <article class="signal-card">
      <div class="signal-title">
        <span>${label}</span>
        <span class="list-meta">${note}</span>
      </div>
      <strong>${percent(totalExpense ? (value / totalExpense) * 100 : 0)}</strong>
    </article>
  `).join("");
}

function renderOptions() {
  document.querySelector("#transactionCategory").innerHTML = state.categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join("");
  document.querySelector("#transactionAccount").innerHTML = state.accounts.map((account) => `<option value="${account.id}">${account.name}</option>`).join("");
}

function renderAll() {
  document.querySelector("#monthLabel").textContent = `${today.getFullYear()}年${today.getMonth() + 1}月`;
  renderOptions();
  renderDashboard();
  renderBudgets();
  renderTransactions();
  renderAssets();
  renderAnalysis();
}

document.querySelector("#transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const transaction = {
    id: editingTransactionId || crypto.randomUUID(),
    type: form.get("type"),
    amount: Number(form.get("amount")),
    categoryId: form.get("categoryId"),
    accountId: form.get("accountId"),
    memo: form.get("memo").trim(),
    tags: form.get("tags").split(",").map((tag) => tag.trim()).filter(Boolean),
    satisfaction: Number(form.get("satisfaction")),
    regret: Number(form.get("regret")),
    createdAt: form.get("createdAt"),
  };
  if (editingTransactionId) {
    state.transactions = state.transactions.map((item) => item.id === editingTransactionId ? transaction : item);
  } else {
    state.transactions.push(transaction);
  }
  saveState();
  resetTransactionForm();
  renderAll();
});

document.querySelector("#assetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const asset = {
    id: editingAssetId || crypto.randomUUID(),
    name: form.get("name").trim(),
    category: form.get("category").trim(),
    purchasePrice: Number(form.get("purchasePrice")),
    purchasedAt: form.get("purchasedAt"),
    usefulLifeMonths: Number(form.get("usefulLifeMonths")),
    condition: form.get("condition"),
  };
  if (editingAssetId) {
    state.assets = state.assets.map((item) => item.id === editingAssetId ? asset : item);
  } else {
    state.assets.push(asset);
  }
  saveState();
  resetAssetForm();
  renderAll();
});

document.querySelector("#resetDemo").addEventListener("click", () => {
  state = structuredClone(demoState);
  resetTransactionForm();
  resetAssetForm();
  saveState();
  renderAll();
});

document.querySelector("#cancelTransactionEdit").addEventListener("click", resetTransactionForm);
document.querySelector("#cancelAssetEdit").addEventListener("click", resetAssetForm);

document.querySelector("#transactionList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const transaction = state.transactions.find((item) => item.id === button.dataset.id);
  if (!transaction) return;
  if (button.dataset.action === "edit-transaction") {
    startTransactionEdit(transaction);
    return;
  }
  if (confirm("この収支記録を削除しますか？")) {
    state.transactions = state.transactions.filter((item) => item.id !== transaction.id);
    if (editingTransactionId === transaction.id) resetTransactionForm();
    saveState();
    renderAll();
  }
});

document.querySelector("#assetList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const asset = state.assets.find((item) => item.id === button.dataset.id);
  if (!asset) return;
  if (button.dataset.action === "edit-asset") {
    startAssetEdit(asset);
    return;
  }
  if (confirm("この資産を削除しますか？")) {
    state.assets = state.assets.filter((item) => item.id !== asset.id);
    if (editingAssetId === asset.id) resetAssetForm();
    saveState();
    renderAll();
  }
});

function startTransactionEdit(transaction) {
  const form = document.querySelector("#transactionForm");
  editingTransactionId = transaction.id;
  form.type.value = transaction.type;
  form.amount.value = transaction.amount;
  form.createdAt.value = transaction.createdAt;
  form.categoryId.value = transaction.categoryId;
  form.accountId.value = transaction.accountId;
  form.tags.value = (transaction.tags || []).join(", ");
  form.satisfaction.value = transaction.satisfaction;
  form.regret.value = transaction.regret;
  form.memo.value = transaction.memo || "";
  document.querySelector("#transactionFormTitle").textContent = "収支を編集";
  document.querySelector("#transactionFormHint").textContent = "選択中の記録を更新";
  document.querySelector("#transactionSubmit").textContent = "更新する";
  document.querySelector("#cancelTransactionEdit").classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetTransactionForm() {
  const form = document.querySelector("#transactionForm");
  editingTransactionId = null;
  form.reset();
  form.type.value = "expense";
  form.createdAt.value = isoToday;
  form.satisfaction.value = 4;
  form.regret.value = 1;
  document.querySelector("#transactionFormTitle").textContent = "収支を追加";
  document.querySelector("#transactionFormHint").textContent = "満足度も記録";
  document.querySelector("#transactionSubmit").textContent = "記録する";
  document.querySelector("#cancelTransactionEdit").classList.add("hidden");
}

function startAssetEdit(asset) {
  const form = document.querySelector("#assetForm");
  editingAssetId = asset.id;
  form.name.value = asset.name;
  form.category.value = asset.category;
  form.purchasePrice.value = asset.purchasePrice;
  form.purchasedAt.value = asset.purchasedAt;
  form.usefulLifeMonths.value = asset.usefulLifeMonths;
  form.condition.value = asset.condition;
  document.querySelector("#assetFormTitle").textContent = "資産を編集";
  document.querySelector("#assetFormHint").textContent = "現在価値も再計算";
  document.querySelector("#assetSubmit").textContent = "更新する";
  document.querySelector("#cancelAssetEdit").classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAssetForm() {
  const form = document.querySelector("#assetForm");
  editingAssetId = null;
  form.reset();
  form.purchasedAt.value = isoToday;
  form.usefulLifeMonths.value = 60;
  document.querySelector("#assetFormTitle").textContent = "資産を登録";
  document.querySelector("#assetFormHint").textContent = "現在価値を自動計算";
  document.querySelector("#assetSubmit").textContent = "資産化する";
  document.querySelector("#cancelAssetEdit").classList.add("hidden");
}

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("lifeAssetManager:theme", document.body.classList.contains("light") ? "light" : "dark");
});

document.querySelectorAll(".nav-list a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-list a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

if (localStorage.getItem("lifeAssetManager:theme") === "light") {
  document.body.classList.add("light");
}

resetTransactionForm();
resetAssetForm();
renderAll();
