## v1.1.0 (03/16/2026)

#### **🚀 New Features**
- **`Platform-Specific Organization`**  
    - Reorganized the extension structure to include dedicated `platform/chromium` and `platform/firefox` directories.  
    - This allows for easier maintenance and platform-specific manifest configurations while sharing core source code.  
- **`Enhanced Documentation`**  
    - Comprehensive update to `README.md` with accurate manual installation instructions for all supported browsers.  
    - Added project walkthroughs and technical documentation for improved maintainability.  

#### **🔧 Enhancements**
- **`Unified Cross-Browser Core`**  
    - Fully integrated `webextension-polyfill` to ensure seamless operation across Chrome (`chrome.*`) and Firefox (`browser.*`) APIs.  
- **`Community Integration`**  
    - Improved fetching and importing of curated prompts from the `community-prompts.json` library.  

#### **🔍 Technical Details**
- **`New Directories`**  
    - `platform/chromium/` – Contains Chrome-specific `manifest.json`.  
    - `platform/firefox/` – Contains Firefox-specific `manifest.json`.  
- **`Modified Files`**  
    - `README.md` – Rewritten to reflect new project architecture and installation flows.  
    - `CHANGELOG.md` – Initialized and refined to track Promptly developments.  

***

## v1.0.0 (03/16/2026)

#### **🚀 New Features**
- **`Modern Glassmorphic UI`**  
    - High-fidelity frosted glass appearance with animated gradient backgrounds and Lucide Icons integration.  
- **`Advanced Prompt Library`**  
    - Create, save, and organize AI prompts with custom tags and a powerful search/filter system.  
- **`Dynamic Variables`**  
    - Full support for `{{variables}}` within prompts, allowing users to fill in templates before copying.  
- **`Community Library`**  
    - One-click import for curated high-quality prompts from a built-in community collection.  
- **`Data Portability`**  
    - Complete JSON-based Import and Export functionality for local backups and multi-device sync.  
- **`Privacy First Architecture`**  
    - Works entirely offline using `browser.storage.local`. No external servers or telemetry.  

#### **🔍 Technical Details**
- **`Core Files`**  
    - `src/popup/` – HTML/CSS/JS for the main extension interface.  
    - `src/background/` – Service worker logic for background tasks and message handling.  
    - `src/lib/` – Modular utility functions and polyfills.  
    - `community-prompts.json` – The source-of-truth for initial curated community prompts.
