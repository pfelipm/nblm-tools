// NotebookLM Organizer - Content Script

let notebookTags = {};
let globalTags = [];
let tagConfig = {}; // { tagName: { color: '#1a73e8' } }
let activeFilters = new Set();
let filterMode = 'AND'; // 'AND' o 'OR'
let uiLang = 'auto'; // 'auto', 'es', 'en', 'ca'
let searchQuery = '';
let currentPopover = null;
let lastClickedNotebookId = null;
let activeTooltip = null; 
let tooltipTimeout = null; 
let lastTooltipNotebookId = null;
let titleToIdMap = {}; 
let overriddenMessages = null; // Cache para traducciones manuales

const PRESET_COLORS = ['#1a73e8', '#d93025', '#188038', '#f9ab00', '#e37400', '#9334e6', '#0097a7', '#607d8b'];

// 1. UTILIDADES Y TRADUCCIÓN
function t(key, ...args) {
    let msg = "";
    if (uiLang === 'auto' || !overriddenMessages) {
        msg = chrome.i18n.getMessage(key, args);
    } else {
        msg = overriddenMessages[key]?.message || chrome.i18n.getMessage(key, args);
        // Reemplazo manual para el caso de idioma forzado
        args.forEach((val, i) => {
            msg = msg.replace(`$${i + 1}`, val);
        });
    }
    return msg || key;
}

async function loadLanguage(lang) {
    if (!lang || lang === 'auto') {
        overriddenMessages = null;
        return;
    }
    try {
        const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        overriddenMessages = await res.json();
    } catch (e) {
        console.error("NBLM Organizer - Error cargando idioma:", e);
        overriddenMessages = null;
    }
}

// 2. PERSISTENCIA Y DATOS
let saveTimeout = null;

function sanitizeData() {
    Object.keys(notebookTags).forEach(id => {
        notebookTags[id] = notebookTags[id].filter(tag => globalTags.includes(tag));
        if (notebookTags[id].length === 0) delete notebookTags[id];
    });
    Object.keys(tagConfig).forEach(tag => {
        if (!globalTags.includes(tag)) delete tagConfig[tag];
    });
}

function saveAllData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        sanitizeData();
        const fullData = { notebookTags, globalTags, titleToIdMap, tagConfig, filterMode, uiLang };
        const jsonString = JSON.stringify(fullData);
        
        chrome.storage.local.set(fullData);

        const CHUNK_SIZE = 7500;
        const chunks = {};
        for (let i = 0; i < Math.ceil(jsonString.length / CHUNK_SIZE); i++) {
            chunks[`_chunk_${i}`] = jsonString.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        }
        chunks['_chunk_count'] = Math.ceil(jsonString.length / CHUNK_SIZE);

        chrome.storage.sync.get(null, (allSyncData) => {
            const keysToRemove = Object.keys(allSyncData).filter(k => k.startsWith('_chunk_'));
            chrome.storage.sync.remove(keysToRemove, () => {
                chrome.storage.sync.set(chunks, () => {
                    if (chrome.runtime.lastError) console.error("Error crítico en Sync:", chrome.runtime.lastError.message);
                });
            });
        });
        saveTimeout = null;
    }, 1000);
}

function getTagColor(tagName) {
    return tagConfig[tagName]?.color || '#1a73e8';
}

function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "")
              .trim();
}

// 3. METADATOS Y HUELLA
function getNotebookFingerprint(notebook) {
    const titleEl = notebook.querySelector('.project-button-title, .project-table-title');
    if (!titleEl) return null;
    const title = normalizeString(titleEl.innerText).substring(0, 30);
    const sourcesEl = notebook.querySelector('.project-button-subtitle-part-sources, .sources-column');
    const sources = (sourcesEl?.innerText || "").replace(/\D/g, "") || "0";
    return `${title}|${sources}`;
}

function extractNotebookId(element) {
    const mainBtn = element.querySelector('button[aria-labelledby*="project-"]');
    if (mainBtn) {
        const attr = mainBtn.getAttribute('aria-labelledby');
        const match = attr.match(/project-([a-f0-9-]+)-title/);
        if (match) return match[1];
    }
    const link = element.querySelector('a[href*="notebook/"]') || (element.tagName === 'A' && element.href.includes('notebook/') ? element : null);
    if (link) {
        const match = link.href.match(/notebook\/([a-f0-9-]+)/);
        if (match) return match[1];
    }
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const htmlMatch = element.outerHTML.match(uuidPattern);
    if (htmlMatch) return htmlMatch[0];
    return null;
}

