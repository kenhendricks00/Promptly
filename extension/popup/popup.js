// popup.js — Promptly v1.1

let prompts = [];
let folders = [];
let recentIds = [];
let editId = null;
let selectedIds = new Set();
let activeTagFilter = null;
let activeFolderFilter = "all";
let kbIndex = -1;
let themeOverride = null; // null = auto, 'dark', 'light'

// DOM Elements
const promptsList = document.getElementById("prompts-list");
const addBtn = document.getElementById("add-btn");
const searchInput = document.getElementById("search-input");
const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");
const themeToggle = document.getElementById("theme-toggle");
const folderSelect = document.getElementById("folder-select");
const tagFilterBar = document.getElementById("tag-filter");
const recentSection = document.getElementById("recent-section");
const recentList = document.getElementById("recent-list");
const bulkBar = document.getElementById("bulk-bar");
const bulkCount = document.getElementById("bulk-count");

// Modal Elements
const modal = document.getElementById("prompt-modal");
const modalTitle = document.getElementById("modal-title");
const titleInput = document.getElementById("prompt-title");
const bodyInput = document.getElementById("prompt-body");
const tagsInput = document.getElementById("prompt-tags");
const folderInput = document.getElementById("prompt-folder");
const favoriteInput = document.getElementById("prompt-favorite");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");
const charCount = document.getElementById("char-count");
const historyBtn = document.getElementById("history-btn");

// Template modal
const templateModal = document.getElementById("template-modal");
const templateFields = document.getElementById("template-fields");
const templateCancelBtn = document.getElementById("template-cancel-btn");
const templateGoBtn = document.getElementById("template-go-btn");

// Folder modal
const folderModal = document.getElementById("folder-modal");
const manageFoldersBtn = document.getElementById("manage-folders-btn");
const newFolderInput = document.getElementById("new-folder-input");
const addFolderBtn = document.getElementById("add-folder-btn");
const folderList = document.getElementById("folder-list");
const folderCloseBtn = document.getElementById("folder-close-btn");

// History modal
const historyModal = document.getElementById("history-modal");
const historyList = document.getElementById("history-list");
const historyCloseBtn = document.getElementById("history-close-btn");

// Move modal
const moveModal = document.getElementById("move-modal");
const moveFolderSelect = document.getElementById("move-folder-select");
const moveCancelBtn = document.getElementById("move-cancel-btn");
const moveConfirmBtn = document.getElementById("move-confirm-btn");

// Share modal
const shareModal = document.getElementById("share-modal");
const shareLink = document.getElementById("share-link");
const shareCloseBtn = document.getElementById("share-close-btn");
const shareCopyBtn = document.getElementById("share-copy-btn");

// Bulk
const bulkMoveBtn = document.getElementById("bulk-move-btn");
const bulkExportBtn = document.getElementById("bulk-export-btn");
const bulkDeleteBtn = document.getElementById("bulk-delete-btn");

// Onboarding
const onboarding = document.getElementById("onboarding");
const onboardingCloseBtn = document.getElementById("onboarding-close-btn");

// Toast
const toast = document.getElementById("toast");

// ─── INIT ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadAll();
  applyTheme();
  checkOnboarding();
  renderAll();
  setupKeyboardNav();
});

async function loadAll() {
  try {
    const result = await browser.storage.local.get([
      "prompts",
      "folders",
      "recentIds",
      "themeOverride",
    ]);
    prompts = result.prompts || [];
    folders = result.folders || [];
    recentIds = result.recentIds || [];
    themeOverride = result.themeOverride || null;
    prompts.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.createdAt - a.createdAt;
    });
  } catch (err) {
    console.error("Error loading data:", err);
    prompts = [];
    folders = [];
    recentIds = [];
  }
}

async function saveAll() {
  try {
    await browser.storage.local.set({
      prompts,
      folders,
      recentIds,
      themeOverride,
    });
  } catch (err) {
    console.error("Error saving data:", err);
  }
}

