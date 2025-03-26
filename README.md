# Subway Video Chrome Extension

A Chrome extension that adds a subway video overlay to any video you're watching.

## Project Structure

The extension is organized into modules:

- `src/content.ts`: Main entry point that initializes everything
- `src/types.ts`: Type definitions used throughout the extension
- `src/utils/dom.ts`: DOM utility functions for element creation and manipulation
- `src/handlers/video-overlay.ts`: The main overlay handler for all videos
- `src/handlers/youtube-detector.ts`: YouTube-specific video detection
- `src/chrome.d.ts`: Type definitions for Chrome extension APIs

## Features

- Adds a "Subway Mode" button to all videos (appears on hover)
- Creates a custom overlay with the original video and subway video side by side
- Works with YouTube, JW Player and standard HTML5 videos
- No issues with fullscreen mode since it uses its own overlay container
- Non-intrusive UI that only appears when needed

## How It Works

1. The extension detects videos on the page
2. It adds a hover button to each video
3. When clicked, it creates an overlay with:
   - The original video (75% width)
   - The subway video (25% width)
4. The overlay can be closed with an X button
5. All original video state (position, etc.) is preserved

## Building

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

## Loading in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` directory
4. The extension should now be installed and active

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
