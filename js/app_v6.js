/* ============================================================
   ID CARD GENERATOR — APPLICATION LOGIC (ADVANCED)
   ============================================================ */

// ==================== STATE ====================
const state = {
    templateImg: null,          // HTMLImageElement (for legacy/custom uploads only)
    selectedTemplateId: null,   // ID of built-in template (from templates.js)
    
    // Dynamic Template Assets (Logo, Signature, Org Name, etc.)
    templateAssets: {},         // assetId -> { value (string) OR img (HTMLImageElement) }
    
    csvData: [],                // Array of row objects from CSV
    csvColumns: [],             // Column names from CSV
    photos: new Map(),          // filename -> HTMLImageElement
    
    generatedCards: [],         // Array of { name, id, dataUrl, blob }
    currentPreview: 0,          // Index of currently previewed record
    
    // Column mapping
    mapping: {
        name: '',
        id: '',
        branch: '',
        dob: '',
        bloodGroup: '',
        photo: ''
    }
};

// ==================== PHOTO MATCHING HELPER ====================
function findPhotoInStore(targetName, personNameFallback) {
    if (state.photos.size === 0) return null;

    const findMatch = (name) => {
        if (!name) return null;
        const raw = String(name).trim();
        const lower = raw.toLowerCase();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        const base = raw.split(/[\\/]/).pop().split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Exact map check
        if (state.photos.has(raw)) return state.photos.get(raw);

        // 2. Loop through stored images
        for (let [filename, img] of state.photos) {
            const fLower = filename.toLowerCase();
            const fClean = fLower.replace(/[^a-z0-9]/g, '');
            const fBase = filename.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

            if (fLower === lower || fClean === clean || fBase === base) return img;
            
            // Substring matching
            if (fBase.length > 2 && (base.includes(fBase) || fBase.includes(base))) return img;
            if (fClean.length > 2 && (clean.includes(fClean) || fClean.includes(clean))) return img;
        }
        return null;
    };

    // Try target name (from Excel/CSV)
    let match = findMatch(targetName);
    
    // Fallback to Person Name
    if (!match && personNameFallback) {
        match = findMatch(personNameFallback);
    }

    return match;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupDragDrop();
    setupFileInputs();
    setupScrollEffects();
    generateTemplateThumbnails(); // From templates.js
});

// ==================== DRAG & DROP ====================
function setupDragDrop() {
    const zones = document.querySelectorAll('.upload-zone');
    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const type = zone.dataset.type;
            const files = e.dataTransfer.files;
            if (type === 'csv' && files.length) handleDataFile(files[0]);
            else if (type === 'photos' && files.length) handlePhotoFiles(files);
        });
        zone.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const type = zone.dataset.type;
            if (type === 'csv') document.getElementById('csv-input').click();
            else if (type === 'photos') document.getElementById('photos-input').click();
        });
    });
}

function setupFileInputs() {
    document.getElementById('template-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleLegacyTemplate(e.target.files[0]);
    });
    document.getElementById('csv-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleDataFile(e.target.files[0]);
    });
    document.getElementById('photos-input').addEventListener('change', (e) => {
        if (e.target.files.length) handlePhotoFiles(e.target.files);
    });
}