function renderAll() {
  renderFolderOptions();
  renderTagFilterBar();
  renderRecentPrompts();
  renderPrompts();
  updateBulkBar();
}

// ─── THEME ─────────────────────────────────────────────
function applyTheme() {
  if (themeOverride) {
    document.documentElement.setAttribute("data-theme", themeOverride);
    themeToggle.textContent = themeOverride === "dark" ? "☀️" : "🌙";
  } else {
    document.documentElement.removeAttribute("data-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    themeToggle.textContent = prefersDark ? "☀️" : "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  const isDark =
    themeOverride === "dark" ||
    (!themeOverride &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  themeOverride = isDark ? "light" : "dark";
  applyTheme();
  saveAll();
});

// ─── ONBOARDING ────────────────────────────────────────
async function checkOnboarding() {
  const result = await browser.storage.local.get("onboardingDone");
  if (!result.onboardingDone) {
    onboarding.classList.remove("hidden");
  }
}

onboardingCloseBtn.addEventListener("click", async () => {
  onboarding.classList.add("hidden");
  await browser.storage.local.set({ onboardingDone: true });
});

onboarding.addEventListener("click", (e) => {
  if (e.target === onboarding) onboarding.classList.add("hidden");
});

// ─── FOLDERS ───────────────────────────────────────────
function renderFolderOptions() {
  // Main filter
  folderSelect.innerHTML = '<option value="all">All Folders</option>';
  folders.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    folderSelect.appendChild(opt);
  });
  folderSelect.value = activeFolderFilter;

  // Modal select
  folderInput.innerHTML = '<option value="">No Folder</option>';
  folders.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    folderInput.appendChild(opt);
  });

  // Move modal select
  moveFolderSelect.innerHTML = '<option value="">No Folder</option>';
  folders.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    moveFolderSelect.appendChild(opt);
  });
}

function renderFolderList() {
  folderList.innerHTML = "";
  if (folders.length === 0) {
    folderList.innerHTML =
      '<div style="font-size:12px;color:var(--text-muted);padding:8px;">No folders yet.</div>';
    return;
  }
  folders.forEach((f) => {
    const item = document.createElement("div");
    item.className = "folder-item";

    const label = document.createElement("span");
    const dot = document.createElement("span");
    dot.className = "folder-color";
    dot.style.background = f.color || "var(--primary)";
    label.appendChild(dot);
    label.appendChild(document.createTextNode(f.name));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => {
      folders = folders.filter((x) => x.id !== f.id);
      // Remove folder from prompts
      prompts.forEach((p) => {
        if (p.folderId === f.id) p.folderId = "";
      });
      saveAll();
      renderFolderList();
      renderFolderOptions();
      renderPrompts();
    });

    item.appendChild(label);
    item.appendChild(delBtn);
    folderList.appendChild(item);
  });
}

manageFoldersBtn.addEventListener("click", () => {
  folderModal.classList.remove("hidden");
  renderFolderList();
});

folderCloseBtn.addEventListener("click", () =>
  folderModal.classList.add("hidden")
);
folderModal.addEventListener("click", (e) => {
  if (e.target === folderModal) folderModal.classList.add("hidden");
});

addFolderBtn.addEventListener("click", () => {
  const name = newFolderInput.value.trim();
  if (!name) return;
  const colors = [
    "#4361ee",
    "#f72585",
    "#4cc9f0",
    "#f5a623",
    "#7209b7",
    "#06d6a0",
    "#ef476f",
  ];
  folders.push({
    id: Date.now().toString(),
    name,
    color: colors[folders.length % colors.length],
  });
  newFolderInput.value = "";
  saveAll();
  renderFolderList();
  renderFolderOptions();
});

folderSelect.addEventListener("change", (e) => {
  activeFolderFilter = e.target.value;
  renderPrompts();
});

