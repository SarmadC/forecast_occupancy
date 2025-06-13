/**
 * @file upload.js
 * @description Handles all logic for the data uploader page, including file
 * selection, drag-and-drop, CSV parsing, data validation, and uploading to Supabase.
 */

// --- STATE MANAGEMENT ---
let processedData = []; // Holds the validated data from the file.

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check for a user session before doing anything else.
    const supabaseClient = window.SupabaseConfig.getClient();
    let session = null;

    if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        session = data.session;
    }

    if (!session) {
        // If no user is logged in, redirect to the login page.
        window.location.replace(window.AppConstants?.ROUTES?.LOGIN || 'login.html');
        return; // Stop further script execution
    }

    // If a session exists, proceed with initializing the uploader page.
    const isConfigured = initializePage('uploader');
    if (!isConfigured) {
        console.warn("Uploader initialization halted: Supabase not configured.");
        return;
    }
    renderUploaderUI();
});


// --- UI RENDERING ---

/**
 * Renders the initial file input and drop zone UI.
 */
function renderUploaderUI() {
    const container = document.getElementById('uploader-component-container');
    if (!container) return;

    container.innerHTML = `
        <div id="drop-zone" class="drop-zone">
            <div class="drop-zone-prompt">
                <span class="drop-zone-icon">📁</span>
                <p class="drop-zone-title">Drag & drop your CSV file here</p>
                <p class="drop-zone-subtitle">or click to select a file</p>
                <label for="file-input" class="btn btn-primary">Browse Files</label>
                <input type="file" id="file-input" class="sr-only" accept=".csv">
                <p class="drop-zone-hint">Max file size: 50MB. Supported format: .csv</p>
            </div>
        </div>
        <div id="upload-actions" class="form-actions" style="display: none; justify-content: center; margin-top: var(--spacing-lg);">
            <button id="upload-button" class="btn btn-success btn-lg">
                🚀 Upload to Database
            </button>
        </div>
    `;

    // Attach event listeners after rendering the form.
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    uploadButton.addEventListener('click', handleUpload);
}


// --- FILE HANDLING & PROCESSING ---

function handleFileSelect(e) { handleFile(e.target.files[0]); }
function handleFileDrop(e) { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); }

/**
 * Main function to process a single file.
 * @param {File} file The file to be processed.
 */
async function handleFile(file) {
    if (!file) return;

    try {
        validateFile(file);
        showLoading('Processing file...');
        const transformedData = await processCsvFile(file);
        
        processedData = transformedData; // Store valid data
        renderPreviewTable(transformedData.slice(0, 100)); // Show a preview of the first 100 rows
        document.getElementById('upload-actions').style.display = 'flex';
        showAlert('File processed successfully. Review the preview below.', 'success');

    } catch (error) {
        showAlert(error.message, 'error');
        console.error("File processing failed:", error);
    } finally {
        hideLoading();
    }
}

/**
 * Reads and transforms a CSV file.
 * @param {File} file The file to process.
 * @returns {Promise<Array<object>>} A promise that resolves with the transformed data.
 */
function processCsvFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

                const transformedData = transformCsvData(rawData);
                validateTransformedData(transformedData);
                resolve(transformedData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

// --- DATA TRANSFORMATION & VALIDATION ---

/**
 * Transforms data from a simple, normalized CSV format.
 * @param {Array<Array<any>>} rawData The raw data from the worksheet.
 * @returns {Array<object>} The array of structured forecast records.
 */
function transformCsvData(rawData) {
    const header = rawData[0].map(h => String(h || '').trim().toLowerCase());
    const dataRows = rawData.slice(1);

    const colIndices = {
        asOfDate: header.findIndex(h => h === 'as_of_date'),
        reportId: header.findIndex(h => h === 'report_id'),
        city: header.findIndex(h => h === 'city'),
        forecastDate: header.findIndex(h => h === 'forecast_date'),
        marketSegment: header.findIndex(h => h === 'market_segment'),
        currentOccupancy: header.findIndex(h => h === 'current_occupancy'),
        stlyVariance: header.findIndex(h => h === 'stly_variance'),
        weeklyPickup: header.findIndex(h => h === 'weekly_pickup'),
        daysOut: header.findIndex(h => h === 'days_out'),
        forecastHorizon: header.findIndex(h => h === 'forecast_horizon')
    };

    const required = ['as_of_date', 'forecast_date', 'market_segment', 'current_occupancy'];
    for(const col of required) {
        if (colIndices[col.replace(/_([a-z])/g, g => g[1].toUpperCase())] === -1) {
             throw new Error(`Invalid CSV format. Missing required column: '${col}'.`);
        }
    }

    return dataRows.map(row => ({
        as_of_date: parseDate(row[colIndices.asOfDate]),
        report_id: row[colIndices.reportId],
        city: row[colIndices.city],
        forecast_date: parseDate(row[colIndices.forecastDate]),
        market_segment: row[colIndices.marketSegment],
        current_occupancy: parseNumber(row[colIndices.currentOccupancy]),
        stly_variance: parseNumber(row[colIndices.stlyVariance]),
        weekly_pickup: parseNumber(row[colIndices.weeklyPickup]),
        days_out: parseNumber(row[colIndices.daysOut]),
        forecast_horizon: row[colIndices.forecastHorizon],
    })).filter(row => row.as_of_date && row.forecast_date); // Filter out any empty rows
}


function validateTransformedData(data) {
    if (!data || data.length === 0) throw new Error('No data was extracted from the file.');
    const firstRecord = data[0];
    for (const field of AppConstants.VALIDATION.REQUIRED_COLUMNS) {
        if (!(field in firstRecord)) throw new Error(`Data is missing required field: ${field}`);
    }
}

function validateFile(file) {
    if (file.size > AppConstants.DATABASE.MAX_FILE_SIZE) throw new Error(AppConstants.ERROR_MESSAGES.FILE_TOO_LARGE);
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.csv'].includes(extension)) throw new Error("Invalid file format. Please upload .csv files only.");
}

// --- UTILITY FUNCTIONS ---

function parseDate(dateValue) {
    if (!dateValue) return null;
    try {
        if (typeof dateValue === 'number') {
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    } catch { /* fall through */ }
    return null;
}

function parseNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

// --- DATA UPLOAD ---

/**
 * Handles the final upload of processed data to Supabase.
 */
async function handleUpload() {
    if (processedData.length === 0) {
        showAlert('No data to upload.', 'error');
        return;
    }
    
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        showAlert("Cannot connect to the database. Please configure the connection first.", "error");
        return;
    }

    showLoading('Preparing to upload...');
    let uploadSucceeded = false;

    try {
        const reportId = processedData[0].report_id;
        let proceedWithUpload = true;

        if (reportId) {
            const { data: existing, error: checkError } = await supabaseClient
                .from(AppConstants.DATABASE.TABLE_NAME)
                .select('id')
                .eq('report_id', reportId)
                .limit(1);

            if (checkError) throw new Error(`Failed to check for existing report: ${checkError.message}`);

            if (existing && existing.length > 0) {
                const confirmed = await showModal(
                    'Overwrite Report?',
                    `A report named "<strong>${reportId}</strong>" already exists. Do you want to delete the old data and replace it with this new upload?`
                );

                if (confirmed) {
                    showLoading('Deleting old report...');
                    const { error: deleteError } = await supabaseClient
                        .from(AppConstants.DATABASE.TABLE_NAME)
                        .delete()
                        .eq('report_id', reportId);

                    if (deleteError) throw new Error(`Failed to delete old report: ${deleteError.message}`);
                    showAlert('Old report deleted. Starting new upload.', 'info');
                } else {
                    proceedWithUpload = false;
                }
            }
        }
        
        if (proceedWithUpload) {
            showLoading('Uploading data to database...', 0);
            for (let i = 0; i < processedData.length; i += AppConstants.DATABASE.BATCH_SIZE) {
                const batch = processedData.slice(i, i + AppConstants.DATABASE.BATCH_SIZE);
                const { error } = await supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).insert(batch);
                if (error) throw error;
                
                const progress = ((i + batch.length) / processedData.length) * 100;
                updateLoadingProgress(progress, `Uploading... ${Math.round(progress)}%`);
            }
            uploadSucceeded = true;
            showAlert(AppConstants.SUCCESS_MESSAGES.FILE_UPLOADED, 'success', 10000, [{
                label: 'Go to Dashboard',
                type: 'primary',
                onClick: `location.href='${AppConstants.ROUTES.DASHBOARD}'`
            }]);
        } else {
            showAlert('Upload cancelled by user.', 'info');
        }

    } catch (error) {
        console.error('Upload failed:', error);
        showAlert(`Upload failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
        if (uploadSucceeded) {
            document.getElementById('upload-actions').style.display = 'none';
            const previewContainer = document.getElementById('preview-container');
            if(previewContainer) {
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
            }
            processedData = [];
        }
    }
}


/**
 * Renders a data table preview using SharedComponents.
 * @param {Array<object>} data - The data to render in the table.
 */
function renderPreviewTable(data) {
    let container = document.getElementById('preview-container');
    if (!container) {
        const main = document.querySelector('.main-container');
        container = document.createElement('div');
        container.id = 'preview-container';
        main.appendChild(container);
    }
    container.style.display = 'block';

    const columns = Object.keys(data[0]).map(key => ({
        key: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    container.innerHTML = SharedComponents.createDataTable({
        data: data,
        columns: columns,
        title: 'Data Preview (First 100 Rows)',
    });
}