function getResolvedId(notebook, isCollision = false) {
    const realId = extractNotebookId(notebook); 
    const fp = getNotebookFingerprint(notebook);
    if (!realId && isCollision) return `collision:${fp}`;
    if (realId) {
        if (fp && titleToIdMap[fp] !== realId) {
            titleToIdMap[fp] = realId;
            saveAllData();
        }
        if (fp && notebookTags[`fp:${fp}`]) {
            const existing = notebookTags[realId] || [];
            notebookTags[realId] = [...new Set([...existing, ...notebookTags[`fp:${fp}`]])];
            delete notebookTags[`fp:${fp}`];
            saveAllData();
        }
        return realId;
    }
    if (fp && titleToIdMap[fp]) return titleToIdMap[fp];
    return fp ? `fp:${fp}` : null;
}

// 4. LÓGICA DE PROCESAMIENTO
function processNewNodes() {
  const newNodes = document.querySelectorAll('project-button:not(.nblm-processed), tr[mat-row]:not(.nblm-processed), [role="row"]:not(.nblm-processed)');
  if (newNodes.length === 0) return;

  const allNodes = document.querySelectorAll('project-button, tr[mat-row], [role="row"]');
  const fpCounts = {};
  allNodes.forEach(node => {
      if (node.querySelector('th') || node.classList.contains('mat-mdc-header-row')) return;
      const fp = getNotebookFingerprint(node);
      if (fp) fpCounts[fp] = (fpCounts[fp] || 0) + 1;
  });

  newNodes.forEach(node => {
    if (node.querySelector('th') || node.classList.contains('mat-mdc-header-row') || node.innerText.trim() === "") return;
    const fp = getNotebookFingerprint(node);
    const isCollision = fpCounts[fp] > 1;
    const id = getResolvedId(node, isCollision);

    if (id) {
        node.classList.add('nblm-processed');
        if (isCollision) {
            const warnIcon = document.createElement('span');
            warnIcon.className = 'nblm-collision-warning';
            warnIcon.innerText = '⚠️';
            warnIcon.title = t('alert_collision_title');
            const titleEl = node.querySelector('.project-button-title, .project-table-title');
            if (titleEl) titleEl.appendChild(warnIcon);
        }
        const tagContainer = document.createElement('div');
        tagContainer.className = 'nblm-tag-container';
        const target = node.querySelector('mat-card') || node.querySelector('.mat-column-title') || node;
        target.appendChild(tagContainer);
        renderTags(tagContainer, id);
    }
  });
}

// 5. FUNCIONES DE INTERFAZ (UI)
function renderTags(container, id) {
  container.innerHTML = '';
  if (id.startsWith('collision:')) return;
  const tags = notebookTags[id] || [];
  const isListView = container.closest('tr, [role="row"]') !== null;
  const limit = isListView ? 4 : 2;

  tags.slice(0, limit).forEach(tag => container.appendChild(createTagElement(tag, id)));
  if (tags.length > limit) {
      const moreEl = document.createElement('span');
      moreEl.className = 'nblm-more-tags';
      moreEl.innerText = `+${tags.length - limit}`;
      const isPinned = activeTooltip?.dataset.id === id && activeTooltip?.dataset.sticky === 'true';
      moreEl.title = isPinned ? t('tooltip_close_tags') : t('tooltip_more_tags');
      moreEl.onclick = (e) => { 
          e.stopPropagation(); 
          if (isPinned) closeTooltip(); else showFullTagsTooltip(moreEl, id, true);
          updateUI();
      };
      container.appendChild(moreEl);
  }
}

function createTagElement(tag, id, inTooltip = false) {
    const tagEl = document.createElement('span');
    tagEl.className = 'nblm-tag';
    tagEl.style.backgroundColor = getTagColor(tag);
    tagEl.innerHTML = `<span>${tag}</span><span class="remove-tag">×</span>`;
    tagEl.querySelector('.remove-tag').onclick = (e) => { e.stopPropagation(); removeTagFromNotebook(id, tag); };
    if (!inTooltip) {
        tagEl.onmouseenter = () => { if (tooltipTimeout) clearTimeout(tooltipTimeout); showFullTagsTooltip(tagEl, id, false); };
        tagEl.onmouseleave = () => { 
            tooltipTimeout = setTimeout(() => {
                if (activeTooltip && activeTooltip.dataset.sticky !== 'true' && activeTooltip.dataset.hovered !== 'true') closeTooltip();
            }, 150);
        };
    }
    return tagEl;
}