// ─── TAG FILTER BAR ────────────────────────────────────
function renderTagFilterBar() {
  tagFilterBar.innerHTML = "";
  const allTags = new Set();
  prompts.forEach((p) => p.tags.forEach((t) => allTags.add(t)));

  allTags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className =
      "tag-filter-btn" + (activeTagFilter === tag ? " active" : "");
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      activeTagFilter = activeTagFilter === tag ? null : tag;
      renderTagFilterBar();
      renderPrompts();
    });
    tagFilterBar.appendChild(btn);
  });
}

// ─── RECENT PROMPTS ────────────────────────────────────
function renderRecentPrompts() {
  const recentPrompts = recentIds
    .map((id) => prompts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 5);

  if (recentPrompts.length === 0) {
    recentSection.classList.add("hidden");
    return;
  }

  recentSection.classList.remove("hidden");
  recentList.innerHTML = "";

  recentPrompts.forEach((p) => {
    const chip = document.createElement("button");
    chip.className = "recent-chip";
    chip.textContent = p.title;
    chip.addEventListener("click", () => handlePromptClick(p));
    recentList.appendChild(chip);
  });
}

function trackRecent(id) {
  recentIds = recentIds.filter((r) => r !== id);
  recentIds.unshift(id);
  if (recentIds.length > 10) recentIds = recentIds.slice(0, 10);
  saveAll();
  renderRecentPrompts();
}

// ─── RENDER PROMPTS ────────────────────────────────────
function renderPrompts() {
  const filterText = searchInput.value.toLowerCase();
  promptsList.innerHTML = "";
  kbIndex = -1;

  let filtered = prompts.filter((p) => {
    const matchesText =
      p.title.toLowerCase().includes(filterText) ||
      p.body.toLowerCase().includes(filterText) ||
      p.tags.some((t) => t.toLowerCase().includes(filterText));
    const matchesFolder =
      activeFolderFilter === "all" || p.folderId === activeFolderFilter;
    const matchesTag = !activeTagFilter || p.tags.includes(activeTagFilter);
    return matchesText && matchesFolder && matchesTag;
  });

  if (filtered.length === 0) {
    promptsList.innerHTML =
      '<div class="empty-state">No prompts found. Click + to add one.</div>';
    return;
  }

  if (selectedIds.size > 0) {
    promptsList.classList.add("select-mode");
  } else {
    promptsList.classList.remove("select-mode");
  }

  filtered.forEach((prompt) => {
    const item = document.createElement("div");
    item.className = "prompt-item";
    item.dataset.id = prompt.id;
    if (selectedIds.has(prompt.id)) item.classList.add("selected");

    // Checkbox for bulk select
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-checkbox";
    checkbox.checked = selectedIds.has(prompt.id);
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSelect(prompt.id);
    });
    item.appendChild(checkbox);

    // Header
    const header = document.createElement("div");
    header.className = "prompt-header";

    const titleRow = document.createElement("div");
    titleRow.className = "prompt-title-row";

    if (prompt.favorite) {
      const star = document.createElement("span");
      star.className = "favorite-star";
      star.textContent = "⭐";
      titleRow.appendChild(star);
    }

    const title = document.createElement("div");
    title.className = "prompt-title";
    title.textContent = prompt.title;
    titleRow.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "prompt-actions";

    const shareBtn = document.createElement("button");
    shareBtn.className = "action-btn";
    shareBtn.textContent = "Share";
    shareBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openShareModal(prompt);
    });

    const editBtnEl = document.createElement("button");
    editBtnEl.className = "action-btn";
    editBtnEl.textContent = "Edit";
    editBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(prompt);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Delete this prompt?")) {
        deletePrompt(prompt.id);
      }
    });

    actions.appendChild(shareBtn);
    actions.appendChild(editBtnEl);
    actions.appendChild(deleteBtn);
    header.appendChild(titleRow);
    header.appendChild(actions);

    // Meta row
    const meta = document.createElement("div");
    meta.className = "prompt-meta";

    if (prompt.useCount) {
      const useSpan = document.createElement("span");
      useSpan.className = "use-count";
      useSpan.textContent = `Used ${prompt.useCount}x`;
      meta.appendChild(useSpan);
    }

    const folder = folders.find((f) => f.id === prompt.folderId);
    if (folder) {
      const folderBadge = document.createElement("span");
      folderBadge.className = "prompt-folder-badge";
      folderBadge.textContent = folder.name;
      meta.appendChild(folderBadge);
    }

    // Body preview (click to expand)
    const preview = document.createElement("div");
    preview.className = "prompt-body-preview";
    preview.textContent = prompt.body;
    preview.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.toggle("expanded");
    });

    // Full body (shown when expanded)
    const fullBody = document.createElement("div");
    fullBody.className = "prompt-body-full";
    fullBody.textContent = prompt.body;

    // Bottom row
    const bottomRow = document.createElement("div");
    bottomRow.className = "prompt-bottom-row";

    const tagsDiv = document.createElement("div");
    tagsDiv.className = "prompt-tags";
    prompt.tags.forEach((tag) => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag";
      tagSpan.textContent = tag;
      tagsDiv.appendChild(tagSpan);
    });

    const charInfo = document.createElement("span");
    charInfo.className = "char-count-inline";
    charInfo.textContent = `${prompt.body.length}c · ~${estimateTokens(prompt.body)}t`;

    bottomRow.appendChild(tagsDiv);
    bottomRow.appendChild(charInfo);

    item.appendChild(header);
    if (meta.children.length > 0)
      item.appendChild(header);
    if (meta.children.length > 0) {
      item.appendChild(meta);
    }
    item.appendChild(preview);
    item.appendChild(fullBody);
    item.appendChild(bottomRow);

    // Click to copy (main action)
    item.addEventListener("click", () => handlePromptClick(prompt));

    promptsList.appendChild(item);
  });
}

