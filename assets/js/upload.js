/**
 * @file upload.js
 * @description Handles all logic for the data uploader page, including file
 * selection, drag-and-drop, detailed Excel parsing, data validation, and uploading to Supabase.
 */

// --- STATE MANAGEMENT ---
let processedData = []; // Holds the validated data from the Excel file.

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
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
                <p class="drop-zone-title">Drag & drop your Excel file here</p>
                <p class="drop-zone-subtitle">or click to select a file</p>
                <label for="file-input" class="btn btn-primary">Browse Files</label>
                <input type="file" id="file-input" class="sr-only" accept=".xlsx, .xls">
                <p class="drop-zone-hint">Max file size: 50MB. Supported formats: .xlsx, .xls</p>
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
        showLoading('Processing Excel file...');
        const transformedData = await processAmadeusFile(file);
        
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
 * Reads and transforms a single Amadeus Excel file.
 * @param {File} file The file to process.
 * @returns {Promise<Array<object>>} A promise that resolves with the transformed data.
 */
function processAmadeusFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

                const transformedData = transformAmadeusData(rawData, file.name);
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


// --- DATA TRANSFORMATION & VALIDATION (Logic from ExcelProcessor) ---

/**
 * Transforms raw 2D array data from Excel into structured JSON.
 * @param {Array<Array<any>>} rawData The raw data from the worksheet.
 * @param {string} fileName The name of the original file.
 * @returns {Array<object>} The array of structured forecast records.
 */
function transformAmadeusData(rawData, fileName) {
    const metadata = extractMetadata(rawData, fileName);
    const dataStartRow = findDataStartRow(rawData);
    if (dataStartRow === -1) throw new Error('Could not find the data header row in the Excel file.');
    
    const transformed = [];
    const segmentMappings = [
        { name: 'Totals', cols: [3, 4, 5] }, { name: 'Transient', cols: [6, 7, 8] },
        { name: 'Group_Sold', cols: [9, 10, 11] }, { name: 'Unsold_Block', cols: [12, 13, 14] },
        { name: 'Other', cols: [15, 16, 17] }
    ];

    for (let i = dataStartRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[2]) continue;

        const forecastDate = parseDate(row[2]);
        if (!forecastDate) continue;

        const daysOut = calculateDaysOut(forecastDate, metadata.asOfDate);

        for (const segment of segmentMappings) {
            transformed.push({
                as_of_date: metadata.asOfDate,
                report_id: metadata.reportId,
                city: metadata.city,
                forecast_date: forecastDate,
                market_segment: segment.name,
                current_occupancy: parseNumber(row[segment.cols[0]]) * 100,
                weekly_pickup: parseNumber(row[segment.cols[1]]),
                stly_variance: parseNumber(row[segment.cols[2]]),
                days_out: daysOut,
                forecast_horizon: getHorizonFromDaysOut(daysOut)
            });
        }
    }
    return transformed;
}

function extractMetadata(rawData, fileName) {
    const metadata = {
        fileName: fileName,
        reportId: fileName.replace(/\.(xlsx|xls)$/, ''),
        asOfDate: null,
        city: null,
    };
    
    const nameParts = fileName.replace(/\.(xlsx|xls)$/, '').split('_');
    if (nameParts.length >= 4) {
        metadata.city = nameParts[0];
        metadata.asOfDate = `${nameParts[1]}-${nameParts[2].padStart(2, '0')}-${nameParts[3].padStart(2, '0')}`;
    }

    if (!metadata.asOfDate || !metadata.city) {
         for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const row = rawData[i];
            if (!row || row.length < 3) continue;
            const label = String(row[1] || '').trim().toLowerCase();
            const value = row[2];
            if (label.includes('as of date') && value && !metadata.asOfDate) metadata.asOfDate = parseDate(value);
            if (label.includes('comp set') && value && !metadata.city) metadata.city = String(value).trim();
        }
    }
    
    if (!metadata.asOfDate) throw new Error('Could not determine "As of Date".');
    if (!metadata.city) throw new Error('Could not determine City.');
    
    return metadata;
}

