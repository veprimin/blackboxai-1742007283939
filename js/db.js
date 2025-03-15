class IntakeFormDB {
    constructor() {
        this.dbName = 'IntakeFormDB';
        this.dbVersion = 1;
        this.storeName = 'submissions';
        this.db = null;
        this.ready = this.init();
    }

    async init() {
        try {
            return new Promise((resolve, reject) => {
                // Check if IndexedDB is available
                if (!window.indexedDB) {
                    reject(new Error('IndexedDB is not supported in this browser'));
                    return;
                }

                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                    reject(new Error('Could not open database'));
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    console.log('Database opened successfully');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        console.log('Object store created');
                    }
                };
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async ensureReady() {
        await this.ready;
        if (!this.db) {
            throw new Error('Database not initialized');
        }
    }

    async addSubmission(formData) {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                // Add timestamp to the submission
                formData.timestamp = new Date().toISOString();
                
                const request = store.add(formData);

                request.onsuccess = () => {
                    console.log('Submission added successfully');
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error adding submission:', request.error);
                    reject(new Error('Failed to add submission'));
                };
            });
        } catch (error) {
            console.error('Add submission error:', error);
            throw error;
        }
    }

    async getAllSubmissions() {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    console.log('Retrieved all submissions successfully');
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error getting submissions:', request.error);
                    reject(new Error('Failed to get submissions'));
                };
            });
        } catch (error) {
            console.error('Get all submissions error:', error);
            throw error;
        }
    }

    async deleteSubmission(id) {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    console.log('Submission deleted successfully');
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting submission:', request.error);
                    reject(new Error('Failed to delete submission'));
                };
            });
        } catch (error) {
            console.error('Delete submission error:', error);
            throw error;
        }
    }
}

// Create a global instance of the database
const intakeFormDB = new IntakeFormDB();
