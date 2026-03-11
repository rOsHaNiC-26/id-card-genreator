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
            if (type === 'csv' && files.length) handleCSVFile(files[0]);
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
        if (e.target.files.length) handleCSVFile(e.target.files[0]);
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
function handleCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            state.csvData = results.data;
            state.csvColumns = results.meta.fields || [];
            
            // UI Update
            document.querySelector('#upload-csv .upload-zone').style.display = 'none';
            document.getElementById('csv-preview').style.display = 'block';
            document.getElementById('csv-name').textContent = file.name;
            document.getElementById('csv-rows').textContent = `${state.csvData.length} records`;

            autoMapColumns();
            showColumnMapping();
            checkReadyState();
            showToast('CSV Loaded Successfully', 'success');
        }
    });
}

function handlePhotoFiles(files) {
    const fileArray = Array.from(files);
    let loaded = 0;
    fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.photos.set(file.name, img);
                loaded++;
                if (loaded === fileArray.length) {
                    document.querySelector('#upload-photos .upload-zone').style.display = 'none';
                    document.getElementById('photos-preview').style.display = 'block';
                    document.getElementById('photos-count').textContent = `${loaded} Photos`;
                    
                    // Simple grid preview
                    const grid = document.getElementById('photos-grid-mini');
                    grid.innerHTML = '';
                    state.photos.forEach((val, key) => {
                        const i = document.createElement('img');
                        i.src = val.src;
                        grid.appendChild(i);
                    });
                    
                    checkReadyState();
                    showToast(`${loaded} Photos Loaded`, 'success');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ==================== EDITING LOGIC ====================
function renderEditForm(rowData) {
    const container = document.getElementById('edit-fields-container');
    container.innerHTML = '';

    const fields = [
        { key: state.mapping.name, label: 'Name' },
        { key: state.mapping.id, label: 'ID Number' },
        { key: state.mapping.branch, label: 'Branch/Class' },
        { key: state.mapping.dob, label: 'DOB' },
        { key: state.mapping.bloodGroup, label: 'Blood Group' }
    ];

    fields.forEach(field => {
        if (!field.key) return;
        const div = document.createElement('div');
        div.className = 'edit-field';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'config-input';
        input.value = rowData[field.key] || '';
        input.dataset.key = field.key;
        
        // Update state in real-time for preview, but don't commit yet
        input.oninput = (e) => {
            const currentData = { ...state.csvData[state.currentPreview] };
            currentData[field.key] = e.target.value;
            renderCard(document.getElementById('preview-canvas'), currentData);
        };

        div.appendChild(label);
        div.appendChild(input);
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
    const photoImg = photoName ? state.photos.get(photoName) : null;

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
    const cols = state.csvColumns.map(c => c.toLowerCase().trim());
    state.mapping.name = findCol(cols, ['name', 'full name', 'student name']);
    state.mapping.id = findCol(cols, ['id', 'roll', 'erp', 'enrollment']);
    state.mapping.branch = findCol(cols, ['branch', 'class', 'department', 'dept']);
    state.mapping.dob = findCol(cols, ['dob', 'date of birth']);
    state.mapping.bloodGroup = findCol(cols, ['blood', 'group']);
    state.mapping.photo = findCol(cols, ['photo', 'image', 'picture']);
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
    grid.innerHTML = '';
    document.getElementById('column-mapping-section').style.display = 'block';
    
    const fields = [
        { key: 'name', label: 'Student Name' },
        { key: 'id', label: 'ID Number' },
        { key: 'branch', label: 'Branch/Class' },
        { key: 'photo', label: 'Photo Filename' }
    ];

    fields.forEach(f => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        item.innerHTML = `<label>${f.label}</label><select id="map-${f.key}" onchange="state.mapping.${f.key}=this.value; updatePreview();">
            <option value="">Select Column</option>
            ${state.csvColumns.map(c => `<option value="${c}" ${state.mapping[f.key] === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>`;
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
