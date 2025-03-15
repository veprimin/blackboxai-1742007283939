// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

class IntakeFormApp {
    constructor() {
        console.log('Initializing IntakeFormApp');
        this.form = document.getElementById('intakeForm');
        this.submissionsList = document.getElementById('submissionsList');
        this.exportBtn = document.getElementById('exportBtn');
        this.offlineStatus = document.getElementById('offlineStatus');
        
        if (!this.form) {
            console.error('Form element not found');
            return;
        }

        this.initializeEventListeners();
        this.checkOnlineStatus();
        this.loadSubmissions();
    }

    initializeEventListeners() {
        console.log('Setting up event listeners');
        
        // Form submission
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submit event triggered');
            await this.handleSubmission();
        });

        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                console.log('Export button clicked');
                excelExporter.exportToExcel();
            });
        }

        // Online/Offline status
        window.addEventListener('online', () => this.checkOnlineStatus());
        window.addEventListener('offline', () => this.checkOnlineStatus());
    }

    checkOnlineStatus() {
        const isOnline = navigator.onLine;
        console.log('Online status:', isOnline);
        if (isOnline) {
            this.offlineStatus.classList.add('hidden');
        } else {
            this.offlineStatus.classList.remove('hidden');
        }
    }

    async handleSubmission() {
        try {
            console.log('Handling form submission');
            const formData = this.getFormData();
            console.log('Form data collected:', formData);

            // Validate form data
            if (!this.validateFormData(formData)) {
                console.error('Form validation failed');
                this.showNotification('Please fill in all required fields.', 'error');
                return;
            }

            await intakeFormDB.addSubmission(formData);
            console.log('Submission added to database');
            
            this.showNotification('Form submitted successfully!', 'success');
            this.form.reset();
            await this.loadSubmissions();
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showNotification('Error submitting form. Please try again.', 'error');
        }
    }

    validateFormData(formData) {
        // Check required fields
        const requiredFields = ['firstName', 'age', 'phone', 'email', 'street', 'city', 'state', 'zip'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }
        return true;
    }

    getFormData() {
        const formData = {
            firstName: this.form.querySelector('[name="firstName"]').value.trim(),
            lastName: this.form.querySelector('[name="lastName"]').value.trim(),
            age: parseInt(this.form.querySelector('[name="age"]').value),
            phone: this.form.querySelector('[name="phone"]').value.trim(),
            email: this.form.querySelector('[name="email"]').value.trim(),
            street: this.form.querySelector('[name="street"]').value.trim(),
            city: this.form.querySelector('[name="city"]').value.trim(),
            state: this.form.querySelector('[name="state"]').value.trim(),
            zip: this.form.querySelector('[name="zip"]').value.trim(),
            comments: this.form.querySelector('[name="comments"]').value.trim()
        };
        console.log('Collected form data:', formData);
        return formData;
    }

    async loadSubmissions() {
        try {
            console.log('Loading submissions');
            const submissions = await intakeFormDB.getAllSubmissions();
            console.log('Retrieved submissions:', submissions);
            this.renderSubmissions(submissions);
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.showNotification('Error loading submissions', 'error');
        }
    }

    renderSubmissions(submissions) {
        if (!this.submissionsList) {
            console.error('Submissions list element not found');
            return;
        }

        this.submissionsList.innerHTML = '';
        
        if (submissions.length === 0) {
            this.submissionsList.innerHTML = `
                <div class="text-gray-500 text-center py-4">
                    No submissions yet
                </div>
            `;
            return;
        }

        submissions.reverse().forEach(submission => {
            const submissionEl = document.createElement('div');
            submissionEl.className = 'bg-gray-50 p-4 rounded-lg mb-4';
            submissionEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-medium">${submission.firstName} ${submission.lastName || ''}</h3>
                        <p class="text-sm text-gray-500">
                            Submitted on ${new Date(submission.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button 
                        class="text-red-600 hover:text-red-800 px-2 py-1" 
                        onclick="app.deleteSubmission(${submission.id})"
                    >
                        Delete
                    </button>
                </div>
                <div class="mt-2 text-sm text-gray-600">
                    <p>Email: ${submission.email} | Phone: ${submission.phone}</p>
                    <p>Address: ${submission.street}, ${submission.city}, ${submission.state} ${submission.zip}</p>
                    ${submission.comments ? `<p class="mt-2">Comments: ${submission.comments}</p>` : ''}
                </div>
            `;
            this.submissionsList.appendChild(submissionEl);
        });
    }

    async deleteSubmission(id) {
        if (confirm('Are you sure you want to delete this submission?')) {
            try {
                await intakeFormDB.deleteSubmission(id);
                this.showNotification('Submission deleted successfully!', 'success');
                await this.loadSubmissions();
            } catch (error) {
                console.error('Error deleting submission:', error);
                this.showNotification('Error deleting submission', 'error');
            }
        }
    }

    showNotification(message, type = 'success') {
        console.log(`Showing notification: ${message} (${type})`);
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    window.app = new IntakeFormApp();
});