function injectMenuItem(overlay) {
    const menuContent = overlay.querySelector('.mat-mdc-menu-content');
    if (menuContent && !menuContent.querySelector('.nblm-menu-item')) {
        const item = document.createElement('button');
        item.className = 'mat-mdc-menu-item nblm-menu-item';
        item.innerHTML = `<span class="mat-mdc-menu-item-text">${t('menu_item_tag')}</span>`;
        item.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            document.querySelector('.cdk-overlay-backdrop')?.click();
            if (lastClickedNotebookId?.startsWith('collision:')) showCollisionAlert();
            else if (lastClickedNotebookId) showTagPopover(lastClickedNotebookId);
        };
        menuContent.appendChild(item);
    }
}

function showAlertDialog(icon, title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    overlay.style.zIndex = '30000';
    overlay.innerHTML = `
        <div class="nblm-alert-modal">
            <div class="nblm-alert-icon">${icon}</div>
            <div class="nblm-alert-title">${title}</div>
            <div class="nblm-alert-message">${message}</div>
            <button class="nblm-alert-button">${t('alert_understood')}</button>
        </div>
    `;
    overlay.querySelector('.nblm-alert-button').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function showCollisionAlert() {
    showAlertDialog('⚠️', t('alert_collision_title'), t('alert_collision_msg'));
}

function toggleTag(id, tag) {
    if (!notebookTags[id]) notebookTags[id] = [];
    notebookTags[id] = notebookTags[id].includes(tag) ? notebookTags[id].filter(t => t !== tag) : [...notebookTags[id], tag];
    saveAllData();
    updateUI();
}

function removeTagFromNotebook(id, tag) {
    if (notebookTags[id]) {
        notebookTags[id] = notebookTags[id].filter(t => t !== tag);
        saveAllData();
        updateUI();
    }
}

function updateUI() {

  document.querySelectorAll('.nblm-processed').forEach(node => {

    const container = node.querySelector('.nblm-tag-container');

    if (container) {

        const fp = getNotebookFingerprint(node);

        const all = document.querySelectorAll('project-button, tr, [role="row"]');

        let count = 0;

        all.forEach(r => { if (getNotebookFingerprint(r) === fp) count++; });

        renderTags(container, getResolvedId(node, count > 1));

    }

  });

  renderFilterTags(); applyFilters();

}



function updateTabContext() {



    // Buscar el toggle activo de Angular Material (clase mat-button-toggle-checked o aria-checked="true")



    const activeToggle = document.querySelector('.mat-button-toggle-checked');



    const activeBtn = activeToggle ? activeToggle.querySelector('button') : document.querySelector('button[aria-checked="true"]');



    



    if (!activeBtn) return;



    



    const text = activeBtn.innerText.toLowerCase();



    // Soporte para ES (destacado), EN (featured/picks), CA (destacat)



    const isFeatured = text.includes('destacado') || text.includes('featured') || text.includes('picks') || text.includes('destacat');



    



    if (isFeatured) {



        document.body.classList.add('nblm-in-featured-tab');



    } else {



        document.body.classList.remove('nblm-in-featured-tab');



    }



    



    const tools = document.querySelector('.nblm-tools-container');



    if (tools) {



        tools.style.display = isFeatured ? 'none' : 'flex';



    }



}







function refreshInjectedTexts() {

    const tools = document.querySelector('.nblm-tools-container');

    if (tools) {

        const searchInput = tools.querySelector('.nblm-search-input');

        if (searchInput) searchInput.placeholder = t('search_placeholder');

        const manageBtn = tools.querySelector('.nblm-manage-btn');

        if (manageBtn) manageBtn.innerText = t('btn_manage_tags');

    }

}



function injectSearchTools() {

  if (document.querySelector('.nblm-tools-container')) {

      updateTabContext();

      return;

  }

  const featured = document.querySelector('.featured-projects-container');

  const listHeader = document.querySelector('.notebook-list-header') || document.querySelector('.projects-container-header');

  const mainContent = document.querySelector('.all-projects-container') || document.querySelector('main');



  if (!featured && !listHeader && !mainContent) return;



  const tools = document.createElement('div');

  tools.className = 'nblm-tools-container';

  tools.innerHTML = `

    <div class="nblm-header-row">

        <input type="text" class="nblm-search-input" style="flex:1; margin-right:12px;" placeholder="${t('search_placeholder')}">

        <button class="nblm-manage-btn">${t('btn_manage_tags')}</button>

    </div>

    <div class="nblm-filter-tags" id="nblm-filter-tags"></div>

  `;



  tools.querySelector('input').oninput = (e) => { searchQuery = e.target.value.toLowerCase(); applyFilters(); };

  tools.querySelector('.nblm-manage-btn').onclick = showManagementModal;



  if (featured) featured.insertAdjacentElement('afterend', tools);

  else if (listHeader) listHeader.insertAdjacentElement('afterend', tools);

  else if (mainContent) mainContent.prepend(tools);



  if (document.querySelector('.nblm-tools-container')) {

      updateTabContext();

      renderFilterTags();

  }

}



function showConfirmDialog(title, message, onConfirm, confirmBtnClass = 'nblm-btn-primary') {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    overlay.style.zIndex = '30000';
    overlay.innerHTML = `
        <div class="nblm-confirm-modal" style="font-family: 'Roboto', sans-serif !important;">
            <div class="nblm-confirm-title" style="font-family: 'Roboto', sans-serif !important;">${title}</div>
            <div class="nblm-confirm-message" style="font-family: 'Roboto', sans-serif !important;">${message}</div>
            <div class="nblm-confirm-actions">
                <button class="nblm-btn-cancel" style="font-family: 'Roboto', sans-serif !important;">${t('btn_cancel')}</button>
                <button class="${confirmBtnClass}" style="font-family: 'Roboto', sans-serif !important;">${t('btn_confirm')}</button>
            </div>
        </div>
    `;
    overlay.querySelector('.nblm-btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector(`.${confirmBtnClass}`).onclick = () => { onConfirm(); overlay.remove(); };
    document.body.appendChild(overlay);
}

function showManagementModal() {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    let selectedNewColor = '#1a73e8';
    let tempNewTagName = '';
    
    const render = (tagToHighlight = null) => {
        const body = overlay.querySelector('.nblm-modal-body');
        body.innerHTML = `
            <div class="nblm-manage-create-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
                <div style="display:flex; width:100%; gap:12px;">
                    <input type="text" class="nblm-manage-create-input" placeholder="${t('modal_create_placeholder')}" value="${tempNewTagName}">
                    <button class="nblm-btn-primary">${t('modal_btn_create')}</button>
                </div>
                <div class="nblm-color-picker-container" style="margin-top:0;">
                    <span style="font-size:11px; color:#5f6368; margin-right:4px;">${t('modal_color_label')}</span>
                    ${PRESET_COLORS.map(c => `<div class="nblm-color-swatch ${c === selectedNewColor ? 'active' : ''}" style="background:${c}" data-new-color="${c}"></div>`).join('')}
                    <div class="nblm-custom-color-btn" style="background:${PRESET_COLORS.includes(selectedNewColor) ? 'transparent' : selectedNewColor}">
                        <span>+</span>
                        <input type="color" class="nblm-custom-color-input" id="new-tag-custom-color" value="${selectedNewColor}">
                    </div>
                </div>
            </div>
            <div class="nblm-manage-list"></div>
        `;
        const createInput = body.querySelector('.nblm-manage-create-input');
        createInput.oninput = (e) => { tempNewTagName = e.target.value; };
        body.querySelectorAll('[data-new-color]').forEach(sw => { sw.onclick = () => { selectedNewColor = sw.dataset.newColor; render(); createInput.focus(); }; });
        body.querySelector('#new-tag-custom-color').onchange = (e) => { selectedNewColor = e.target.value; render(); createInput.focus(); };
        const handleCreate = () => {
            const val = tempNewTagName.trim();
            if (val && !globalTags.includes(val)) { addGlobalTag(val); setTagColor(val, selectedNewColor); tempNewTagName = ''; render(val); }
        };
        body.querySelector('.nblm-btn-primary').onclick = handleCreate;
        createInput.onkeydown = (e) => { if (e.key === 'Enter') handleCreate(); };

        const list = body.querySelector('.nblm-manage-list');
        globalTags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'nblm-manage-item' + (tag === tagToHighlight ? ' newly-created' : '');
            const color = getTagColor(tag);
            item.innerHTML = `
                <div class="nblm-manage-row">
                    <input type="text" class="nblm-tag-edit-input" value="${tag}" title="${t('modal_rename_hint')}">
                    <button class="nblm-btn-icon danger" title="${t('modal_btn_delete_hint')}"><span>&times;</span></button>
                </div>
                <div class="nblm-color-picker-container">
                    ${PRESET_COLORS.map(c => `<div class="nblm-color-swatch ${c === color ? 'active' : ''}" style="background:${c}" data-color="${c}" data-tag="${tag}"></div>`).join('')}
                    <div class="nblm-custom-color-btn" style="background:${PRESET_COLORS.includes(color) ? 'transparent' : color}">
                        <span>+</span><input type="color" class="nblm-custom-color-input" value="${color}" data-tag-custom="${tag}">
                    </div>
                </div>
            `;
            if (tag === tagToHighlight) setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            const input = item.querySelector('.nblm-tag-edit-input');
            input.onblur = () => renameTag(tag, input.value.trim());
            input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
            item.querySelectorAll('[data-color]').forEach(sw => { sw.onclick = () => { setTagColor(sw.dataset.tag, sw.dataset.color); render(); }; });
            const customInput = item.querySelector('[data-tag-custom]');
            customInput.onchange = () => { setTagColor(customInput.dataset.tagCustom, customInput.value); render(); };
            item.querySelector('.danger').onclick = () => {
                showConfirmDialog(t('modal_delete_confirm_title'), t('modal_delete_confirm_msg', tag), () => {
                    globalTags = globalTags.filter(t => t !== tag);
                    delete tagConfig[tag];
                    Object.keys(notebookTags).forEach(id => { notebookTags[id] = notebookTags[id].filter(t => t !== tag); });
                    saveAllData(); updateUI(); render();
                }, 'nblm-btn-danger');
            };
            list.appendChild(item);
        });
    };
    
    overlay.innerHTML = `
        <div class="nblm-modal">
            <div class="nblm-modal-header">
                <h2>${t('modal_manage_title')}</h2>
                <div style="display:flex; gap:8px; align-items:center;">
                    <div class="nblm-lang-selector" style="margin-right:12px; display:flex; gap:4px;">
                        <span class="nblm-lang-opt ${uiLang === 'auto' ? 'active' : ''}" data-lang="auto" style="cursor:pointer; font-size:14px; opacity:${uiLang === 'auto' ? '1' : '0.4'}" title="${t('lang_auto')}">🌐</span>
                        <span class="nblm-lang-opt ${uiLang === 'es' ? 'active' : ''}" data-lang="es" style="cursor:pointer; font-size:14px; opacity:${uiLang === 'es' ? '1' : '0.4'}" title="${t('lang_es')}">ES</span>
                        <span class="nblm-lang-opt ${uiLang === 'en' ? 'active' : ''}" data-lang="en" style="cursor:pointer; font-size:14px; opacity:${uiLang === 'en' ? '1' : '0.4'}" title="${t('lang_en')}">EN</span>
                        <span class="nblm-lang-opt ${uiLang === 'ca' ? 'active' : ''}" data-lang="ca" style="cursor:pointer; font-size:14px; opacity:${uiLang === 'ca' ? '1' : '0.4'}" title="${t('lang_ca')}">CA</span>
                    </div>
                    <button class="nblm-btn-icon" id="nblm-export" title="${t('modal_export_help')}">💾</button>
                    <button class="nblm-btn-icon" id="nblm-import" title="${t('modal_import_help')}">📂</button>
                    <span class="nblm-modal-close" style="margin-left:8px;">&times;</span>
                </div>
            </div>
            <div class="nblm-modal-body"></div>
            <div class="nblm-modal-footer">
                ${t('attribution_created_by')} <a href="https://www.linkedin.com/in/pfelipm/" target="_blank">Pablo Felip</a> | <a href="https://github.com/pfelipm/notebooklm-organizer" target="_blank">GitHub</a>
            </div>
        </div>
    `;
    overlay.querySelectorAll('.nblm-lang-opt').forEach(opt => {
        opt.onclick = async () => {
            uiLang = opt.dataset.lang; await loadLanguage(uiLang); saveAllData();
            overlay.remove(); showManagementModal(); refreshInjectedTexts(); updateUI();
        };
    });
    overlay.querySelector('#nblm-export').onclick = () => {
        const data = { notebookTags, globalTags, titleToIdMap, tagConfig, filterMode };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `nblm-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
    };
    overlay.querySelector('#nblm-import').onclick = () => {
        const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = '.json';
        fileInput.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const imported = JSON.parse(re.target.result);
                    if (!imported.globalTags || !Array.isArray(imported.globalTags)) { showAlertDialog('❌', t('import_error_format_title'), t('import_error_format_msg')); return; }
                    showImportGranularModal(imported, () => { saveAllData(); updateUI(); render(); });
                } catch (err) { showAlertDialog('❌', t('import_error_read_title'), t('import_error_read_msg')); }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    };
    overlay.querySelector('.nblm-modal-close').onclick = () => overlay.remove();
    document.body.appendChild(overlay); render();
}

function showImportGranularModal(data, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    overlay.style.zIndex = '30001';
    overlay.innerHTML = `
        <div class="nblm-confirm-modal" style="width:400px;">
            <div class="nblm-confirm-title">${t('import_granular_title')}</div>
            <div class="nblm-confirm-message">${t('import_granular_msg')}</div>
            <div style="text-align:left; background:#f8f9fa; padding:16px; border-radius:8px; display:flex; flex-direction:column; gap:12px; margin-bottom:24px; width:100%; box-sizing:border-box;">
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none;">
                    <input type="checkbox" id="import-opt-tags" checked style="width:16px; height:16px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:500; font-size:13px;">${t('import_opt_tags')}</span>
                        <span style="font-size:11px; color:#5f6368;">${t('import_opt_tags_desc', data.globalTags.length)}</span>
                    </div>
                </label>
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none;">
                    <input type="checkbox" id="import-opt-notebooks" checked style="width:16px; height:16px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:500; font-size:13px;">${t('import_opt_notebooks')}</span>
                        <span style="font-size:11px; color:#5f6368;">${t('import_opt_notebooks_desc')}</span>
                    </div>
                </label>
            </div>
            <div class="nblm-confirm-actions">
                <button class="nblm-btn-cancel">${t('btn_cancel')}</button>
                <button class="nblm-btn-primary" id="nblm-confirm-import">${t('import_btn_confirm')}</button>
            </div>
        </div>
    `;
    overlay.querySelector('.nblm-btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#nblm-confirm-import').onclick = () => {
        const importTags = overlay.querySelector('#import-opt-tags').checked;
        const importNotebooks = overlay.querySelector('#import-opt-notebooks').checked;
        if (importTags) { globalTags = data.globalTags; tagConfig = data.tagConfig || {}; }
        if (importNotebooks) { notebookTags = data.notebookTags || {}; titleToIdMap = data.titleToIdMap || {}; filterMode = data.filterMode || 'AND'; }
        overlay.remove(); onComplete(); showAlertDialog('✅', t('import_success_title'), t('import_success_msg'));
    };
    document.body.appendChild(overlay);
}

function renameTag(oldName, newName) {
    if (!newName || oldName === newName || globalTags.includes(newName)) return;
    globalTags = globalTags.map(t => t === oldName ? newName : t);
    if (tagConfig[oldName]) { tagConfig[newName] = { ...tagConfig[oldName] }; delete tagConfig[oldName]; }
    Object.keys(notebookTags).forEach(id => { notebookTags[id] = notebookTags[id].map(t => t === oldName ? newName : t); });
    if (activeFilters.has(oldName)) { activeFilters.delete(oldName); activeFilters.add(newName); }
    saveAllData(); updateUI();
}

function setTagColor(tag, color) {
    if (!tagConfig[tag]) tagConfig[tag] = {};
    tagConfig[tag].color = color;
    saveAllData(); updateUI();
}

function renderFilterTags() {
  const container = document.getElementById('nblm-filter-tags');
  if (!container) return;
  container.innerHTML = '';
  globalTags.forEach(tag => {
    const tagEl = document.createElement('span');
    const isActive = activeFilters.has(tag);
    tagEl.className = `nblm-filter-tag ${isActive ? 'active' : ''}`;
    if (isActive) { tagEl.style.backgroundColor = getTagColor(tag); tagEl.style.color = 'white'; tagEl.style.borderColor = 'transparent'; }
    tagEl.innerText = tag;
    tagEl.onclick = () => { if (isActive) activeFilters.delete(tag); else activeFilters.add(tag); updateUI(); };
    container.appendChild(tagEl);
  });
  if (activeFilters.size > 0) {
      const modeToggle = document.createElement('div');
      modeToggle.className = 'nblm-filter-mode-toggle';
      modeToggle.innerHTML = `
          <div class="nblm-mode-btn ${filterMode === 'AND' ? 'active' : ''}" data-mode="AND">${t('filter_mode_and')}</div>
          <div class="nblm-mode-btn ${filterMode === 'OR' ? 'active' : ''}" data-mode="OR">${t('filter_mode_or')}</div>
      `;
      modeToggle.querySelectorAll('.nblm-mode-btn').forEach(btn => { btn.onclick = () => { filterMode = btn.dataset.mode; updateUI(); }; });
      container.appendChild(modeToggle);
      const clearBtn = document.createElement('div');
      clearBtn.className = 'nblm-clear-filters';
      clearBtn.innerHTML = `<span>×</span> ${t('filter_clear')}`;
      clearBtn.onclick = () => { activeFilters.clear(); updateUI(); };
      container.appendChild(clearBtn);
  }
}

function applyFilters() {
  document.querySelectorAll('.nblm-processed').forEach(node => {
    const fp = getNotebookFingerprint(node);
    const all = document.querySelectorAll('project-button, tr, [role="row"]');
    let count = 0;
    all.forEach(r => { if (getNotebookFingerprint(r) === fp) count++; });
    const id = getResolvedId(node, count > 1);
    const titleText = node.innerText.toLowerCase();
    const tags = notebookTags[id] || [];
    const matchesSearch = titleText.includes(searchQuery);
    let matchesTags = true;
    if (activeFilters.size > 0) {
        const filterArray = Array.from(activeFilters);
        if (filterMode === 'AND') matchesTags = filterArray.every(f => tags.includes(f));
        else matchesTags = filterArray.some(f => tags.includes(f));
    }
    node.style.display = (matchesSearch && matchesTags) ? '' : 'none';
  });
}

function showFullTagsTooltip(anchor, id, sticky) {
    if (id?.startsWith('collision:')) return;
    closeTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'nblm-tags-tooltip';
    tooltip.dataset.id = id;
    if (sticky) tooltip.dataset.sticky = 'true';
    tooltip.onmouseenter = () => { tooltip.dataset.hovered = 'true'; };
    tooltip.onmouseleave = () => { tooltip.dataset.hovered = 'false'; if (tooltip.dataset.sticky !== 'true') closeTooltip(); };
    const rect = anchor.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    (notebookTags[id] || []).forEach(t => tooltip.appendChild(createTagElement(t, id, true)));
    document.body.appendChild(tooltip);
    activeTooltip = tooltip;
}

function closeTooltip() { if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; } }
function closePopover() { if (currentPopover) { currentPopover.remove(); currentPopover = null; } }
function addGlobalTag(tag) { 
    if (!globalTags.includes(tag)) { 
        globalTags.push(tag); 
        globalTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })); 
        saveAllData(); renderFilterTags(); 
    } 
}

function showTagPopover(id) {
    closePopover();
    const pop = document.createElement('div');
    pop.className = 'nblm-popover';
    pop.style.top = '50%'; pop.style.left = '50%'; pop.style.transform = 'translate(-50%, -50%)';
    pop.innerHTML = `
        <div class="nblm-popover-header">
             <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                <span class="nblm-popover-title">${t('popover_title')}</span>
                <span id="nblm-close" style="cursor:pointer;font-size:18px;">&times;</span>
             </div>
             <input type="text" id="nblm-in" placeholder="${t('popover_search_placeholder')}" autofocus style="width:100%; box-sizing:border-box;">
        </div>
        <div class="tag-list" id="nblm-list"></div>
        <div id="nblm-create"></div>
    `;
    pop.querySelector('#nblm-close').onclick = closePopover;
    const input = pop.querySelector('#nblm-in');
    const render = () => {
        const q = input.value.toLowerCase();
        const listContainer = pop.querySelector('#nblm-list');
        listContainer.innerHTML = '';
        [...globalTags].filter(t => t.toLowerCase().includes(q))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            .forEach(t => {
                const item = document.createElement('div');
                const isChecked = (notebookTags[id] || []).includes(t);
                item.className = `nblm-check-item ${isChecked ? 'checked' : ''}`;
                const color = getTagColor(t);
                item.innerHTML = `
                    <div class="nblm-check-icon" style="border-color:${color}; background:${isChecked ? color : 'transparent'}"></div>
                    <span class="nblm-tag" style="background-color:${color}; cursor:pointer; max-width:160px;">${t}</span>
                `;
                item.onclick = (e) => { e.stopPropagation(); toggleTag(id, t); render(); input.focus(); };
                listContainer.appendChild(item);
            });
        const showCreate = q && !globalTags.some(t => t.toLowerCase() === q);
        if (showCreate) {
            const createOpt = document.createElement('div');
            createOpt.className = 'nblm-create-option';
            createOpt.innerHTML = `<span>${t('popover_create_tag')}</span> <span class="nblm-tag" style="background-color:#1a73e8; margin-left:4px;">${input.value}</span>`;
            createOpt.onclick = () => { const newTag = input.value.trim(); addGlobalTag(newTag); toggleTag(id, newTag); input.value = ''; render(); };
            pop.querySelector('#nblm-create').innerHTML = ''; pop.querySelector('#nblm-create').appendChild(createOpt);
        } else pop.querySelector('#nblm-create').innerHTML = '';
    };
    input.oninput = render;
    input.onkeyup = (e) => { 
        if (e.key === 'Enter') {
            const val = input.value.trim(); if (!val) return;
            const existing = globalTags.find(t => t.toLowerCase() === val.toLowerCase());
            if (existing) { toggleTag(id, existing); input.value = ''; render(); }
            else { addGlobalTag(val); toggleTag(id, val); input.value = ''; render(); }
        }
    };
    document.body.appendChild(pop); currentPopover = pop; render();
}

// 6. INICIALIZACIÓN
function init() {
  console.log("NBLM Organizer: Ready");
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (let m of mutations) { if (m.addedNodes.length > 0) { shouldProcess = true; break; } }
    if (shouldProcess) processNewNodes();
    injectSearchTools();
    for (let m of mutations) {
        for (let node of m.addedNodes) {
            if (node.nodeType === 1 && (node.classList.contains('cdk-overlay-pane') || node.querySelector('.mat-mdc-menu-content'))) injectMenuItem(node);
        }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.project-button-more, button[aria-haspopup="menu"], button[aria-label*="Menú"]');
      if (btn) {
          const row = btn.closest('project-button, tr, [role="row"]');
          if (row) {
              const fp = getNotebookFingerprint(row);
              const allRows = document.querySelectorAll('project-button, tr, [role="row"]');
              let count = 0; allRows.forEach(r => { if (getNotebookFingerprint(r) === fp) count++; });
              lastClickedNotebookId = getResolvedId(row, count > 1);
          }
      }
  });
  document.addEventListener('click', (e) => {
    if (currentPopover && !currentPopover.contains(e.target)) closePopover();
    if (activeTooltip && !activeTooltip.contains(e.target) && !e.target.closest('.nblm-tag-container')) closeTooltip();
  });
  processNewNodes(); injectSearchTools();
  setInterval(processNewNodes, 3000); setInterval(injectSearchTools, 5000);
}

// 7. ARRANQUE
chrome.storage.sync.get(null, (syncData) => {
  let finalData = {};
  if (syncData && syncData._chunk_count) {
      let fullJson = "";
      for (let i = 0; i < syncData._chunk_count; i++) fullJson += syncData[`_chunk_${i}`] || "";
      try { finalData = JSON.parse(fullJson); } catch (e) { console.error("Error reconstruyendo datos de Sync:", e); }
  }
  chrome.storage.local.get(['notebookTags', 'globalTags', 'titleToIdMap', 'tagConfig', 'filterMode', 'uiLang'], async (localRes) => {
    notebookTags = finalData.notebookTags || localRes.notebookTags || {};
    globalTags = finalData.globalTags || localRes.globalTags || [];
    titleToIdMap = finalData.titleToIdMap || localRes.titleToIdMap || {};
    tagConfig = finalData.tagConfig || localRes.tagConfig || {};
    filterMode = finalData.filterMode || localRes.filterMode || 'AND';
    uiLang = finalData.uiLang || localRes.uiLang || 'auto';
    await loadLanguage(uiLang);
    init();
  });
});