// ─── PROMPT CLICK (COPY / TEMPLATE) ───────────────────
function handlePromptClick(prompt) {
  const templateVars = extractTemplateVars(prompt.body);
  if (templateVars.length > 0) {
    openTemplateModal(prompt, templateVars);
  } else {
    copyAndTrack(prompt);
  }
}

function copyAndTrack(prompt, finalText = null) {
  const text = finalText || prompt.body;
  copyToClipboard(text, prompt.title);
  // Increment usage
  const idx = prompts.findIndex((p) => p.id === prompt.id);
  if (idx !== -1) {
    prompts[idx].useCount = (prompts[idx].useCount || 0) + 1;
  }
  trackRecent(prompt.id);
  saveAll();
}

// ─── TEMPLATE VARIABLES ───────────────────────────────
function extractTemplateVars(text) {
  const regex = /\{\{(\w[\w\s]*?)\}\}/g;
  const vars = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    if (!vars.includes(name)) vars.push(name);
  }
  return vars;
}

let pendingTemplatePrompt = null;

function openTemplateModal(prompt, vars) {
  pendingTemplatePrompt = prompt;
  templateFields.innerHTML = "";
  vars.forEach((v) => {
    const label = document.createElement("label");
    label.style.cssText =
      "display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--text-main);";
    label.textContent = v;
    const input = document.createElement("input");
    input.className = "glass-input";
    input.placeholder = `Enter ${v}...`;
    input.dataset.var = v;
    label.appendChild(input);
    templateFields.appendChild(label);
  });
  templateModal.classList.remove("hidden");
  const firstInput = templateFields.querySelector("input");
  if (firstInput) firstInput.focus();
}

templateCancelBtn.addEventListener("click", () => {
  templateModal.classList.add("hidden");
  pendingTemplatePrompt = null;
});

templateModal.addEventListener("click", (e) => {
  if (e.target === templateModal) {
    templateModal.classList.add("hidden");
    pendingTemplatePrompt = null;
  }
});

