// Service worker for Promptly Extension
importScripts("../lib/browser-polyfill.js");

browser.runtime.onInstalled.addListener(() => {
  console.log("Promptly extension installed");

  // Create context menu for saving selected text as a prompt
  browser.contextMenus.create({
    id: "save-to-promptly",
    title: 'Save to Promptly: "%s"',
    contexts: ["selection"],
  });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-promptly" && info.selectionText) {
    try {
      const result = await browser.storage.local.get("prompts");
      const prompts = result.prompts || [];

      const selectedText = info.selectionText.trim();
      // Generate a title from the first ~50 chars
      const autoTitle =
        selectedText.length > 50
          ? selectedText.substring(0, 50) + "..."
          : selectedText;

      const newPrompt = {
        id: Date.now().toString(),
        title: autoTitle,
        body: selectedText,
        tags: ["saved-from-page"],
        folderId: "",
        favorite: false,
        useCount: 0,
        createdAt: Date.now(),
        history: [],
      };

      prompts.unshift(newPrompt);
      await browser.storage.local.set({ prompts });

      // Notify the user (badge flash)
      await browser.action.setBadgeText({ text: "✓" });
      await browser.action.setBadgeBackgroundColor({
        color: "#4CAF50",
      });
      setTimeout(async () => {
        await browser.action.setBadgeText({ text: "" });
      }, 2000);
    } catch (err) {
      console.error("Context menu save error:", err);
    }
  }
});

// Listen for messages from popup (e.g., insert into active tab)
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "insert-into-page") {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            const el = document.activeElement;
            if (
              el &&
              (el.tagName === "TEXTAREA" ||
                el.tagName === "INPUT" ||
                el.isContentEditable)
            ) {
              if (el.isContentEditable) {
                document.execCommand("insertText", false, text);
              } else {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                el.value =
                  el.value.substring(0, start) +
                  text +
                  el.value.substring(end);
                el.selectionStart = el.selectionEnd =
                  start + text.length;
                el.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
              }
            }
          },
          args: [message.text],
        });
      }
    } catch (err) {
      console.error("Insert into page error:", err);
    }
  }
});