// ==================== TEMPLATE LOGIC ====================
function selectBuiltInTemplate(templateId, element) {
    const tmpl = CARD_TEMPLATES[templateId];
    if (!tmpl) return;

    // UI Update
    document.querySelectorAll('.template-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    state.selectedTemplateId = templateId;
    state.templateImg = null;
    state.templateAssets = {}; // Reset assets for new template

    // Initialize asset defaults
    (tmpl.assets || []).forEach(asset => {
        if (asset.type === 'text') state.templateAssets[asset.id] = asset.default || '';
    });

    renderDynamicAssetFields(tmpl);
    checkReadyState();
    showToast(`Template selected: ${tmpl.name}`, 'success');
}

function renderDynamicAssetFields(tmpl) {
    const container = document.getElementById('dynamic-assets-container');
    const fieldsDiv = document.getElementById('dynamic-assets-fields');
    container.style.display = 'block';
    document.getElementById('template-selector').style.display = 'none';
    
    fieldsDiv.innerHTML = '';
    
    (tmpl.assets || []).forEach(asset => {
        const field = document.createElement('div');
        field.className = 'asset-field';
        
        const label = document.createElement('label');
        label.textContent = asset.label;
        field.appendChild(label);

        if (asset.type === 'image') {
            const wrap = document.createElement('div');
            wrap.className = 'asset-input-wrap';
            
            const preview = document.createElement('img');
            preview.className = 'asset-preview-mini';
            preview.id = `preview-asset-${asset.id}`;
            preview.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect width="18" height="18" x="3" y="3" rx="2" ry="2"/%3E%3Ccircle cx="9" cy="9" r="2"/%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/%3E%3C/svg%3E';
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => handleAssetUpload(asset.id, e.target.files[0]);
            
            wrap.appendChild(preview);
            wrap.appendChild(input);
            field.appendChild(wrap);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'config-input';
            input.value = state.templateAssets[asset.id] || '';
            input.oninput = (e) => {
                state.templateAssets[asset.id] = e.target.value;
                updatePreview();
            };
            field.appendChild(input);
        }
        fieldsDiv.appendChild(field);
    });
}

function handleAssetUpload(assetId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.templateAssets[assetId] = img;
            document.getElementById(`preview-asset-${assetId}`).src = e.target.result;
            updatePreview();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handleLegacyTemplate(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.templateImg = img;
            state.selectedTemplateId = null;
            document.getElementById('template-preview').style.display = 'block';
            document.getElementById('template-selector').style.display = 'none';
            document.getElementById('template-preview-img').src = e.target.result;
            document.getElementById('template-name').textContent = file.name;
            checkReadyState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function changeTemplate() {
    document.getElementById('template-selector').style.display = 'block';
    document.getElementById('dynamic-assets-container').style.display = 'none';
    document.getElementById('template-preview').style.display = 'none';
    state.selectedTemplateId = null;
    state.templateImg = null;
    checkReadyState();
}

// ==================== DATA HANDLERS ====================
function handleDataFile(file) {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (isExcel) {
        handleExcelFile(file);
    } else {
        handleCSVFile(file);
    }
}

function handleCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            processParsedData(results.data, results.meta.fields || [], file.name);
        },
        error: (err) => showToast(`CSV Error: ${err.message}`, 'error')
    });
}

function handleExcelFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
            
            processParsedData(jsonData, columns, file.name);
        } catch (err) {
            showToast(`Excel Error: ${err.message}`, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function processParsedData(data, columns, fileName) {
    state.csvData = data;
    state.csvColumns = columns;
    
    // UI Update
    document.querySelector('#upload-csv .upload-zone').style.display = 'none';
    document.getElementById('csv-preview').style.display = 'block';
    document.getElementById('csv-name').textContent = fileName;
    document.getElementById('csv-rows').textContent = `${data.length} records`;

    autoMapColumns();
    showColumnMapping();
    checkReadyState();
    showToast(`${fileName} Loaded`, 'success');
}

function handlePhotoFiles(files) {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
        showToast('No valid images found!', 'error');
        return;
    }

    let loaded = 0;
    let failed = 0;
    
    showToast(`Loading ${fileArray.length} photos...`, 'info');

    fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.photos.set(file.name, img);
                loaded++;
                updatePhotoProgress(loaded, failed, fileArray.length);
            };
            img.onerror = () => {
                failed++;
                updatePhotoProgress(loaded, failed, fileArray.length);
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            failed++;
            updatePhotoProgress(loaded, failed, fileArray.length);
        };
        reader.readAsDataURL(file);
    });
}

function updatePhotoProgress(loaded, failed, total) {
    if (loaded + failed === total) {
        document.querySelector('#upload-photos .upload-zone').style.display = 'none';
        document.getElementById('photos-preview').style.display = 'block';
        document.getElementById('photos-count').textContent = `${loaded} Photos Loaded ${failed > 0 ? `(${failed} failed)` : ''}`;
        
        // Populate mini grid
        const grid = document.getElementById('photos-grid-mini');
        grid.innerHTML = '';
        state.photos.forEach((val, key) => {
            const container = document.createElement('div');
            container.style.position = 'relative';
            const i = document.createElement('img');
            i.src = val.src;
            i.title = key;
            container.appendChild(i);
            grid.appendChild(container);
        });
        
        checkReadyState();
        showToast(`${loaded} Photos ready`, 'success');
        console.log('Photos Loaded:', Array.from(state.photos.keys()));
    }
}