templateGoBtn.addEventListener("click", () => {
  if (!pendingTemplatePrompt) return;
  let finalText = pendingTemplatePrompt.body;
  const inputs = templateFields.querySelectorAll("input");
  inputs.forEach((input) => {
    const varName = input.dataset.var;
    const value = input.value || varName;
    const regex = new RegExp(`\\{\\{\\s*${escapeRegex(varName)}\\s*\\}\\}`, "g");
    finalText = finalText.replace(regex, value);
  });
  copyAndTrack(pendingTemplatePrompt, finalText);
  templateModal.classList.add("hidden");
  pendingTemplatePrompt = null;
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── CRUD ──────────────────────────────────────────────
function addPrompt(title, body, tags, folderId, favorite) {
  const newPrompt = {
    id: Date.now().toString(),
    title,
    body,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t),
    folderId: folderId || "",
    favorite: favorite || false,
    useCount: 0,
    createdAt: Date.now(),
    history: [],
  };
  prompts.unshift(newPrompt);
  sortPrompts();
  saveAll();
  renderAll();
}

function updatePrompt(id, title, body, tags, folderId, favorite) {
  const index = prompts.findIndex((p) => p.id === id);
  if (index !== -1) {
    const old = prompts[index];
    // Save version history
    if (!old.history) old.history = [];
    old.history.push({
      body: old.body,
      title: old.title,
      tags: [...old.tags],
      savedAt: Date.now(),
    });
    // Keep last 20 versions
    if (old.history.length > 20) {
      old.history = old.history.slice(-20);
    }

    prompts[index] = {
      ...old,
      title,
      body,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      folderId: folderId || "",
      favorite: favorite || false,
      updatedAt: Date.now(),
    };
    sortPrompts();
    saveAll();
    renderAll();
  }
}

function deletePrompt(id) {
  prompts = prompts.filter((p) => p.id !== id);
  recentIds = recentIds.filter((r) => r !== id);
  selectedIds.delete(id);
  saveAll();
  renderAll();
}

function sortPrompts() {
  prompts.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.createdAt - a.createdAt;
  });
}

// ─── MODAL (ADD/EDIT) ─────────────────────────────────
function openModal(prompt = null) {
  modal.classList.remove("hidden");
  renderFolderOptions();
  if (prompt) {
    editId = prompt.id;
    modalTitle.textContent = "Edit Prompt";
    titleInput.value = prompt.title;
    bodyInput.value = prompt.body;
    tagsInput.value = prompt.tags.join(", ");
    folderInput.value = prompt.folderId || "";
    favoriteInput.checked = prompt.favorite || false;
    historyBtn.classList.toggle(
      "hidden",
      !prompt.history || prompt.history.length === 0
    );
  } else {
    editId = null;
    modalTitle.textContent = "New Prompt";
    titleInput.value = "";
    bodyInput.value = "";
    tagsInput.value = "";
    folderInput.value = "";
    favoriteInput.checked = false;
    historyBtn.classList.add("hidden");
  }
  updateCharCount();
  titleInput.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  editId = null;
}

addBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", () => closeModal());

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  const tags = tagsInput.value.trim();
  const folderId = folderInput.value;
  const favorite = favoriteInput.checked;

  if (!title || !body) {
    alert("Title and content are required.");
    return;
  }

  if (editId) {
    updatePrompt(editId, title, body, tags, folderId, favorite);
  } else {
    addPrompt(title, body, tags, folderId, favorite);
  }

  closeModal();
});

// Char / token count
bodyInput.addEventListener("input", updateCharCount);

function updateCharCount() {
  const len = bodyInput.value.length;
  const tokens = estimateTokens(bodyInput.value);
  charCount.textContent = `${len} chars · ~${tokens} tokens`;
}

