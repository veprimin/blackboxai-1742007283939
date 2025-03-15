class ExcelExporter {
    constructor() {
        if (!window.XLSX) {
            console.error('SheetJS (XLSX) library is required for Excel export');
        }
    }

    async exportToExcel() {
        try {
            // Get all submissions from IndexedDB
            const submissions = await intakeFormDB.getAllSubmissions();
            
            if (submissions.length === 0) {
                alert('No data available to export');
                return;
            }

            // Format data for Excel
            const worksheetData = submissions.map(submission => ({
                'Submission ID': submission.id,
                'Date': new Date(submission.timestamp).toLocaleString(),
                'First Name': submission.firstName,
                'Last Name': submission.lastName,
                'Age': submission.age,
                'Phone': submission.phone,
                'Email': submission.email,
                'Street Address': submission.street,
                'City': submission.city,
                'State': submission.state,
                'ZIP Code': submission.zip,
                'Comments': submission.comments
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            // Convert buffer to Blob
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `intake-form-submissions-${new Date().toISOString().split('T')[0]}.xlsx`;

            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting data to Excel');
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Create a global instance of the exporter
const excelExporter = new ExcelExporter();
