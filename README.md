# Chrome Extension with React and Vite

This is a Chrome extension boilerplate built with React and Vite, providing a modern development experience for building Chrome extensions.

## Features

- Built with React and TypeScript
- Uses Vite for fast development and building
- Chrome Extension Manifest V3 compatible
- Background script and popup UI examples
- Chrome storage API usage example
- Content script that adds subway video to fullscreen videos

## Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Building the Extension

Build the extension with:

```bash
npm run build:extension
```

This will:

1. Compile TypeScript files
2. Build the React app with Vite
3. Copy the manifest.json file to the dist folder

The extension will be built in the `dist` directory.

## Loading the Extension in Chrome

1. Build the extension as described above
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `dist` directory
5. The extension should now be loaded and visible in your Chrome toolbar

## Using the Subway Video Feature

This extension adds subway videos to fullscreen video players across the web:

1. Replace the placeholder `public/subway.mp4` file with your actual subway video
2. When any video on the web goes fullscreen, the extension will automatically add your subway video to the right side
3. Works with YouTube and most other video players

The extension handles different types of fullscreen modes:

- Standard fullscreen videos
- YouTube videos
- Videos in iframes (when possible due to same-origin policy)
- JW Player videos

## Customization

- Modify `src/App.tsx` to change the popup UI
- Update `src/background.ts` to add background functionality
- Edit `src/content.ts` to change the subway video behavior
- Edit `public/manifest.json` to change extension metadata and permissions

## License

MIT