// ==================== EDITING LOGIC ====================
function renderEditForm(rowData) {
    const container = document.getElementById('edit-fields-container');
    container.innerHTML = '';

    const fieldSchema = [
        { key: 'name', label: 'Student Name', icon: '👤' },
        { key: 'id', label: 'ID Number', icon: '🔢' },
        { key: 'branch', label: 'Branch/Class', icon: '🏫' },
        { key: 'dob', label: 'Date of Birth', icon: '📅' },
        { key: 'bloodGroup', label: 'Blood Group', icon: '🩸' },
        { key: 'photo', label: 'Photo Filename', icon: '📸' }
    ];

    fieldSchema.forEach(f => {
        const div = document.createElement('div');
        div.className = 'edit-field';
        
        const label = document.createElement('label');
        label.innerHTML = `${f.icon} ${f.label}`;
        div.appendChild(label);

        const mappedCol = state.mapping[f.key];
        
        if (!mappedCol) {
            const warning = document.createElement('div');
            warning.className = 'field-warning';
            warning.style.fontSize = '11px';
            warning.style.color = 'var(--text-muted)';
            warning.style.fontStyle = 'italic';
            warning.textContent = 'Not mapped in "Column Mapping"';
            div.appendChild(warning);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'config-input';
            input.value = rowData[mappedCol] || '';
            input.dataset.key = mappedCol;
            input.oninput = (e) => {
                const currentData = { ...state.csvData[state.currentPreview] };
                currentData[mappedCol] = e.target.value;
                renderCard(document.getElementById('preview-canvas'), currentData);
            };
            div.appendChild(input);

            // Special diagnostics for Photo field
            if (f.key === 'photo') {
                const photoName = rowData[mappedCol];
                const personName = rowData[state.mapping.name];
                const found = findPhotoInStore(photoName, personName);
                
                const meta = document.createElement('div');
                meta.style.fontSize = '10px';
                meta.style.marginTop = '4px';
                meta.style.padding = '4px 8px';
                meta.style.borderRadius = '4px';
                meta.style.background = found ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                meta.style.border = `1px solid ${found ? 'var(--success)' : 'var(--error)'}`;
                
                let debugText = found ? `✅ Linked: ${photoName || personName}` : `❌ No match found for: "${photoName || '(empty)'}"`;
                if (!found && personName) debugText += ` or "${personName}"`;
                
                meta.textContent = debugText;
                div.appendChild(meta);
            }
        }
        container.appendChild(div);
    });
}

function saveCurrentEdit() {
    const inputs = document.querySelectorAll('#edit-fields-container input');
    const row = state.csvData[state.currentPreview];
    inputs.forEach(input => {
        row[input.dataset.key] = input.value;
    });
    showToast('Changes saved locally for this record', 'success');
    updatePreview();
}

// ==================== RENDERING CORE ====================
function updatePreview() {
    const hasTemplate = !!state.selectedTemplateId || !!state.templateImg;
    if (!hasTemplate || state.csvData.length === 0) return;

    const row = state.csvData[state.currentPreview];
    renderCard(document.getElementById('preview-canvas'), row);
    renderEditForm(row);

    document.getElementById('preview-counter').textContent = `${state.currentPreview + 1} / ${state.csvData.length}`;
}

function renderCard(canvas, rowData) {
    const m = state.mapping;
    const data = {
        name: rowData[m.name] || '',
        id: rowData[m.id] || '',
        branch: rowData[m.branch] || '',
        dob: rowData[m.dob] || '',
        bloodGroup: rowData[m.bloodGroup] || ''
    };

    const photoName = m.photo ? rowData[m.photo] : null;
    const personName = m.name ? rowData[m.name] : null;
    const photoImg = findPhotoInStore(photoName, personName);

    if (state.selectedTemplateId && CARD_TEMPLATES[state.selectedTemplateId]) {
        const tmpl = CARD_TEMPLATES[state.selectedTemplateId];
        canvas.width = tmpl.width;
        canvas.height = tmpl.height;
        const ctx = canvas.getContext('2d');
        tmpl.render(ctx, tmpl.width, tmpl.height, data, photoImg, state.templateAssets);
    } else if (state.templateImg) {
        // Simple legacy overlay logic
        const img = state.templateImg;
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // ... simple text drawing ...
        ctx.fillStyle = '#000'; ctx.font = '24px Arial';
        ctx.fillText(data.name, 50, 50);
    }
}

// ==================== BATCH GENERATION ====================
async function generateAllCards() {
    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    
    const container = document.getElementById('progress-container');
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    container.style.display = 'flex';
    
    const grid = document.getElementById('results-grid');
    grid.innerHTML = '';
    state.generatedCards = [];

    for (let i = 0; i < state.csvData.length; i++) {
        const canvas = document.createElement('canvas');
        renderCard(canvas, state.csvData[i]);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
        
        const cardState = {
            name: state.csvData[i][state.mapping.name] || `card_${i}`,
            id: state.csvData[i][state.mapping.id] || i,
            dataUrl, blob
        };
        state.generatedCards.push(cardState);

        // Result Item UI
        const item = document.createElement('div');
        item.className = 'result-card';
        item.innerHTML = `<img src="${dataUrl}"><div class="result-card-info"><span>${cardState.name}</span></div>`;
        grid.appendChild(item);

        const pct = Math.round(((i+1) / state.csvData.length) * 100);
        fill.style.width = pct + '%';
        text.textContent = pct + '%';
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }

    btn.disabled = false;
    document.getElementById('download-zip-btn').style.display = 'inline-flex';
    showToast('Batch PNG Generation Complete', 'success');
}

