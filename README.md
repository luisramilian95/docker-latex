# Express File Upload App

A simple Express.js application with drag and drop file upload functionality.

## Features

- 🎯 Drag and drop file upload interface
- 📁 Multiple file selection support
- 📊 File size validation (10MB limit)
- 📋 View uploaded files list
- 🗑️ Delete uploaded files
- 📱 Responsive design
- ⚡ Real-time upload progress
- 🔔 Success/error notifications

## Installation

1. Build Image
```bash
docker build -t app_latex .
```

2. Start the development server:
```bash
ocker run  -p3000:3000 --name=ubuntu_latex app_latex
```

1. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload Files**: 
   - Drag and drop files onto the upload zone
   - Or click the upload zone to browse and select files
   - Click "Upload Files" to upload selected files

2. **View Files**: 
   - Uploaded files are displayed in the "Uploaded Files" section
   - Click "View" to open a file in a new tab
   - Click "Refresh List" to reload the file list

3. **Delete Files**: 
   - Click "Delete" next to any file to remove it from the server

## File Structure

```
├── server.js          # Express server
├── package.json       # Dependencies and scripts
├── public/            # Static files
│   ├── index.html     # Main HTML page
│   ├── style.css      # Styles
│   └── script.js      # Client-side JavaScript
├── uploads/           # Uploaded files directory (created automatically)
└── README.md          # This file
```

## API Endpoints

- `GET /` - Serve the main HTML page
- `POST /upload` - Upload files
- `GET /files` - Get list of uploaded files
- `DELETE /files/:filename` - Delete a specific file
- `GET /uploads/:filename` - Serve uploaded files

## Configuration

- **File Size Limit**: 10MB (configurable in `server.js`)
- **Upload Directory**: `./uploads` (configurable in `server.js`)
- **Port**: 3000 (configurable via PORT environment variable)

## Technologies Used

- **Backend**: Express.js, Multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **File Upload**: HTML5 File API, FormData, Fetch API

## License

MIT
