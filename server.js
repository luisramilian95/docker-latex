const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		// Keep original filename with timestamp to avoid conflicts
		const timestamp = Date.now();
		const ext = path.extname(file.originalname);
		const name = path.basename(file.originalname, ext);
		cb(null, `${name}-${timestamp}${ext}`);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

// Serve static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle file upload
app.post("/upload", upload.array("files"), async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: "No files uploaded" });
		}

		if (!req.files[0].originalname.endsWith(".zip")) {
			return res
				.status(400)
				.json({ error: "Only .tex files are allowed" });
		}

		const uploadedFiles = req.files.map((file) => ({
			originalName: file.originalname,
			filename: file.filename,
			size: file.size,
			mimetype: file.mimetype,
			path: `/uploads/${file.filename}`,
		}));

		await convertToPdf(req.files[0].path, uploadedFiles[0].originalName);

		fs.unlinkSync(req.files[0].path);

		res.json({
			message: "Files uploaded successfully",
			files: uploadedFiles,
		});
	} catch (error) {
		console.error("Upload error:", error);
		res.status(500).json({ error: "Failed to upload files" });
	}
});

// Get list of uploaded files
app.get("/files", (req, res) => {
	try {
		const files = fs.readdirSync(uploadsDir).map((filename) => {
			const filePath = path.join(uploadsDir, filename);
			const stats = fs.statSync(filePath);
			return {
				filename,
				size: stats.size,
				uploadDate: stats.birthtime,
				path: `/uploads/${filename}`,
			};
		});
		res.json(files);
	} catch (error) {
		console.error("Error reading files:", error);
		res.status(500).json({ error: "Failed to read files" });
	}
});

// Delete a file
app.delete("/files/:filename", (req, res) => {
	try {
		const filename = req.params.filename;
		const filePath = path.join(uploadsDir, filename);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			res.json({ message: "File deleted successfully" });
		} else {
			res.status(404).json({ error: "File not found" });
		}
	} catch (error) {
		console.error("Delete error:", error);
		res.status(500).json({ error: "Failed to delete file" });
	}
});

const convertToPdf = async (zipFilePath, originalName) => {
	//verify if the zipFilePath exists
	if (!fs.existsSync(zipFilePath)) {
		return Promise.reject(new Error("Zip file not found"));
	}

	const outputDir = "/tmp/latex";
	const zipFileName = path.basename(originalName, ".zip");
	// remove temporal dir called "/tmp/latex"
	return new Promise((resolve, reject) => {
		exec(`rm -rf /tmp/latex`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Cleanup error: ${error.message}`);
				return reject(new Error("Failed to clean up temporary files"));
			}
			if (stderr) {
				console.error(`Cleanup stderr: ${stderr}`);
				return reject(new Error("Cleanup completed with warnings"));
			}
			resolve();
		});
	})
		.then(() => {
			return new Promise((resolve, reject) => {
				exec(
					`unzip -o ${zipFilePath} -d ${outputDir}`,
					(error, stdout, stderr) => {
						if (error) {
							console.error(`Extraction error: ${error.message}`);
							return reject(
								new Error(
									"Failed to extract .tex file from zip"
								)
							);
						}
						if (stderr) {
							console.error(`Extraction stderr: ${stderr}`);
							return reject(
								new Error("Extraction completed with warnings")
							);
						}
						resolve();
					}
				);
			});
		})
		.then(() => {
			const texFilesPath = path.join(outputDir, `${zipFileName}`);

			fs.readdirSync(texFilesPath).forEach((element) => {
				console.log(element);
			});

			const texFile = fs
				.readdirSync(texFilesPath)
				.filter((file) => file.endsWith(".tex"));

			console.log(`Found .tex files: ${texFile}`);

			if (!texFile) {
				return Promise.reject(
					new Error("No .tex file found in the zip")
				);
			}

			return new Promise((resolve, reject) => {
				console.log(`pdflatex ${path.join(texFilesPath, texFile[0])}`);
				exec(
					`pdflatex -output-directory ${texFilesPath} ${path.join(
						texFilesPath,
						texFile[0]
					)}`,
					(error, stdout, stderr) => {
						if (error) {
							console.error(`pdflatex error: ${error.message}`);
							return reject(
								new Error("Failed to convert .tex to PDF")
							);
						}
						if (stderr) {
							console.error(`pdflatex stderr: ${stderr}`);
							// Not rejecting here because pdflatex may output warnings to stderr
						}
						console.log(`pdflatex stdout: ${stdout}`);
						resolve();
					}
				);
			});
		})
		.then(() => {
			const texFilesPath = path.join(outputDir, `${zipFileName}`);

			fs.readdirSync(texFilesPath).forEach((element) => {
				console.log(element);
			});

			const texFile = fs
				.readdirSync(texFilesPath)
				.filter((file) => file.endsWith(".pdf"));

			return new Promise((resolve, reject) => {
				exec(
					`cp ${path.join(
						texFilesPath,
						texFile[0]
					)} /usr/src/app/uploads/`,
					(error, stdout, stderr) => {
						if (error) {
							console.error(`cp error: ${error.message}`);
							return reject(new Error("Failed to copy PDF file"));
						}
						if (stderr) {
							console.error(`cp stderr: ${stderr}`);
							// Not rejecting here because cp may output warnings to stderr
						}
						console.log(`cp stdout: ${stdout}`);
						resolve();
					}
				);
			});
		});
};

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
