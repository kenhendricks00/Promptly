## v1.3.0 (01/25/2026)

#### **🚀 New Features**
- **`FMHY Notes Display`**  
    - The extension popup now shows relevant notes from the FMHY wiki when visiting mapped websites.  
- **`Live Note Fetching`**  
    - Notes are fetched from the official FMHY GitHub repository and cached for performance.  
- **`Comprehensive Domain Mapping`**  
    - 80+ domain mappings included (1337x, mobilism, yts, spicetify, movie-web, audiobookbay, etc.).  
- **`Pattern-Based Matching`**  
    - Support for sites with multiple TLDs (e.g., `yts.mx`, `yts.rs`, `yts.lt` all show the same note).  
- **`Markdown Rendering`**  
    - Notes are rendered with support for links, lists, bold, italic, and code formatting.  
- **`AMOLED Theme`**  
    - Added pure black AMOLED theme option for OLED displays, matching fmhy.net's theme options.  
- **`Unsafe Site Reasons`**  
    - Warning page and popup now display the reason why a site is flagged as unsafe.  
    - Reasons are fetched from the FMHY Filterlist repository and include clickable evidence links.  
- **`Multi-Language Support (i18n)`**  
    - Added internationalization support for 7 languages: English, Spanish, Russian, German, Portuguese, French, and Japanese.  
    - All UI elements in popup, warning page, and settings page are now translatable.  
    - Extension automatically uses the browser's language preference.  
    - Manual language selector added to settings page for user override.  
- **`Welcome Page`**  
    - New welcome page opens automatically on first install.  
    - Guides users through pinning the extension, how it works, and customizing settings.  
    - Fully translated in all 7 supported languages.  
- **`Manual Filterlist Update`**  
    - Added "Update Now" button in settings to manually trigger filterlist updates.  

#### **🔧 Enhancements**
- **`Improved Message Handling`**  
    - Converted async message listener to Promise-based pattern for better cross-browser compatibility.  
- **`Better Popup Display`**  
    - Notes appear in a styled collapsible section below the site status.  
- **`Reason Display Styling`**  
    - Popup shows reasons in a dedicated container with alert-triangle icon matching the notes feature.  
    - Warning page displays reasons in a styled box with clickable links.  
- **`Updated Documentation Website`**  
    - Added Dark Reader support to prevent forced dark mode on docs site.  
    - Replaced emoji icons with Lucide SVG icons for consistent, professional look.  
    - Added new feature cards for Unsafe Site Reasons and FMHY Notes.  
    - Improved mobile responsiveness with hamburger menu navigation.  
    - Fixed blurry rendering on mobile devices.  

#### **🐞 Bug Fixes**
- **`Fixed Async Response Handling`**  
    - Resolved issue where async message listeners returned `Promise<false>` instead of keeping the channel open.  
- **`Fixed Markdown Formatting`**  
    - Popup markdown parser now properly removes duplicate headers and handles paragraphs correctly.  
- **`Fixed Update Frequency Setting`**  
    - Resolved issue where changing update frequency (Daily/Weekly/Monthly) wasn't being applied correctly.  
    - Background script now reads from the correct storage location.  
- **`Fixed Reason Not Displaying`**  
    - Resolved issue where unsafe site reasons were not being passed to the warning page.  
    - Added fallback to fetch reasons from URL if storage is empty.  

#### **🔍 Technical Details**
- **`New Files`**  
    - `notes-mapping.js` – Standalone reference file for domain-to-note mappings.  
- **`Modified Files`**  
    - `background.js` – Added notes mapping, fetch/cache logic, `getNoteForSite` message handler, and async `getReasonForDomain` function.  
    - `index.html` – Added note and reason display sections with CSS styling.  
    - `index.js` – Added markdown parser, note fetching logic, and reason display with clickable links.  
    - `warning-page.html` – Added CSS for clickable links in reason text.
