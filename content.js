// NotebookLM Organizer - Content Script

let notebookTags = {};
let globalTags = [];
let tagConfig = {}; // { tagName: { color: '#1a73e8' } }
let activeFilters = new Set();
let filterMode = 'AND'; // 'AND' o 'OR'
let searchQuery = '';
let currentPopover = null;
let lastClickedNotebookId = null;
let activeTooltip = null; 
let tooltipTimeout = null; 
let titleToIdMap = {}; 

const PRESET_COLORS = ['#1a73e8', '#d93025', '#188038', '#f9ab00', '#e37400', '#9334e6', '#0097a7', '#607d8b'];

// 1. UTILIDADES
let saveTimeout = null;

function saveAllData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const fullData = { notebookTags, globalTags, titleToIdMap, tagConfig };
        const jsonString = JSON.stringify(fullData);
        
        // 1. Guardado en LOCAL (sin límites restrictivos)
        chrome.storage.local.set(fullData);

        // 2. Guardado en SYNC con Fragmentación (Chunking) para evitar el límite de 8KB
        const CHUNK_SIZE = 7500; // Un poco menos de 8192 para margen
        const chunks = {};
        for (let i = 0; i < Math.ceil(jsonString.length / CHUNK_SIZE); i++) {
            chunks[`_chunk_${i}`] = jsonString.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        }
        chunks['_chunk_count'] = Math.ceil(jsonString.length / CHUNK_SIZE);

        // Limpiar trozos antiguos antes de guardar los nuevos
        chrome.storage.sync.get(null, (allSyncData) => {
            const keysToRemove = Object.keys(allSyncData).filter(k => k.startsWith('_chunk_'));
            chrome.storage.sync.remove(keysToRemove, () => {
                chrome.storage.sync.set(chunks, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error crítico en Sync:", chrome.runtime.lastError.message);
                    }
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

// 2. METADATOS Y HUELLA
function getNotebookFingerprint(notebook) {
    const titleEl = notebook.querySelector('.project-button-title, .project-table-title');
    if (!titleEl) return null;

    // Solo usamos los primeros 30 caracteres del título para la huella interna, ahorra mucho espacio
    const title = normalizeString(titleEl.innerText).substring(0, 30);
    const sourcesEl = notebook.querySelector('.project-button-subtitle-part-sources, .sources-column');
    const sources = (sourcesEl?.innerText || "").replace(/\D/g, "") || "0";
    
    return `${title}|${sources}`;
}

function extractNotebookId(element) {
    // 1. Intentar por aria-labelledby (Vista Tabla)
    const mainBtn = element.querySelector('button[aria-labelledby*="project-"]');
    if (mainBtn) {
        const attr = mainBtn.getAttribute('aria-labelledby');
        const match = attr.match(/project-([a-f0-9-]+)-title/);
        if (match) return match[1];
    }
    
    // 2. Intentar por enlaces directos (Vista Miniatura/Card)
    const link = element.querySelector('a[href*="notebook/"]') || (element.tagName === 'A' && element.href.includes('notebook/') ? element : null);
    if (link) {
        const match = link.href.match(/notebook\/([a-f0-9-]+)/);
        if (match) return match[1];
    }

    // 3. Buscar en el HTML completo del nodo por un patrón UUID
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const htmlMatch = element.outerHTML.match(uuidPattern);
    if (htmlMatch) return htmlMatch[0];

    return null;
}

function getResolvedId(notebook, isCollision = false) {
    const realId = extractNotebookId(notebook); 
    const fp = getNotebookFingerprint(notebook);

    // Si hay colisión y NO detectamos un ID real, devolvemos un ID de colisión
    // Esto disparará la alerta de seguridad.
    if (!realId && isCollision) return `collision:${fp}`;

    if (realId) {
        if (fp) {
            // Sincronizar siempre la huella con el ID real si lo encontramos
            if (titleToIdMap[fp] !== realId) {
                titleToIdMap[fp] = realId;
                saveAllData();
            }
            // Migrar etiquetas de huella antigua a ID real
            if (notebookTags[`fp:${fp}`]) {
                const existing = notebookTags[realId] || [];
                notebookTags[realId] = [...new Set([...existing, ...notebookTags[`fp:${fp}`]])];
                delete notebookTags[`fp:${fp}`];
                saveAllData();
            }
        }
        return realId;
    }
    
    // Si NO tenemos ID real en esta vista, intentamos usar el mapa
    if (fp && titleToIdMap[fp]) {
        return titleToIdMap[fp];
    }

    return fp ? `fp:${fp}` : null;
}

// 3. LÓGICA DE PROCESAMIENTO
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
            warnIcon.title = 'Varios cuadernos idénticos. Usa miniaturas para etiquetar.';
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

// 4. INICIALIZACIÓN
function init() {
  console.log("NBLM Organizer: Ready");
  
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (let m of mutations) {
        if (m.addedNodes.length > 0) { shouldProcess = true; break; }
    }
    if (shouldProcess) processNewNodes();
    injectSearchTools();
    
    for (let m of mutations) {
        for (let node of m.addedNodes) {
            if (node.nodeType === 1 && (node.classList.contains('cdk-overlay-pane') || node.querySelector('.mat-mdc-menu-content'))) {
                injectMenuItem(node);
            }
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
              let count = 0;
              allRows.forEach(r => { if (getNotebookFingerprint(r) === fp) count++; });
              lastClickedNotebookId = getResolvedId(row, count > 1);
          }
      }
  });

  document.addEventListener('click', (e) => {
    if (currentPopover && !currentPopover.contains(e.target)) closePopover();
    if (activeTooltip && !activeTooltip.contains(e.target) && !e.target.closest('.nblm-tag-container')) closeTooltip();
  });

  processNewNodes();
  injectSearchTools();
  setInterval(processNewNodes, 3000);
  setInterval(injectSearchTools, 5000); // Polling extra para la barra de herramientas
}

// 5. FUNCIONES DE INTERFAZ
function renderTags(container, id) {
  container.innerHTML = '';
  if (id.startsWith('collision:')) return;
  const tags = notebookTags[id] || [];
  
  // Detectar si estamos en vista de lista (dentro de una tabla) o miniatura (dentro de un mat-card)
  const isListView = container.closest('tr, [role="row"]') !== null;
  const limit = isListView ? 4 : 2;

  tags.slice(0, limit).forEach(tag => container.appendChild(createTagElement(tag, id)));
  if (tags.length > limit) {
      const moreEl = document.createElement('span');
      moreEl.className = 'nblm-more-tags';
      moreEl.innerText = `+${tags.length - limit}`;
      
      const isPinned = activeTooltip?.dataset.id === id && activeTooltip?.dataset.sticky === 'true';
      moreEl.title = isPinned ? "Cerrar lista de etiquetas" : "Ver todas las etiquetas";
      
      moreEl.onclick = (e) => { 
          e.stopPropagation(); 
          if (isPinned) {
              closeTooltip();
          } else {
              showFullTagsTooltip(moreEl, id, true); 
          }
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
    tagEl.querySelector('.remove-tag').onclick = (e) => {
        e.stopPropagation();
        removeTagFromNotebook(id, tag);
    };
    if (!inTooltip) {
        tagEl.onmouseenter = () => showFullTagsTooltip(tagEl, id, false);
        tagEl.onmouseleave = () => { 
            setTimeout(() => {
                if (activeTooltip && activeTooltip.dataset.sticky !== 'true' && activeTooltip.dataset.hovered !== 'true') {
                    closeTooltip();
                }
            }, 100);
        };
    }
    return tagEl;
}

function injectMenuItem(overlay) {
    const menuContent = overlay.querySelector('.mat-mdc-menu-content');
    if (menuContent && !menuContent.querySelector('.nblm-menu-item')) {
        const item = document.createElement('button');
        item.className = 'mat-mdc-menu-item nblm-menu-item';
        item.innerHTML = '<span class="mat-mdc-menu-item-text">🏷️ Etiquetar cuaderno</span>';
        item.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            document.querySelector('.cdk-overlay-backdrop')?.click();
            if (lastClickedNotebookId?.startsWith('collision:')) {
                showCollisionAlert();
            } else if (lastClickedNotebookId) {
                showTagPopover(lastClickedNotebookId);
            }
        };
        menuContent.appendChild(item);
    }
}

function showCollisionAlert() {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    overlay.innerHTML = `
        <div class="nblm-alert-modal">
            <div class="nblm-alert-icon">⚠️</div>
            <div class="nblm-alert-title">Acción bloqueada por seguridad</div>
            <div class="nblm-alert-message">
                Existen varios cuadernos con nombre, fuentes y fecha idénticos en esta lista.<br><br>
                Para evitar errores, renombra uno de los cuadernos o utiliza la <b>vista de miniaturas</b> para etiquetarlos.
            </div>
            <button class="nblm-alert-button">Entendido</button>
        </div>
    `;
    overlay.querySelector('.nblm-alert-button').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
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
  renderFilterTags();
  applyFilters();
}

function injectSearchTools() {
  if (document.querySelector('.nblm-tools-container')) return;
  
  let target = document.querySelector('.notebook-list-header') || 
                 document.querySelector('.projects-container-header') || 
                 document.querySelector('header');
  
  if (!target) {
      const anyNotebook = document.querySelector('.nblm-processed, project-button, tr[mat-row]');
      if (anyNotebook) {
          target = anyNotebook.parentElement;
          if (target.tagName === 'TBODY' || target.tagName === 'TABLE') target = target.closest('table').parentElement;
      }
  }

  if (target) {
    const tools = document.createElement('div');
    tools.className = 'nblm-tools-container';
    tools.innerHTML = `<div class="nblm-header-row"><input type="text" class="nblm-search-input" style="flex:1; margin-right:12px;" placeholder="Buscar cuadernos..."><button class="nblm-manage-btn">Gestionar etiquetas</button></div><div class="nblm-filter-tags" id="nblm-filter-tags"></div>`;
    tools.querySelector('input').oninput = (e) => { searchQuery = e.target.value.toLowerCase(); applyFilters(); };
    tools.querySelector('.nblm-manage-btn').onclick = showManagementModal;
    
    // Inserción robusta: antes del contenedor si es una tabla/lista, o después si es un header
    if (target.tagName === 'PROJECT-TABLE' || target.tagName === 'DIV' || (target.className && typeof target.className === 'string' && target.className.includes('container'))) {
        target.parentElement.insertBefore(tools, target);
    } else {
        target.insertAdjacentElement('afterend', tools);
    }
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
                <button class="nblm-btn-cancel" style="font-family: 'Roboto', sans-serif !important;">Cancelar</button>
                <button class="${confirmBtnClass}" style="font-family: 'Roboto', sans-serif !important;">Confirmar</button>
            </div>
        </div>
    `;
    
    overlay.querySelector('.nblm-btn-cancel').onclick = () => overlay.remove();
    overlay.querySelector(`.${confirmBtnClass}`).onclick = () => {
        onConfirm();
        overlay.remove();
    };
    
    document.body.appendChild(overlay);
}

function showManagementModal() {
    const overlay = document.createElement('div');
    overlay.className = 'nblm-modal-overlay';
    let selectedNewColor = '#1a73e8';
    let tempNewTagName = ''; // Variable para persistir el nombre mientras se elige color
    
    const render = (tagToHighlight = null) => {
        const body = overlay.querySelector('.nblm-modal-body');
        body.innerHTML = `
            <div class="nblm-manage-create-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
                <div style="display:flex; width:100%; gap:12px;">
                    <input type="text" class="nblm-manage-create-input" placeholder="Nueva etiqueta..." value="${tempNewTagName}">
                    <button class="nblm-btn-primary">Crear</button>
                </div>
                <div class="nblm-color-picker-container" style="margin-top:0;">
                    <span style="font-size:11px; color:#5f6368; margin-right:4px;">Color:</span>
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
        const createBtn = body.querySelector('.nblm-btn-primary');
        
        createInput.oninput = (e) => { tempNewTagName = e.target.value; };

        body.querySelectorAll('[data-new-color]').forEach(sw => {
            sw.onclick = () => { selectedNewColor = sw.dataset.newColor; render(); createInput.focus(); };
        });
        body.querySelector('#new-tag-custom-color').onchange = (e) => { selectedNewColor = e.target.value; render(); createInput.focus(); };

        const handleCreate = () => {
            const val = tempNewTagName.trim();
            if (val && !globalTags.includes(val)) {
                addGlobalTag(val);
                setTagColor(val, selectedNewColor);
                tempNewTagName = ''; // Limpiar tras crear
                render(val); // Pasar el nombre para resaltar
            }
        };

        createBtn.onclick = handleCreate;
        createInput.onkeydown = (e) => { if (e.key === 'Enter') handleCreate(); };

        const list = body.querySelector('.nblm-manage-list');
        globalTags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'nblm-manage-item' + (tag === tagToHighlight ? ' newly-created' : '');
            const color = getTagColor(tag);
            
            item.innerHTML = `
                <div class="nblm-manage-row">
                    <input type="text" class="nblm-tag-edit-input" value="${tag}" title="Haz clic para renombrar">
                    <div style="display:flex; gap:4px;">
                        <button class="nblm-btn-icon danger" title="Eliminar"><span style="font-size:18px;">&times;</span></button>
                    </div>
                </div>
                <div class="nblm-color-picker-container">
                    ${PRESET_COLORS.map(c => `<div class="nblm-color-swatch ${c === color ? 'active' : ''}" style="background:${c}" data-color="${c}" data-tag="${tag}"></div>`).join('')}
                    <div class="nblm-custom-color-btn" style="background:${PRESET_COLORS.includes(color) ? 'transparent' : color}">
                        <span>+</span>
                        <input type="color" class="nblm-custom-color-input" value="${color}" data-tag-custom="${tag}">
                    </div>
                </div>
            `;
            
            if (tag === tagToHighlight) {
                setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            }

            const input = item.querySelector('.nblm-tag-edit-input');
            input.onblur = () => renameTag(tag, input.value.trim());
            input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
            
            item.querySelectorAll('[data-color]').forEach(sw => {
                sw.onclick = () => { setTagColor(sw.dataset.tag, sw.dataset.color); render(); };
            });
            
            const customInput = item.querySelector('[data-tag-custom]');
            customInput.onchange = () => { setTagColor(customInput.dataset.tagCustom, customInput.value); render(); };

            item.querySelector('.danger').onclick = () => {
                showConfirmDialog(
                    "Eliminar etiqueta", 
                    `¿Estás seguro de que quieres eliminar la etiqueta "${tag}"? Esta acción no se puede deshacer y se borrará de todos tus cuadernos.`, 
                    () => {
                        globalTags = globalTags.filter(t => t !== tag);
                        delete tagConfig[tag];
                        // ELIMINAR de todos los cuadernos (notebookTags)
                        Object.keys(notebookTags).forEach(id => {
                            notebookTags[id] = notebookTags[id].filter(t => t !== tag);
                        });
                        saveAllData();
                        updateUI();
                        render();
                    },
                    'nblm-btn-danger'
                );
            };
            
            list.appendChild(item);
        });
    };
    
    overlay.innerHTML = `
        <div class="nblm-modal">
            <div class="nblm-modal-header">
                <h2>Gestionar etiquetas</h2>
                <span class="nblm-modal-close">&times;</span>
            </div>
            <div class="nblm-modal-body"></div>
        </div>
    `;
    overlay.querySelector('.nblm-modal-close').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
    render();
}

function renameTag(oldName, newName) {
    if (!newName || oldName === newName || globalTags.includes(newName)) return;
    globalTags = globalTags.map(t => t === oldName ? newName : t);
    if (tagConfig[oldName]) { 
        tagConfig[newName] = { ...tagConfig[oldName] }; 
        delete tagConfig[oldName]; 
    }
    Object.keys(notebookTags).forEach(id => { 
        notebookTags[id] = notebookTags[id].map(t => t === oldName ? newName : t); 
    });
    if (activeFilters.has(oldName)) { 
        activeFilters.delete(oldName); 
        activeFilters.add(newName); 
    }
    saveAllData();
    updateUI();
}

function setTagColor(tag, color) {
    if (!tagConfig[tag]) tagConfig[tag] = {};
    tagConfig[tag].color = color;
    saveAllData();
    updateUI();
}

function renderFilterTags() {
  const container = document.getElementById('nblm-filter-tags');
  if (!container) return;
  container.innerHTML = '';
  globalTags.forEach(tag => {
    const tagEl = document.createElement('span');
    const isActive = activeFilters.has(tag);
    tagEl.className = `nblm-filter-tag ${isActive ? 'active' : ''}`;
    if (isActive) {
        tagEl.style.backgroundColor = getTagColor(tag);
        tagEl.style.color = 'white';
        tagEl.style.borderColor = 'transparent';
    }
    tagEl.innerText = tag;
    tagEl.onclick = () => { if (isActive) activeFilters.delete(tag); else activeFilters.add(tag); updateUI(); };
    container.appendChild(tagEl);
  });
  if (activeFilters.size > 0) {
      // Selector de Modo (AND/OR)
      const modeToggle = document.createElement('div');
      modeToggle.className = 'nblm-filter-mode-toggle';
      modeToggle.innerHTML = `
          <div class="nblm-mode-btn ${filterMode === 'AND' ? 'active' : ''}" data-mode="AND">Y</div>
          <div class="nblm-mode-btn ${filterMode === 'OR' ? 'active' : ''}" data-mode="OR">O</div>
      `;
      modeToggle.querySelectorAll('.nblm-mode-btn').forEach(btn => {
          btn.onclick = () => {
              filterMode = btn.dataset.mode;
              updateUI();
          };
      });
      container.appendChild(modeToggle);

      const clearBtn = document.createElement('div');
      clearBtn.className = 'nblm-clear-filters';
      clearBtn.innerHTML = '<span>×</span> Limpiar filtros';
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
        if (filterMode === 'AND') {
            matchesTags = filterArray.every(f => tags.includes(f));
        } else {
            matchesTags = filterArray.some(f => tags.includes(f));
        }
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
    tooltip.onmouseleave = () => { 
        tooltip.dataset.hovered = 'false'; 
        if (tooltip.dataset.sticky !== 'true') closeTooltip(); 
    };

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
        saveAllData(); 
        renderFilterTags(); 
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
                <span style="font-weight:500;font-size:14px;color:#202124;">Selecciona etiquetas</span>
                <span id="nblm-close" style="cursor:pointer;font-size:18px;">&times;</span>
             </div>
             <input type="text" id="nblm-in" placeholder="Buscar o crear..." autofocus style="width:100%; box-sizing:border-box;">
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
        
        // Ordenar antes de mostrar para asegurar el orden alfabético correcto
        [...globalTags]
            .filter(t => t.toLowerCase().includes(q))
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
            .forEach(t => {
                const item = document.createElement('div');
                const isChecked = (notebookTags[id] || []).includes(t);
                item.className = `nblm-check-item ${isChecked ? 'checked' : ''}`;
                const color = getTagColor(t);
                
                // Mostrar como pastilla (pill) real, pero sin el botón de borrar (x)
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
            createOpt.innerHTML = `<span>Crear etiqueta:</span> <span class="nblm-tag" style="background-color:#1a73e8; margin-left:4px;">${input.value}</span>`;
            createOpt.onclick = () => { 
                const newTag = input.value.trim();
                addGlobalTag(newTag); toggleTag(id, newTag); input.value = ''; render(); 
            };
            pop.querySelector('#nblm-create').innerHTML = '';
            pop.querySelector('#nblm-create').appendChild(createOpt);
        } else {
            pop.querySelector('#nblm-create').innerHTML = '';
        }
    };
    input.oninput = render;
    input.onkeyup = (e) => { 
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (!val) return;
            const existing = globalTags.find(t => t.toLowerCase() === val.toLowerCase());
            if (existing) {
                toggleTag(id, existing);
                input.value = '';
                render();
            } else {
                addGlobalTag(val);
                toggleTag(id, val);
                input.value = '';
                render();
            }
        }
    };
    document.body.appendChild(pop);
    currentPopover = pop;
    render();
}

// 7. INICIO
chrome.storage.sync.get(null, (syncData) => {
  let finalData = {};
  
  // Intentar reconstruir desde trozos (Sync)
  if (syncData && syncData._chunk_count) {
      let fullJson = "";
      for (let i = 0; i < syncData._chunk_count; i++) {
          fullJson += syncData[`_chunk_${i}`] || "";
      }
      try {
          finalData = JSON.parse(fullJson);
      } catch (e) {
          console.error("Error reconstruyendo datos de Sync:", e);
      }
  }

  // Si Sync falló o está vacío, probar Local
  chrome.storage.local.get(['notebookTags', 'globalTags', 'titleToIdMap'], (localRes) => {
    notebookTags = finalData.notebookTags || localRes.notebookTags || {};
    globalTags = finalData.globalTags || localRes.globalTags || [];
    titleToIdMap = finalData.titleToIdMap || localRes.titleToIdMap || {};
    init();
  });
});
