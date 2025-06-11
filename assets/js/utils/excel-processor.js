/**
 * Excel File Processor
 * Handles processing of Amadeus Excel files and data transformation
 */
class ExcelProcessor {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls'];
        this.maxFileSize = AppConstants.DATABASE.MAX_FILE_SIZE;
    }

    /**
     * Process multiple Excel files
     */
    async processFiles(files, onProgress = null) {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files provided for processing');
        }

        const results = [];
        let totalProcessed = 0;

        for (const file of files) {
            try {
                if (onProgress) {
                    onProgress({
                        type: 'file_start',
                        fileName: file.name,
                        current: totalProcessed,
                        total: files.length
                    });
                }

                const data = await this.processAmadeusFile(file);
                results.push({
                    fileName: file.name,
                    success: true,
                    data: data,
                    recordCount: data.length
                });

                totalProcessed++;

                if (onProgress) {
                    onProgress({
                        type: 'file_complete',
                        fileName: file.name,
                        recordCount: data.length,
                        current: totalProcessed,
                        total: files.length
                    });
                }

            } catch (error) {
                results.push({
                    fileName: file.name,
                    success: false,
                    error: error.message,
                    recordCount: 0
                });

                if (onProgress) {
                    onProgress({
                        type: 'file_error',
                        fileName: file.name,
                        error: error.message,
                        current: totalProcessed,
                        total: files.length
                    });
                }
            }
        }

        return results;
    }

    /**
     * Process a single Amadeus Excel file
     */
    async processAmadeusFile(file) {
        return new Promise((resolve, reject) => {
            // Validate file
            try {
                this.validateFile(file);
            } catch (error) {
                reject(error);
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: true,
                        cellFormulas: false,
                        cellStyles: false
                    });
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to 2D array
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1,
                        defval: null,
                        raw: false // Get formatted values
                    });
                    
                    console.log(`📊 Raw data extracted: ${rawData.length} rows`);
                    
                    // Transform the data
                    const transformedData = this.transformAmadeusData(rawData, file.name);
                    
                    console.log(`✅ Data transformation complete: ${transformedData.length} records`);
                    resolve(transformedData);
                    
                } catch (error) {
                    console.error('❌ Error processing Excel file:', error);
                    reject(new Error(`Failed to process ${file.name}: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Validate file before processing
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(AppConstants.ERROR_MESSAGES.FILE_TOO_LARGE);
        }

        // Check file extension
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            throw new Error(AppConstants.ERROR_MESSAGES.INVALID_FILE_FORMAT);
        }

        // Check file name format (should be City_YYYY_MM_DD.xlsx)
        const namePattern = /^[A-Za-z]+_\d{4}_\d{2}_\d{2}\.(xlsx|xls)$/;
        if (!namePattern.test(file.name)) {
            console.warn(`⚠️ File name doesn't match expected pattern: ${file.name}`);
        }
    }

    /**
     * Transform raw Excel data to database format
     */
    transformAmadeusData(rawData, fileName) {
        console.log('🔄 Starting data transformation...');
        
        // Extract metadata from filename and file content
        const metadata = this.extractMetadata(rawData, fileName);
        console.log('📋 Metadata extracted:', metadata);
        
        // Find where the actual data starts
        const dataStartRow = this.findDataStartRow(rawData);
        if (dataStartRow === -1) {
            throw new Error('Could not find data section in Excel file. Please check file format.');
        }
        
        console.log(`📍 Data starts at row ${dataStartRow + 1}`);
        
        // Transform data rows
        const transformedData = this.transformDataRows(rawData, metadata, dataStartRow);
        
        // Validate transformed data
        this.validateTransformedData(transformedData);
        
        return transformedData;
    }

    /**
     * Extract metadata from filename and file content
     */
    extractMetadata(rawData, fileName) {
        const metadata = {
            fileName: fileName,
            reportId: fileName.replace(/\.(xlsx|xls)$/, ''),
            asOfDate: null,
            city: null,
            totalCapacity: null
        };
        
        // Extract from filename (e.g., Edmonton_2024_12_10.xlsx)
        const fileNameParts = fileName.replace(/\.(xlsx|xls)$/, '').split('_');
        if (fileNameParts.length >= 4) {
            metadata.city = fileNameParts[0];
            metadata.asOfDate = `${fileNameParts[1]}-${fileNameParts[2]}-${fileNameParts[3]}`;
        }
        
        // Extract from file content for validation
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const row = rawData[i];
            if (!row || row.length < 3) continue;
            
            const label = String(row[1] || '').trim().toLowerCase();
            const value = row[2];
            
            if (label.includes('as of date') && value) {
                metadata.asOfDateFromFile = this.parseDate(value);
            } else if (label.includes('comp set') && value) {
                metadata.cityFromFile = String(value).trim();
            } else if (label.includes('total capacity') && value) {
                metadata.totalCapacity = this.parseNumber(value);
            }
        }
        
        // Use file content data if filename parsing failed
        if (!metadata.asOfDate && metadata.asOfDateFromFile) {
            metadata.asOfDate = metadata.asOfDateFromFile;
        }
        if (!metadata.city && metadata.cityFromFile) {
            metadata.city = metadata.cityFromFile;
        }
        
        // Final validation
        if (!metadata.asOfDate) {
            throw new Error('Could not determine "As of Date" from file');
        }
        if (!metadata.city) {
            throw new Error('Could not determine city from file');
        }
        
        return metadata;
    }

    /**
     * Find the row where actual data starts
     */
    findDataStartRow(rawData) {
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length < 6) continue;
            
            // Look for the header row pattern: ..., "Current", "Wkly Pickup", "STLY Var", ...
            const hasCurrentColumn = String(row[3] || '').toLowerCase().includes('current');
            const hasPickupColumn = String(row[4] || '').toLowerCase().includes('pickup');
            const hasVarianceColumn = String(row[5] || '').toLowerCase().includes('var');
            
            if (hasCurrentColumn && hasPickupColumn && hasVarianceColumn) {
                return i + 1; // Data starts on the next row
            }
        }
        
        return -1; // Not found
    }

    /**
     * Transform data rows into database format
     */
    transformDataRows(rawData, metadata, dataStartRow) {
        const transformedData = [];
        
        // Define segment column mappings
        const segmentMappings = [
            { name: 'Totals', currentCol: 3, pickupCol: 4, varianceCol: 5 },
            { name: 'Transient', currentCol: 6, pickupCol: 7, varianceCol: 8 },
            { name: 'Group_Sold', currentCol: 9, pickupCol: 10, varianceCol: 11 },
            { name: 'Unsold_Block', currentCol: 12, pickupCol: 13, varianceCol: 14 },
            { name: 'Other', currentCol: 15, pickupCol: 16, varianceCol: 17 }
        ];
        
        for (let i = dataStartRow; i < rawData.length; i++) {
            const row = rawData[i];
            
            // Skip empty rows or rows without a valid date
            if (!row || row.length < 18 || !row[2]) continue;
            
            const forecastDate = this.parseDate(row[2]);
            if (!forecastDate) {
                console.warn(`⚠️ Skipping row ${i + 1}: Invalid date format`);
                continue;
            }
            
            const daysOut = this.calculateDaysOut(forecastDate, metadata.asOfDate);
            const forecastHorizon = getHorizonFromDaysOut(daysOut);
            
            // Create records for each market segment
            for (const segment of segmentMappings) {
                const currentOccupancy = this.parseNumber(row[segment.currentCol]) * 100; // Convert to percentage
                const weeklyPickup = this.parseNumber(row[segment.pickupCol]);
                const stlyVariance = this.parseNumber(row[segment.varianceCol]);
                
                transformedData.push({
                    as_of_date: metadata.asOfDate,
                    report_id: metadata.reportId,
                    city: metadata.city,
                    forecast_date: forecastDate,
                    market_segment: segment.name,
                    current_occupancy: Math.round(currentOccupancy * 100) / 100, // Round to 2 decimals
                    weekly_pickup: Math.round(weeklyPickup * 100) / 100,
                    stly_variance: Math.round(stlyVariance * 100) / 100,
                    days_out: daysOut,
                    forecast_horizon: forecastHorizon
                });
            }
        }
        
        return transformedData;
    }

    /**
     * Parse date from various formats
     */
    parseDate(dateValue) {
        if (!dateValue) return null;
        
        try {
            // Handle Excel serial dates
            if (typeof dateValue === 'number') {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toISOString().split('T')[0];
            }
            
            // Handle string dates
            if (typeof dateValue === 'string') {
                // Remove day names (Mon, Tue, etc.)
                let cleaned = dateValue.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/i, '').trim();
                
                // Try parsing directly
                const date = new Date(cleaned);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                // Try MM/DD/YYYY format
                const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (mmddyyyy) {
                    const [, month, day, year] = mmddyyyy;
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
            
            // Handle Date objects
            if (dateValue instanceof Date) {
                return dateValue.toISOString().split('T')[0];
            }
            
        } catch (error) {
            console.warn(`⚠️ Could not parse date: ${dateValue}`, error);
        }
        
        return null;
    }

    /**
     * Parse number from various formats
     */
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (value === null || value === undefined || value === '') return 0;
        
        if (typeof value === 'string') {
            // Remove everything except numbers, dots, and minus signs
            const cleaned = value.replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        
        return 0;
    }

    /**
     * Calculate days between forecast date and as-of date
     */
    calculateDaysOut(forecastDate, asOfDate) {
        const forecast = new Date(forecastDate);
        const asOf = new Date(asOfDate);
        return Math.round((forecast - asOf) / (1000 * 60 * 60 * 24));
    }

    /**
     * Validate transformed data
     */
    validateTransformedData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No data was extracted from the file');
        }

        // Check for required fields
        const requiredFields = AppConstants.VALIDATION.REQUIRED_COLUMNS;
        const sampleRecord = data[0];
        
        for (const field of requiredFields) {
            if (!(field in sampleRecord)) {
                throw new Error(`Missing required field in transformed data: ${field}`);
            }
        }

        // Validate data ranges for a sample of records
        let validationErrors = [];
        
        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const record = data[i];
            
            if (record.current_occupancy < 0 || record.current_occupancy > 100) {
                validationErrors.push(`Row ${i + 1}: Occupancy out of range (${record.current_occupancy}%)`);
            }
            
            if (Math.abs(record.stly_variance) > 100) {
                validationErrors.push(`Row ${i + 1}: STLY variance seems extreme (${record.stly_variance}%)`);
            }
            
            if (!AppConstants.MARKET_SEGMENTS.includes(record.market_segment)) {
                validationErrors.push(`Row ${i + 1}: Unknown market segment (${record.market_segment})`);
            }
        }

        if (validationErrors.length > 0) {
            console.warn('⚠️ Data validation warnings:', validationErrors.slice(0, 5));
            if (validationErrors.length > 10) {
                throw new Error(`Too many validation errors (${validationErrors.length}). Please check your file format.`);
            }
        }

        // Log summary statistics
        const totalRecords = data.length;
        const dateRange = {
            min: Math.min(...data.map(d => new Date(d.forecast_date))),
            max: Math.max(...data.map(d => new Date(d.forecast_date)))
        };
        
        console.log(`✅ Validation passed: ${totalRecords} records, date range: ${new Date(dateRange.min).toDateString()} to ${new Date(dateRange.max).toDateString()}`);
    }

    /**
     * Get processing summary
     */
    static createProcessingSummary(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const totalRecords = successful.reduce((sum, r) => sum + r.recordCount, 0);
        
        return {
            totalFiles: results.length,
            successfulFiles: successful.length,
            failedFiles: failed.length,
            totalRecords: totalRecords,
            errors: failed.map(f => ({ fileName: f.fileName, error: f.error }))
        };
    }
}

// Global instance
window.excelProcessor = new ExcelProcessor();

console.log('✅ Excel processor loaded');