async function generatePDF() {
    if (state.csvData.length === 0) return;
    const { jsPDF } = window.jspdf;
    
    // Check orientation based on template
    const tmpl = state.selectedTemplateId ? CARD_TEMPLATES[state.selectedTemplateId] : { width: 1000, height: 600 };
    const orientation = tmpl.width > tmpl.height ? 'l' : 'p';
    
    const pdf = new jsPDF(orientation, 'px', [tmpl.width, tmpl.height]);
    
    showToast('Preparing PDF... please wait.', 'info');

    for (let i = 0; i < state.csvData.length; i++) {
        const canvas = document.createElement('canvas');
        renderCard(canvas, state.csvData[i]);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        if (i > 0) pdf.addPage([tmpl.width, tmpl.height], orientation);
        pdf.addImage(dataUrl, 'JPEG', 0, 0, tmpl.width, tmpl.height);
    }
    
    pdf.save('Generated_ID_Cards.pdf');
    showToast('PDF Downloaded!', 'success');
}

// ==================== UTILS ====================
function navigatePreview(dir) {
    state.currentPreview = Math.max(0, Math.min(state.csvData.length - 1, state.currentPreview + dir));
    updatePreview();
}

function checkReadyState() {
    const ready = (!!state.selectedTemplateId || !!state.templateImg) && state.csvData.length > 0;
    document.getElementById('layout-section').style.display = ready ? 'block' : 'none';
    document.getElementById('generate-section').style.display = ready ? 'block' : 'none';
    if (ready) {
        document.getElementById('generate-subtitle').textContent = `${state.csvData.length} records ready`;
        updatePreview();
    }
}

function autoMapColumns() {
    const cols = state.csvColumns;
    const lowerCols = cols.map(c => c.toLowerCase().trim());
    
    // Improved exact mapping keywords
    const map = (keys) => {
        for (const k of keys) {
            const idx = lowerCols.indexOf(k);
            if (idx !== -1) return cols[idx];
        }
        for (const k of keys) {
            const idx = lowerCols.findIndex(c => c.includes(k));
            if (idx !== -1) return cols[idx];
        }
        return '';
    };

    state.mapping.name = map(['name', 'full name', 'student name', 'employee name', 'fullname']);
    state.mapping.id = map(['id', 'roll', 'erp', 'enrollment', 'roll no', 'emp id']);
    state.mapping.branch = map(['branch', 'class', 'department', 'dept', 'course', 'stream']);
    state.mapping.dob = map(['dob', 'date of birth', 'birthdate', 'birth date']);
    state.mapping.bloodGroup = map(['blood', 'group', 'blood group', 'bloodgroup', 'blood_group']);
    state.mapping.photo = map(['photo', 'image', 'picture', 'photo_path', 'profile', 'photograph', 'img', 'id photo', 'student photo']);
}

function findCol(cols, keys) {
    for (const k of keys) {
        const idx = cols.findIndex(c => c.includes(k));
        if (idx !== -1) return state.csvColumns[idx];
    }
    return '';
}

function showColumnMapping() {
    const grid = document.getElementById('mapping-grid');
    if (!grid) return;
    grid.innerHTML = '';
    document.getElementById('column-mapping-section').style.display = 'block';
    
    // Explicitly 6 fields
    const fields = [
        { key: 'name', label: '👤 Student Name' },
        { key: 'id', label: '🔢 ID Number' },
        { key: 'branch', label: '🏫 Branch/Class' },
        { key: 'dob', label: '📅 Date of Birth' },
        { key: 'bloodGroup', label: '🩸 Blood Group' },
        { key: 'photo', label: '📸 Photo Filename' }
    ];

    fields.forEach(f => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        item.style.animation = 'fadeInUp 0.3s ease forwards';
        
        let options = `<option value="">— Select Column —</option>`;
        state.csvColumns.forEach(c => {
            const selected = state.mapping[f.key] === c ? 'selected' : '';
            options += `<option value="${c}" ${selected}>${c}</option>`;
        });

        item.innerHTML = `
            <label>${f.label}</label>
            <select id="map-${f.key}" class="config-input">
                ${options}
            </select>
        `;

        const select = item.querySelector('select');
        select.onchange = (e) => {
            state.mapping[f.key] = e.target.value;
            showToast(`Mapped ${f.label}`, 'info');
            updatePreview();
        };

        grid.appendChild(item);
    });
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 3000);
}

function removeCSV() { state.csvData = []; document.getElementById('csv-preview').style.display = 'none'; document.querySelector('#upload-csv .upload-zone').style.display = 'flex'; checkReadyState(); }
function removePhotos() { state.photos.clear(); document.getElementById('photos-preview').style.display = 'none'; document.querySelector('#upload-photos .upload-zone').style.display = 'flex'; checkReadyState(); }
function setupScrollEffects() {}
function downloadAllAsZip() {}
function removeTemplate() { changeTemplate(); }
