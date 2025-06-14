/**
 * @file upload.js
 * @description Enhanced logic for the data uploader page. Handles file processing,
 * validation, interactive UI updates, and batch uploading to Supabase.
 */

// --- STATE MANAGEMENT ---
const uploaderState = {
    file: null,
    processedData: [],
    isValid: false,
    isUploading: false,
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Redirect to login if no session exists.
    const supabaseClient = window.SupabaseConfig.getClient();
    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.replace(window.AppConstants.ROUTES.LOGIN);
            return;
        }
    } else {
        window.location.replace(window.AppConstants.ROUTES.LOGIN);
        return;
    }

    // Initialize the page and render the uploader UI.
    initializePage('uploader');
    renderUploaderUI();
    bindEventListeners();
});

// --- UI RENDERING ---

/**
 * Renders the initial state of the uploader.
 */
function renderUploaderUI() {
    const container = document.getElementById('uploader-component-container');
    if (!container) return;

    container.innerHTML = `
        <div id="drop-zone" class="drop-zone">
            <div class="drop-zone-prompt">
                <div class="drop-zone-icon animate-float">📤</div>
                <h2 class="drop-zone-title">Drag & Drop Your File</h2>
                <p class="drop-zone-subtitle">or</p>
                <button onclick="document.getElementById('file-input').click()" class="btn btn-primary">
                    Browse Files
                </button>
                <input type="file" id="file-input" class="sr-only" accept=".xlsx, .xls, .csv">
                <div class="file-type-icons">
                     <span>Excel (.xlsx)</span>
                     <span>CSV (.csv)</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Updates the UI to show a preview of the selected file.
 */
function renderFilePreview() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone || !uploaderState.file) return;

    dropZone.innerHTML = `
        <div class="file-preview-card animate-scaleIn">
            <div class="file-preview-icon">📄</div>
            <div class="file-preview-info">
                <div class="file-preview-name">${uploaderState.file.name}</div>
                <div class="file-preview-details">
                    ${(uploaderState.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
            </div>
            <div class="file-preview-actions">
                <button class="btn btn-secondary btn-sm" onclick="resetUploaderState()">Change File</button>
            </div>
        </div>
    `;
    dropZone.classList.remove('drag-over');
    dropZone.style.borderStyle = 'solid';
}

/**
 * Renders the data preview table and validation results.
 */
function renderDataPreview() {
    const previewContainer = document.getElementById('preview-container');
    const actionsContainer = document.getElementById('upload-actions-container');
    if (!previewContainer || !actionsContainer) return;

    previewContainer.style.display = 'block';

    const columns = Object.keys(uploaderState.processedData[0]).map(key => ({
        key: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    previewContainer.innerHTML = `
        ${SharedComponents.createDataTable({
            data: uploaderState.processedData.slice(0, 100), // Preview first 100 rows
            columns: columns,
            title: 'Data Preview (First 100 Rows)',
        })}
    `;
    
    // Render sticky upload button
    actionsContainer.innerHTML = `
        <div id="upload-actions" class="animate-fadeInUp">
             <button id="upload-button" class="btn btn-success btn-lg">
                <span class="btn-text">🚀 Finalize and Upload Data</span>
                <span class="btn-loading" style="display:none;">
                    <span class="spinner-small"></span> Uploading...
                </span>
            </button>
        </div>
    `;
    document.getElementById('upload-button').addEventListener('click', handleUpload);
}

// --- EVENT BINDING ---

function bindEventListeners() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone) {
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', handleFileDrop);
    }
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// --- FILE HANDLING & PROCESSING ---

function handleFileSelect(e) { handleFile(e.target.files[0]); }
function handleFileDrop(e) { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }

async function handleFile(file) {
    if (!file) return;

    try {
        validateFileMetadata(file);
        uploaderState.file = file;
        showLoading('Processing file...');
        
        renderFilePreview(); // Show file info immediately

        const data = await parseFile(file);
        const validatedData = validateDataRows(data);
        
        uploaderState.processedData = validatedData;
        uploaderState.isValid = true;

        renderDataPreview();
        showAlert('File processed successfully. Review the preview below.', 'success');
    } catch (error) {
        showAlert(error.message, 'error', 8000);
        console.error("File processing failed:", error);
        resetUploaderState();
    } finally {
        hideLoading();
    }
}

function parseFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
                
                const header = jsonData[0].map(h => String(h || '').trim().toLowerCase().replace(/ /g, '_'));
                const dataRows = jsonData.slice(1);

                const mappedData = dataRows.map(row => {
                    const rowData = {};
                    header.forEach((h, i) => {
                        rowData[h] = row[i];
                    });
                    return rowData;
                });
                
                resolve(mappedData);
            } catch (err) {
                reject(new Error('Failed to parse file content. Ensure it is a valid Excel or CSV file.'));
            }
        };
        reader.onerror = () => reject(new Error('There was an error reading the file.'));
        reader.readAsArrayBuffer(file);
    });
}

// --- DATA VALIDATION ---

function validateFileMetadata(file) {
    if (file.size > AppConstants.DATABASE.MAX_FILE_SIZE) throw new Error(AppConstants.ERROR_MESSAGES.FILE_TOO_LARGE);
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(extension)) throw new Error(AppConstants.ERROR_MESSAGES.INVALID_FILE_FORMAT);
}

function validateDataRows(data) {
    if (!data || data.length === 0) throw new Error('No data rows found in the file.');
    
    // Check for required columns in the first row
    const firstRow = data[0];
    for (const col of AppConstants.VALIDATION.REQUIRED_COLUMNS) {
        if (!(col in firstRow)) {
            throw new Error(`Data validation failed. Missing required column: '${col}'.`);
        }
    }

    // Sanitize and type-cast each row
    return data.map((row, index) => {
        const asOfDate = formatDate(row.as_of_date, 'iso');
        const forecastDate = formatDate(row.forecast_date, 'iso');
        
        if (!asOfDate || !forecastDate) return null; // Skip rows with invalid dates

        return {
            as_of_date: asOfDate,
            city: String(row.city || 'N/A'),
            forecast_date: forecastDate,
            market_segment: String(row.market_segment || 'Other'),
            current_occupancy: parseFloat(row.current_occupancy || 0),
            stly_variance: parseFloat(row.stly_variance || 0),
            weekly_pickup: parseInt(row.weekly_pickup || 0),
        };
    }).filter(row => row !== null); // Filter out any rows that were invalid
}


// --- DATA UPLOAD ---

async function handleUpload() {
    if (!uploaderState.isValid || uploaderState.processedData.length === 0) {
        showAlert('No valid data to upload.', 'error');
        return;
    }
    
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        showAlert(AppConstants.ERROR_MESSAGES.CONNECTION_FAILED, 'error');
        return;
    }

    const uploadBtn = document.getElementById('upload-button');
    const btnText = uploadBtn.querySelector('.btn-text');
    const btnLoading = uploadBtn.querySelector('.btn-loading');
    
    try {
        uploaderState.isUploading = true;
        uploadBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        
        showLoading('Uploading data to database...', 0);

        // Batch upload process
        for (let i = 0; i < uploaderState.processedData.length; i += AppConstants.DATABASE.BATCH_SIZE) {
            const batch = uploaderState.processedData.slice(i, i + AppConstants.DATABASE.BATCH_SIZE);
            const { error } = await supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).insert(batch);
            if (error) throw error;
            
            const progress = ((i + batch.length) / uploaderState.processedData.length) * 100;
            updateLoadingProgress(progress);
        }

        showAlert(AppConstants.SUCCESS_MESSAGES.FILE_UPLOADED, 'success', 10000);
        resetUploaderState(true);

    } catch (error) {
        hideLoading(); // Hide loading overlay immediately on error
        console.error('Upload failed:', error);
        showAlert(`Upload failed: ${error.message}`, 'error');
    } finally {
        uploaderState.isUploading = false;
        uploadBtn.disabled = false;
        btnText.style.display = 'inline-flex';
        btnLoading.style.display = 'none';
    }
}

// --- UTILITY & STATE RESET ---

function resetUploaderState(isSuccess = false) {
    uploaderState.file = null;
    uploaderState.processedData = [];
    uploaderState.isValid = false;

    if (isSuccess) {
        const container = document.getElementById('uploader-component-container');
        container.innerHTML = `
            <div class="empty-state animate-scaleIn">
                <div class="empty-icon">✅</div>
                <h2 class="empty-title">Upload Successful!</h2>
                <p class="empty-message">Your data has been successfully imported and is now available on the dashboard.</p>
                <div class="empty-actions">
                    <button class="btn btn-secondary" onclick="resetUploaderState()">Upload Another File</button>
                    <a href="${AppConstants.ROUTES.DASHBOARD}" class="btn btn-primary">Go to Dashboard</a>
                </div>
            </div>
        `;
    } else {
        renderUploaderUI();
    }
    
    // Clear preview and actions
    const previewContainer = document.getElementById('preview-container');
    const actionsContainer = document.getElementById('upload-actions-container');
    if (previewContainer) previewContainer.innerHTML = '';
    if (actionsContainer) actionsContainer.innerHTML = '';
}