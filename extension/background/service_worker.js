// Service worker for Promptly Extension
importScripts("../lib/browser-polyfill.js");

browser.runtime.onInstalled.addListener(() => {
  console.log("Promptly extension installed");
});
