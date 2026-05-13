const STORAGE_KEY = "reply-template-box.templates";

const sampleTemplates = [
  {
    id: crypto.randomUUID(),
    title: "予約候補日の案内",
    category: "予約",
    body: "ご連絡ありがとうございます。現在、以下の日程でご予約可能です。\n\n・○月○日 ○:○○\n・○月○日 ○:○○\n・○月○日 ○:○○\n\nご都合のよい日時をお知らせください。",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "キャンセルポリシー",
    category: "キャンセル",
    body: "キャンセルや日時変更をご希望の場合は、前日までにご連絡をお願いいたします。当日のキャンセルは、状況によりキャンセル料をお願いする場合があります。",
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "店舗までの道案内",
    category: "アクセス",
    body: "当店は○○駅から徒歩○分です。駅の○○出口を出て、○○通りを直進してください。建物の○階にございます。道に迷われた場合はお気軽にご連絡ください。",
    updatedAt: new Date().toISOString(),
  },
];

const elements = {
  form: document.querySelector("#template-form"),
  title: document.querySelector("#title"),
  category: document.querySelector("#category"),
  body: document.querySelector("#body"),
  search: document.querySelector("#search"),
  categoryFilter: document.querySelector("#category-filter"),
  list: document.querySelector("#template-list"),
  count: document.querySelector("#template-count"),
  resetSamples: document.querySelector("#reset-samples"),
  toast: document.querySelector("#toast"),
};

let templates = loadTemplates();

function loadTemplates() {
  const savedTemplates = localStorage.getItem(STORAGE_KEY);
  if (!savedTemplates) return sampleTemplates;

  try {
    const parsedTemplates = JSON.parse(savedTemplates);
    return Array.isArray(parsedTemplates) ? parsedTemplates : sampleTemplates;
  } catch {
    return sampleTemplates;
  }
}

function saveTemplates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function getFilteredTemplates() {
  const keyword = elements.search.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;

  return templates.filter((template) => {
    const matchesCategory = category === "all" || template.category === category;
    const searchableText = `${template.title} ${template.category} ${template.body}`.toLowerCase();
    return matchesCategory && searchableText.includes(keyword);
  });
}

function renderCategoryOptions() {
  const categories = [...new Set(templates.map((template) => template.category))].sort();
  const currentValue = elements.categoryFilter.value;

  elements.categoryFilter.innerHTML = '<option value="all">すべてのカテゴリ</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  });

  elements.categoryFilter.value = categories.includes(currentValue) ? currentValue : "all";
}

function renderTemplates() {
  const filteredTemplates = getFilteredTemplates();
  elements.count.textContent = `${filteredTemplates.length}件`;
  elements.list.innerHTML = "";

  if (filteredTemplates.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "該当するテンプレートがありません。";
    elements.list.append(empty);
    return;
  }

  filteredTemplates.forEach((template) => {
    const card = document.createElement("article");
    card.className = "template-card";

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = template.title;
    const category = document.createElement("span");
    category.className = "category-pill";
    category.textContent = template.category;
    header.append(title, category);

    const body = document.createElement("p");
    body.className = "template-body";
    body.textContent = template.body;

    const actions = document.createElement("div");
    actions.className = "template-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "コピー";
    copyButton.addEventListener("click", () => copyTemplate(template.body));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => deleteTemplate(template.id));

    actions.append(copyButton, deleteButton);
    card.append(header, body, actions);
    elements.list.append(card);
  });
}

async function copyTemplate(text) {
  await navigator.clipboard.writeText(text);
  showToast("テンプレートをコピーしました");
}

function deleteTemplate(id) {
  templates = templates.filter((template) => template.id !== id);
  saveTemplates();
  render();
  showToast("テンプレートを削除しました");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.setTimeout(() => elements.toast.classList.remove("is-visible"), 1800);
}

function render() {
  renderCategoryOptions();
  renderTemplates();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const template = {
    id: crypto.randomUUID(),
    title: elements.title.value.trim(),
    category: elements.category.value.trim(),
    body: elements.body.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  templates = [template, ...templates];
  saveTemplates();
  elements.form.reset();
  render();
  showToast("テンプレートを保存しました");
});

elements.search.addEventListener("input", renderTemplates);
elements.categoryFilter.addEventListener("change", renderTemplates);
elements.resetSamples.addEventListener("click", () => {
  templates = sampleTemplates.map((template) => ({
    ...template,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  }));
  saveTemplates();
  render();
  showToast("サンプルを復元しました");
});

render();
