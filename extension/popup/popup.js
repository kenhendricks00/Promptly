// popup.js

let prompts = [];
let editId = null;

// DOM Elements
const promptsList = document.getElementById("prompts-list");
const addBtn = document.getElementById("add-btn");
const searchInput = document.getElementById("search-input");
const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");

// Modal Elements
const modal = document.getElementById("prompt-modal");
const modalTitle = document.getElementById("modal-title");
const titleInput = document.getElementById("prompt-title");
const bodyInput = document.getElementById("prompt-body");
const tagsInput = document.getElementById("prompt-tags");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");

// Toast
const toast = document.getElementById("toast");

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadPrompts();
  renderPrompts();
});

// Load prompts from storage
async function loadPrompts() {
  try {
    const result = await browser.storage.local.get("prompts");
    prompts = result.prompts || [];
    // Sort by newest first
    prompts.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error loading prompts:", error);
    prompts = [];
  }
}

// Save prompts to storage
async function savePrompts() {
  try {
    await browser.storage.local.set({ prompts });
    renderPrompts();
  } catch (error) {
    console.error("Error saving prompts:", error);
  }
}

// Render prompts list
function renderPrompts(filterText = "") {
  promptsList.innerHTML = "";
  
  const filtered = prompts.filter(p => {
    const text = filterText.toLowerCase();
    return p.title.toLowerCase().includes(text) || 
           p.tags.some(t => t.toLowerCase().includes(text));
  });

  if (filtered.length === 0) {
    promptsList.innerHTML = `<div class="empty-state">No prompts found. Click + to add one.</div>`;
    return;
  }

  filtered.forEach(prompt => {
    const item = document.createElement("div");
    item.className = "prompt-item";
    item.addEventListener("click", () => copyToClipboard(prompt.body));

    // Header
    const header = document.createElement("div");
    header.className = "prompt-header";
    
    const title = document.createElement("div");
    title.className = "prompt-title";
    title.textContent = prompt.title;

    const actions = document.createElement("div");
    actions.className = "prompt-actions";
    
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (e) => {
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

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // Body preview
    const preview = document.createElement("div");
    preview.className = "prompt-body-preview";
    preview.textContent = prompt.body;

    // Tags
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "prompt-tags";
    prompt.tags.forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag";
      tagSpan.textContent = tag;
      tagsDiv.appendChild(tagSpan);
    });

    item.appendChild(header);
    item.appendChild(preview);
    item.appendChild(tagsDiv);
    
    promptsList.appendChild(item);
  });
}

// CRUD Operations
function addPrompt(title, body, tags) {
  const newPrompt = {
    id: Date.now().toString(),
    title,
    body,
    tags: tags.split(",").map(t => t.trim()).filter(t => t),
    createdAt: Date.now()
  };
  prompts.unshift(newPrompt);
  savePrompts();
}

function updatePrompt(id, title, body, tags) {
  const index = prompts.findIndex(p => p.id === id);
  if (index !== -1) {
    prompts[index] = {
      ...prompts[index],
      title,
      body,
      tags: tags.split(",").map(t => t.trim()).filter(t => t),
      updatedAt: Date.now()
    };
    savePrompts();
  }
}

function deletePrompt(id) {
  prompts = prompts.filter(p => p.id !== id);
  savePrompts();
}

// Modal handling
function openModal(prompt = null) {
  modal.classList.remove("hidden");
  if (prompt) {
    editId = prompt.id;
    modalTitle.textContent = "Edit Prompt";
    titleInput.value = prompt.title;
    bodyInput.value = prompt.body;
    tagsInput.value = prompt.tags.join(", ");
  } else {
    editId = null;
    modalTitle.textContent = "New Prompt";
    titleInput.value = "";
    bodyInput.value = "";
    tagsInput.value = "";
  }
  titleInput.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  editId = null;
}

addBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", () => closeModal());

saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  const tags = tagsInput.value.trim();

  if (!title || !body) {
    alert("Title and content are required.");
    return;
  }

  if (editId) {
    updatePrompt(editId, title, body, tags);
  } else {
    addPrompt(title, body, tags);
  }
  
  closeModal();
});

// Close modal on outside click
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Search
searchInput.addEventListener("input", (e) => {
  renderPrompts(e.target.value);
});

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

function showToast() {
  toast.classList.remove("hidden");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2000);
}

// Export / Import
exportBtn.addEventListener("click", () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "promptly_export.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        // Simple merge: keep existing, add new ones if ID doesn't exist
        const existingIds = new Set(prompts.map(p => p.id));
        let addedCount = 0;
        
        imported.forEach(p => {
          if (p.id && p.title && p.body && !existingIds.has(p.id)) {
            prompts.push(p);
            addedCount++;
          }
        });
        
        prompts.sort((a, b) => b.createdAt - a.createdAt);
        savePrompts();
        alert(`Successfully imported ${addedCount} prompts.`);
      } else {
        alert("Invalid file format. Expected a JSON array.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to parse JSON file.");
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // reset input
});
