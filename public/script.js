class FileUploader {
	constructor() {
		this.files = [];
		this.init();
	}

	init() {
		this.setupEventListeners();
		this.loadUploadedFiles();
	}

	setupEventListeners() {
		const dropZone = document.getElementById("dropZone");
		const fileInput = document.getElementById("fileInput");
		const uploadBtn = document.getElementById("uploadBtn");
		const refreshBtn = document.getElementById("refreshBtn");

		// Click to browse files
		dropZone.addEventListener("click", () => fileInput.click());

		// File input change
		fileInput.addEventListener("change", (e) => {
			this.handleFiles(e.target.files);
		});

		// Drag and drop events
		dropZone.addEventListener("dragover", (e) => {
			e.preventDefault();
			dropZone.classList.add("dragover");
		});

		dropZone.addEventListener("dragleave", (e) => {
			e.preventDefault();
			dropZone.classList.remove("dragover");
		});

		dropZone.addEventListener("drop", (e) => {
			e.preventDefault();
			dropZone.classList.remove("dragover");
			this.handleFiles(e.dataTransfer.files);
		});

		// Upload button
		uploadBtn.addEventListener("click", () => this.uploadFiles());

		// Refresh button
		refreshBtn.addEventListener("click", () => this.loadUploadedFiles());
	}

	handleFiles(fileList) {
		const newFiles = Array.from(fileList);

		// Validate file size (10MB limit)
		const validFiles = newFiles.filter((file) => {
			if (!file.name.endsWith(".zip")) {
				this.showNotification(
					`File "${file.name}" is not allowed`,
					"error"
				);
				return false;
			}

			if (file.size > 10 * 1024 * 1024) {
				this.showNotification(
					`File "${file.name}" is too large (max 10MB)`,
					"error"
				);
				return false;
			}
			return true;
		});

		this.files = [...this.files, ...validFiles];
		this.updateFileList();
		this.updateUploadButton();
	}

	updateFileList() {
		const fileList = document.getElementById("fileList");
		fileList.innerHTML = "";

		this.files.forEach((file, index) => {
			const fileItem = document.createElement("div");
			fileItem.className = "file-item";
			fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(
						file.size
					)}</div>
                </div>
                <button class="remove-file" onclick="fileUploader.removeFile(${index})">Remove</button>
            `;
			fileList.appendChild(fileItem);
		});
	}

	removeFile(index) {
		this.files.splice(index, 1);
		this.updateFileList();
		this.updateUploadButton();
	}

	updateUploadButton() {
		const uploadBtn = document.getElementById("uploadBtn");
		uploadBtn.disabled = this.files.length === 0;
		uploadBtn.textContent =
			this.files.length > 0
				? `Upload ${this.files.length} file(s)`
				: "Upload Files";
	}

	async uploadFiles() {
		if (this.files.length === 0) return;

		const uploadBtn = document.getElementById("uploadBtn");
		const originalText = uploadBtn.textContent;

		uploadBtn.innerHTML = '<span class="loading"></span>Uploading...';
		uploadBtn.disabled = true;

		try {
			const formData = new FormData();
			this.files.forEach((file) => {
				formData.append("files", file);
			});

			const response = await fetch("/upload", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (response.ok) {
				this.showNotification(
					`Successfully uploaded ${result.files.length} file(s)`,
					"success"
				);
				this.files = [];
				this.updateFileList();
				this.loadUploadedFiles();
			} else {
				throw new Error(result.error || "Upload failed");
			}
		} catch (error) {
			console.error("Upload error:", error);
			this.showNotification(`Upload failed: ${error.message}`, "error");
		} finally {
			uploadBtn.textContent = originalText;
			this.updateUploadButton();
		}
	}

	async loadUploadedFiles() {
		try {
			const response = await fetch("/files");
			const files = await response.json();
			this.displayUploadedFiles(files);
		} catch (error) {
			console.error("Error loading files:", error);
			this.showNotification("Failed to load uploaded files", "error");
		}
	}

	displayUploadedFiles(files) {
		const container = document.getElementById("uploadedFilesList");

		if (files.length === 0) {
			container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <p>No files uploaded yet</p>
                </div>
            `;
			return;
		}

		container.innerHTML = files
			.map(
				(file) => `
            <div class="uploaded-file-item">
                <div class="uploaded-file-info">
                    <div class="uploaded-file-name">${file.filename}</div>
                    <div class="uploaded-file-meta">
                        ${this.formatFileSize(file.size)} • 
                        ${new Date(file.uploadDate).toLocaleString()}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="view-btn" onclick="window.open('${
						file.path
					}', '_blank')">View</button>
                    <button class="delete-btn" onclick="fileUploader.deleteFile('${
						file.filename
					}')">Delete</button>
                </div>
            </div>
        `
			)
			.join("");
	}

	async deleteFile(filename) {
		if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/files/${filename}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (response.ok) {
				this.showNotification("File deleted successfully", "success");
				this.loadUploadedFiles();
			} else {
				throw new Error(result.error || "Delete failed");
			}
		} catch (error) {
			console.error("Delete error:", error);
			this.showNotification(
				`Failed to delete file: ${error.message}`,
				"error"
			);
		}
	}

	formatFileSize(bytes) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	showNotification(message, type = "success") {
		const notification = document.getElementById("notification");
		notification.textContent = message;
		notification.className = `notification ${type}`;
		notification.classList.add("show");

		setTimeout(() => {
			notification.classList.remove("show");
		}, 3000);
	}
}

// Initialize the file uploader when the page loads
let fileUploader;
document.addEventListener("DOMContentLoaded", () => {
	fileUploader = new FileUploader();
});