function estimateTokens(text) {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

// ─── VERSION HISTORY ──────────────────────────────────
historyBtn.addEventListener("click", () => {
  if (!editId) return;
  const prompt = prompts.find((p) => p.id === editId);
  if (!prompt || !prompt.history || prompt.history.length === 0) return;

  historyList.innerHTML = "";
  // Show newest first
  [...prompt.history].reverse().forEach((version, i) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const date = document.createElement("div");
    date.className = "history-date";
    date.textContent = new Date(version.savedAt).toLocaleString();

    const preview = document.createElement("div");
    preview.className = "history-preview";
    preview.textContent = version.body;

    item.appendChild(date);
    item.appendChild(preview);

    // Click to restore
    item.addEventListener("click", () => {
      if (
        confirm("Restore this version? Current unsaved changes will be lost.")
      ) {
        titleInput.value = version.title || titleInput.value;
        bodyInput.value = version.body;
        tagsInput.value = (version.tags || []).join(", ");
        updateCharCount();
        historyModal.classList.add("hidden");
      }
    });

    historyList.appendChild(item);
  });

  historyModal.classList.remove("hidden");
});

historyCloseBtn.addEventListener("click", () =>
  historyModal.classList.add("hidden")
);
historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) historyModal.classList.add("hidden");
});

// ─── SHARE ─────────────────────────────────────────────
function openShareModal(prompt) {
  const shareData = {
    title: prompt.title,
    body: prompt.body,
    tags: prompt.tags,
  };
  const encoded = btoa(
    unescape(encodeURIComponent(JSON.stringify(shareData)))
  );
  const link = `https://promptly.share/#import=${encoded}`;
  shareLink.value = link;
  shareModal.classList.remove("hidden");
}

shareCloseBtn.addEventListener("click", () =>
  shareModal.classList.add("hidden")
);
shareModal.addEventListener("click", (e) => {
  if (e.target === shareModal) shareModal.classList.add("hidden");
});

shareCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    showToast("Share link copied!");
  } catch (err) {
    console.error("Failed to copy share link:", err);
  }
});

// ─── BULK OPERATIONS ──────────────────────────────────
function toggleSelect(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  renderPrompts();
  updateBulkBar();
}

function updateBulkBar() {
  if (selectedIds.size > 0) {
    bulkBar.classList.remove("hidden");
    bulkCount.textContent = `${selectedIds.size} selected`;
  } else {
    bulkBar.classList.add("hidden");
  }
}

bulkDeleteBtn.addEventListener("click", () => {
  if (
    !confirm(`Delete ${selectedIds.size} selected prompt(s)?`)
  )
    return;
  prompts = prompts.filter((p) => !selectedIds.has(p.id));
  recentIds = recentIds.filter((r) => !selectedIds.has(r));
  selectedIds.clear();
  saveAll();
  renderAll();
});

bulkExportBtn.addEventListener("click", () => {
  const selected = prompts.filter((p) => selectedIds.has(p.id));
  downloadJSON(selected, "promptly_selected_export.json");
});

bulkMoveBtn.addEventListener("click", () => {
  renderFolderOptions();
  moveModal.classList.remove("hidden");
});

moveCancelBtn.addEventListener("click", () =>
  moveModal.classList.add("hidden")
);
moveModal.addEventListener("click", (e) => {
  if (e.target === moveModal) moveModal.classList.add("hidden");
});

moveConfirmBtn.addEventListener("click", () => {
  const targetFolder = moveFolderSelect.value;
  prompts.forEach((p) => {
    if (selectedIds.has(p.id)) {
      p.folderId = targetFolder;
    }
  });
  selectedIds.clear();
  moveModal.classList.add("hidden");
  saveAll();
  renderAll();
});

// ─── SEARCH ────────────────────────────────────────────
searchInput.addEventListener("input", () => {
  renderPrompts();
});

// ─── CLIPBOARD ─────────────────────────────────────────
async function copyToClipboard(text, title = "") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(title ? `Copied: ${title}` : "Copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

function showToast(message = "Copied to clipboard!") {
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2000);
}

