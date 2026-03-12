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
*   **Chrome Storage Sync & Local:** Uses the Storage API to keep tags synchronized between devices and perform local safety caching.
*   **Dynamic i18n:** Implements a custom localization system that allows for instant language changes without a page refresh.
*   **MutationObserver:** Used to efficiently and reactivaely detect when new notebooks are added to the list or when navigation occurs.
*   **Data Fragmentation (Chunking):** Sophisticated system to overcome the 8KB limit of Chrome Sync storage by splitting data into chunks.
*   **Predefined extension ID:** The `manifest.json` file includes a public key (`key`) to ensure the extension ID is identical across all manual installations.
*   **Permissions:**
    *   `storage`: To save and sync your tags and preferences.

---

## 💾 Data management and security (Experimental Branch)

NotebookLM Organizer features an adaptive synchronization engine with **heuristic recovery** to ensure maximum security for your organization:

### 🛠️ Working in development mode (manual installation)
In this mode, the extension activates a **dual redundancy security system**:

-   **Persistent local backup (LocalStorage):** In addition to the cloud, your tags are physically saved in each device's local database.
-   **Heuristic recovery (Guardian effect):** If your Google account data is deleted (due to an uninstallation on another PC), any device where you keep the extension installed will detect the anomaly. If the cloud appears empty or with a massive loss of data (**having at least 3 tags and detecting less than half than local**), the extension will **automatically merge** the cloud data with its local copy to resurrect your configuration.
-   **Persistent warning:** You will see an info banner in the tag management modal.

### 🏪 Working in store mode (Chrome Web Store)
In the official store, the extension simplifies its logic and fully trusts the native Google Sync infrastructure, operating without redundant local backups.

### ⚠️ Security recommendations
-   **Always keep a "guardian":** As long as you keep the extension installed on at least one device, your data can be automatically recovered thanks to local redundancy.
-   **Manual export (💾):** Perform periodic backups in JSON. It is your ultimate safety net. *Shit happens* 😅.
-   **Updates:** Do not uninstall the extension to update in dev mode. Overwrite the files and click reload at `chrome://extensions`.

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

## 📝 Note on Publishing to the Chrome Web Store

Since the extension relies on analyzing the DOM structure of the NotebookLM application, which can change at any time without notice, the author prefers not to publish it to the Chrome Web Store for now. The maintenance cost and the need to adapt to frequent changes make it more practical to distribute it as an open-source project for manual installation.

> **Important for Publishing:** If you wish to publish your own version to the Store, the file **`extension/manifest.webstore.json`** has been included. This file is a "clean" version that **does not include the `key` property**, which is essential for Google to assign an official ID to your publication. 
> 
> To use it, simply rename `manifest.webstore.json` to `manifest.json` (overwriting the original) right before compressing the `extension` folder into a `.zip` file for upload to the developer console.

---

## 🤝 Credits

This project was created and is maintained by **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

---

## 📄 License

This project is distributed under the terms of the [LICENSE](LICENSE) file.
