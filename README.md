# Tab Capture Recorder - React Extension

This Chrome extension allows you to record the current tab's audio and video using Chrome's tabCapture API, built with React, TypeScript, and Vite.

## Features

- Record the current tab's audio and video
- User-friendly interface with React components
- TypeScript for type safety
- Modern build system with Vite

## Development

### Prerequisites

- Node.js and npm
- Chrome browser

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Building the Extension

1. Build the extension:
   ```
   npm run build
   ```
2. The built extension will be in the `dist` directory.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked" and select the `dist` directory

## Usage

1. Click the extension icon to open the popup
2. Click "Start Recording" to begin recording the current tab
3. Click "Stop Recording" to stop the recording and view the recorded video

## License

This project is licensed under the Apache License 2.0 - see the original project for details.
