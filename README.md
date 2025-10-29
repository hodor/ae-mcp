# AEMCP - After Effects MCP Server

Control Adobe After Effects through Claude via Model Context Protocol (MCP).

## Architecture
MCP Client → MCP Server (Node.js) → WebSocket → CEP Panel (in AE) → ExtendScript

## Installation

### Windows Quick Install

1. Right-click `Install-Windows.bat` 
2. Select "Run as administrator"
3. Follow the prompts

That's it! The installer will handle everything automatically.

### Manual Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Install CEP Extension
```bash
npm run install-extension
```

This copies the extension to:
- **Windows:** `%APPDATA%\Adobe\CEP\extensions\aemcp`
- **Mac:** `~/Library/Application Support/Adobe/CEP/extensions/aemcp`

### 3. Enable CEP Debugging (First time only)

**Windows:**
Double-click `Enable-Debug.bat` (or this is done automatically by the installer)

To disable debug mode later, double-click `Disable-Debug.bat`

**Mac:**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

### 4. Configure MCP Client

#### For Claude Desktop:
Add to your Claude Desktop config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "after-effects": {
      "command": "node",
      "args": ["/path/to/aemcp/server/build/index.js"]
    }
  }
}
```

#### For Other MCP Clients:
Configure your MCP client to run:
```bash
node /path/to/aemcp/server/build/index.js
```

### 5. Start After Effects

1. Open After Effects
2. Go to `Window > Extensions > AEMCP`
3. The panel should show "Connected" status

### 6. Start Using

Start chatting with your MCP client! The MCP server will communicate with After Effects through the WebSocket connection.

## Available Tools

### 1. run_script
Execute any ExtendScript code in After Effects.

**Example:**
```javascript
// Create a composition
run_script({
  jsx: "app.project.items.addComp('Main', 1920, 1080, 1, 10, 30)"
})
```

### 2. undo
Undo one or more actions.

**Example:**
```javascript
undo({ steps: 2 })
```

### 3. redo
Redo one or more actions.

### 4. copy_selection
Copy selected layer properties to clipboard as JSON.

### 5. paste_to_layer
Apply clipboard data to selected layer.

### 6. create_panel
Create a custom UI panel dynamically.

**Example:**
```javascript
create_panel({
  html: '<button onclick="callAE(\'alert(1)\')">Test</button>',
  css: 'button { padding: 10px; }',
  js: 'console.log("Panel loaded");'
})
```

### 7. close_panel
Close the custom UI panel.

## Development

### Build Server
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

### Debug CEP Panel
Open Chrome and navigate to `http://localhost:8092`

## Troubleshooting

### Panel doesn't show in After Effects
- Ensure `.debug` file exists in the extension folder
- Check that PlayerDebugMode is enabled
- Restart After Effects

### "CEP panel not connected" error
- Open the AEMCP panel in After Effects (Window > Extensions > AEMCP)
- Check that the panel shows "Connected" status

### Scripts not executing
- Check the Activity Log in the AEMCP panel for errors
- Open Chrome DevTools at `http://localhost:8092` for detailed logs

## License

MIT