// ─── EXPORT / IMPORT ──────────────────────────────────
exportBtn.addEventListener("click", () => {
  const exportData = { prompts, folders };
  downloadJSON(exportData, "promptly_export.json");
});

function downloadJSON(data, filename) {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(data, null, 2));
  const anchor = document.createElement("a");
  anchor.setAttribute("href", dataStr);
  anchor.setAttribute("download", filename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);

      // Support both old format (array) and new format ({prompts, folders})
      let importedPrompts = [];
      let importedFolders = [];

      if (Array.isArray(imported)) {
        importedPrompts = imported;
      } else if (imported.prompts) {
        importedPrompts = imported.prompts || [];
        importedFolders = imported.folders || [];
      }

      const existingPromptIds = new Set(prompts.map((p) => p.id));
      const existingFolderIds = new Set(folders.map((f) => f.id));
      let addedPrompts = 0;
      let addedFolders = 0;

      importedFolders.forEach((f) => {
        if (f.id && f.name && !existingFolderIds.has(f.id)) {
          folders.push(f);
          addedFolders++;
        }
      });

      importedPrompts.forEach((p) => {
        if (p.id && p.title && p.body && !existingPromptIds.has(p.id)) {
          // Ensure new fields exist
          p.folderId = p.folderId || "";
          p.favorite = p.favorite || false;
          p.useCount = p.useCount || 0;
          p.history = p.history || [];
          prompts.push(p);
          addedPrompts++;
        }
      });

      sortPrompts();
      saveAll();
      renderAll();
      alert(
        `Imported ${addedPrompts} prompt(s)` +
        (addedFolders > 0 ? ` and ${addedFolders} folder(s).` : ".")
      );
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to parse JSON file.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// ─── KEYBOARD NAVIGATION ──────────────────────────────
function setupKeyboardNav() {
  document.addEventListener("keydown", (e) => {
    // Don't intercept when typing in inputs
    const tag = document.activeElement.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT"
    )
      return;

    const items = promptsList.querySelectorAll(".prompt-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      kbIndex = Math.min(kbIndex + 1, items.length - 1);
      updateKbFocus(items);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      kbIndex = Math.max(kbIndex - 1, 0);
      updateKbFocus(items);
    } else if (e.key === "Enter" && kbIndex >= 0) {
      e.preventDefault();
      items[kbIndex].click();
    } else if (e.key === "/" || e.key === "s") {
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === "n") {
      e.preventDefault();
      openModal();
    } else if (e.key === "Escape") {
      // Clear selection mode
      if (selectedIds.size > 0) {
        selectedIds.clear();
        renderPrompts();
        updateBulkBar();
      }
    } else if (e.key === "x" && kbIndex >= 0) {
      // Toggle select with x
      e.preventDefault();
      const id = items[kbIndex].dataset.id;
      if (id) toggleSelect(id);
    }
  });
}

function updateKbFocus(items) {
  items.forEach((item) => item.classList.remove("kb-focused"));
  if (kbIndex >= 0 && kbIndex < items.length) {
    items[kbIndex].classList.add("kb-focused");
    items[kbIndex].scrollIntoView({ block: "nearest" });
  }
}

// ─── HANDLE IMPORT FROM SHARE LINK ────────────────────
(function checkShareImport() {
  try {
    const hash = window.location.hash;
    if (!hash.includes("#import=")) return;
    const encoded = hash.split("#import=")[1];
    if (!encoded) return;
    const decoded = JSON.parse(
      decodeURIComponent(escape(atob(encoded)))
    );
    if (decoded.title && decoded.body) {
      const existing = prompts.find(
        (p) => p.title === decoded.title && p.body === decoded.body
      );
      if (!existing) {
        addPrompt(
          decoded.title,
          decoded.body,
          (decoded.tags || []).join(", "),
          "",
          false
        );
        showToast(`Imported: ${decoded.title}`);
      }
    }
    // Clean the hash
    window.location.hash = "";
  } catch (err) {
    console.error("Share import error:", err);
  }
})();