function findDataStartRow(rawData) {
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] || [];
        const hasCurrent = String(row[3] || '').toLowerCase().includes('current');
        const hasPickup = String(row[4] || '').toLowerCase().includes('pickup');
        const hasVariance = String(row[5] || '').toLowerCase().includes('var');
        if (hasCurrent && hasPickup && hasVariance) return i + 1;
    }
    return -1;
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
    if (!['.xlsx', '.xls'].includes(extension)) throw new Error(AppConstants.ERROR_MESSAGES.INVALID_FILE_FORMAT);
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

function calculateDaysOut(forecastDate, asOfDate) {
    const forecast = new Date(forecastDate);
    const asOf = new Date(asOfDate);
    return Math.round((forecast.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
}


// --- DATA UPLOAD ---

/**
 * Handles the final upload of processed data to Supabase,
 * including a check for existing reports and an overwrite confirmation flow.
 */
async function handleUpload() {
    if (processedData.length === 0) {
        showAlert('No data to upload.', 'error');
        return;
    }

    showLoading('Preparing to upload...');
    let uploadSucceeded = false;

    try {
        const reportId = processedData[0].report_id;

        // Step 1: Check if the report already exists
        const { data: existing, error: checkError } = await supabase
            .from(AppConstants.DATABASE.TABLE_NAME)
            .select('id')
            .eq('report_id', reportId)
            .limit(1);

        if (checkError) throw new Error(`Failed to check for existing report: ${checkError.message}`);

        let proceedWithUpload = true;
        if (existing && existing.length > 0) {
            // Step 2: Ask user for overwrite confirmation
            const confirmed = await showModal(
                'Overwrite Report?',
                `A report named "<strong>${reportId}</strong>" already exists. Do you want to delete the old data and replace it with this new upload?`
            );

            if (confirmed) {
                // Step 3: Delete the old data
                showLoading('Deleting old report...');
                const { error: deleteError } = await supabase
                    .from(AppConstants.DATABASE.TABLE_NAME)
                    .delete()
                    .eq('report_id', reportId);

                if (deleteError) throw new Error(`Failed to delete old report: ${deleteError.message}`);
                showAlert('Old report deleted. Starting new upload.', 'info');
            } else {
                proceedWithUpload = false;
            }
        }

        // Step 4: Proceed with upload if confirmed or not a duplicate
        if (proceedWithUpload) {
            showLoading('Uploading data to database...', 0);
            for (let i = 0; i < processedData.length; i += AppConstants.DATABASE.BATCH_SIZE) {
                const batch = processedData.slice(i, i + AppConstants.DATABASE.BATCH_SIZE);
                const { error } = await supabase.from(AppConstants.DATABASE.TABLE_NAME).insert(batch);
                if (error) throw error;
                
                const progress = ((i + batch.length) / processedData.length) * 100;
                updateLoadingProgress(progress, `Uploading... ${Math.round(progress)}%`);
            }
            uploadSucceeded = true; // Mark as successful
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
        // Only reset the UI if the upload was fully successful
        if (uploadSucceeded) {
            document.getElementById('upload-actions').style.display = 'none';
            document.getElementById('preview-container').style.display = 'none';
            processedData = [];
        }
    }
}


/**
 * Renders a data table preview using SharedComponents.
 * @param {Array<object>} data - The data to render in the table.
 */
function renderPreviewTable(data) {
    const container = document.getElementById('preview-container');
    container.style.display = 'block';

    const columns = Object.keys(data[0]).map(key => ({
        key: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: key.includes('date') ? 'date' : 'text'
    }));

    container.innerHTML = SharedComponents.createDataTable({
        data: data,
        columns: columns,
        title: 'Data Preview (First 100 Rows)',
    });
}