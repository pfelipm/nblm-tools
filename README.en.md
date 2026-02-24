[🇪🇸 Versión en español](README.md) | [🦎 Versió en català](README.ca.md)

# NotebookLM Organizer 🏷️

**NotebookLM Organizer** is a browser extension designed to enhance your workspace organization in [NotebookLM](https://notebooklm.google.com). Featuring an advanced tagging system and dynamic filtering, it allows you to manage your notebooks with a fluid, fully integrated user experience that feels like a native functionality.

![notebookLM Organizer GIF](assets/overview.gif)

---

## 🔒 Privacy & Security

Privacy is at the core of this extension. NotebookLM Organizer is built following the **principle of least privilege**:

- **No Content Access:** The extension **never** reads, accesses, or processes the content of your notes, documents, or sources within your notebooks.
- **Organizational Metadata Only:** It only detects the **notebook name, source count, and creation date**. This data is used strictly to identify the notebook and link it to your tags.
- **No Data Manipulation:** The extension does not modify or manipulate your notebooks in any way. It only adds a visual organization layer on top of the existing Google UI.
- **Your Data is Yours:** All configurations are stored in your Google account (via Chrome Sync), and only you have access to them.

---

## ✨ Key Features

- 🏷️ **Color-Coded Tags:** Create custom tags with a vibrant color palette to categorize your projects visually.
- 🔍 **Advanced Filtering:** Find notebooks instantly by combining text search and tag filters with **AND** or **OR** logic.
- 🌓 **Automatic Dark Mode:** The interface automatically adapts to the theme (light or dark) set in NotebookLM, fully respecting your visual preference.
- 🔄 **Automatic Sync:** Your tags and preferences are automatically synced across all your devices via your Chrome account.
- 💾 **Granular Backup:** Export and import your settings in JSON format, allowing you to choose which elements to restore.
- 🌐 **Multi-language Support:** Interface fully localized in **English, Spanish, and Catalan**, with instant language switching from the UI.
- 💡 **Featured Notebooks Handling:** For cleanliness and convenience, the extension hides the limited preview of featured notebooks in the main "All" tab and automatically disables itself when entering the dedicated "Featured" tab.
- ⚡ **Native Interface:** Designed to provide an extended organization and search experience that feels like a native NotebookLM feature, without disrupting your workflow.

---

## ⚠️ Important Note on List View

Since NotebookLM does not expose internal unique identifiers in all its views, the extension uses a metadata-based "fingerprint" to identify each notebook.

If you have multiple notebooks with the **same name, same number of sources, and same date**, the extension will detect a **collision** in the list view and block tagging for safety to avoid association errors. In these cases, a warning icon (⚠️) will appear, and you should use the **thumbnail view** (grid) to tag them, as that view allows for retrieving a real unique identifier.

---

## ⚙️ Technical Details

*   **No Frameworks or External Dependencies:** built entirely with **Vanilla JS** and **standard CSS** to ensure maximum lightness, speed, and compatibility.
*   **Manifest V3:** The extension uses the latest version of the Chrome manifest for maximum security and performance.
*   **Chrome Storage Sync & Local:** Uses the Storage API to keep tags synchronized between devices and perform local caching.
*   **Dynamic i18n:** Implements a custom localization system that allows for instant language changes without a page refresh.
*   **MutationObserver:** Used to efficiently and reactively detect when new notebooks are added to the list or when navigation occurs.
*   **Data Fragmentation (Chunking):** Sophisticated system to overcome the 8KB limit of Chrome Sync storage by splitting data into chunks.
*   **Permissions:**
    *   `storage`: To save and sync your tags and preferences.

---

## 🛠️ Installation (in developer mode)

Follow these steps to install the extension locally:

1. Download and unzip the zip file or clone this repository on your machine.
2. Open Google Chrome and go to the extensions page: `chrome://extensions`.
3. Enable **"Developer mode"** in the upper right corner.
4. Click the **"Load unpacked"** button.
5. Select the **extension** folder within the downloaded or cloned project folder.
6. Done! The extension will appear in your list of extensions and will be active on `notebooklm.google.com`.

---

## 🤝 Credits

This project was created and is maintained by **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

---

## 📄 License

This project is distributed under the terms of the [LICENSE](LICENSE) file.
