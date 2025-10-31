# AEMCP - After Effects MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0.0-green.svg)](https://github.com/modelcontextprotocol/specification)
[![After Effects](https://img.shields.io/badge/After_Effects-2020+-green.svg)](https://www.adobe.com/products/aftereffects.html)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Control Adobe After Effects through AI assistants via Model Context Protocol (MCP).

## Overview

AEMCP enables AI assistants like Claude to control After Effects by providing a bridge between MCP and Adobe's CEP (Common Extensibility Platform). This allows AI to create compositions, automate tasks, build custom tools, and debug complex projects - all through natural conversation.

## Architecture

```
AI Assistant (Claude) → MCP Server (Node.js) → WebSocket → CEP Panel (in AE) → ExtendScript
```

## Features

### Core Tools Available to AI

- **run_script** - Execute any ExtendScript code in After Effects
- **create_scriptui_tool** - Create floating ScriptUI tool windows with full UI controls
- **append_html_to_panel** - Add HTML/CSS/JS content to the AEMCP panel
- **clear_panel_html** - Clear the HTML content from the panel

### What AI Can Do

Through these tools, AI assistants can:
- Create and modify compositions, layers, and effects
- Build custom automation tools with UI
- Debug complex expressions and time remapping
- Analyze project structure and properties
- Generate batch processing scripts
- Create reusable tool panels
- Automate repetitive tasks

## Installation

### Prerequisites
- After Effects 2020 or later
- Node.js 14+ installed
- Administrator privileges (for Windows)

### ⚠️ IMPORTANT: Before Installing
1. **Close your AI client** (Claude Desktop, etc.) completely
2. **Close After Effects** if it's running
3. Ensure you have Administrator privileges

### Windows Quick Install

1. Right-click `Install-Windows.bat`
2. Select "Run as administrator"
3. Follow the prompts

The installer will:
- Build the MCP server
- Install the CEP extension
- Enable debug mode for After Effects
- Show you the configuration path

### Manual Installation

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Build and Install
```bash
npm run build
npm run install-extension
```

This installs the extension to:
- **Windows:** `C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\CEP\extensions\aemcp`
- **Mac:** `/Applications/Adobe After Effects 2024/CEP/extensions/aemcp`

#### 3. Enable CEP Debugging (First time only)

**Windows:**
Double-click `Enable-Debug.bat`

**Mac:**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

#### 4. Configure Your AI Client

##### For Claude Desktop:
Add to your config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "after-effects": {
      "command": "node",
      "args": ["/path/to/ae-mcp/server/build/index.js"]
    }
  }
}
```

Replace the path with your actual installation path.

##### For Other MCP Clients:
Configure your client to run:
```bash
node /path/to/aemcp/server/build/index.js
```

### 5. Start Using

1. Open After Effects
2. Go to `Window > Extensions > AEMCP`
3. Panel should show "Connected" status
4. Start chatting with your AI assistant!

## Usage Examples

### Basic Script Execution
Ask your AI: "Create a new 1920x1080 composition called 'Main' that's 10 seconds long"

The AI will use:
```javascript
run_script({
  jsx: "app.project.items.addComp('Main', 1920, 1080, 1, 10, 30)"
})
```

### Creating Custom Tools
Ask your AI: "Create a tool that batch renames selected layers"

The AI will create a ScriptUI window with:
- Input fields for naming patterns
- Buttons for processing
- Progress feedback
- Error handling

### Debugging Complex Projects
Ask your AI: "Help me debug why my time-remapped layer shows black at 76 seconds"

The AI can:
- Analyze layer properties
- Check time remapping values
- Inspect expressions
- Test different solutions
- Provide step-by-step fixes

## Development

### Project Structure
```
ae-mcp/
├── server/           # MCP server (Node.js/TypeScript)
│   ├── src/         # Source files
│   └── build/       # Compiled JavaScript
├── extension/       # CEP panel
│   └── client/      # Panel UI (HTML/JS/CSS)
├── commands/        # (Future) Modular command structure
└── tasks.md        # Development roadmap
```

### Build Commands

```bash
# Build MCP server
npm run build

# Watch mode for development
npm run dev

# Install extension to After Effects
npm run install-extension
```

### Debug CEP Panel
Open Chrome and navigate to `http://localhost:8092`

## Troubleshooting

### Panel doesn't show in After Effects
- Ensure `.debug` file exists in the extension folder
- Check that PlayerDebugMode is enabled
- Restart After Effects

### "CEP panel not connected" error
- Open the AEMCP panel (Window > Extensions > AEMCP)
- Check that panel shows "Connected" status
- Check Activity Log for errors

### Scripts not executing
- Check the Activity Log in the AEMCP panel
- Open Chrome DevTools at `http://localhost:8092`
- Verify WebSocket connection on port 3000

### ExtendScript Limitations
- No native JSON support (use string building)
- Use explicit `return` statements for values
- Wrap code in try-catch for error handling

## Roadmap

See [tasks.md](tasks.md) for detailed development plans:

- **Priority 0**: CEP Panel UI overhaul with tabs
- **Priority 1**: Visual feedback system (render_frame, preview_layer)
- **Priority 2**: Tool persistence and editing
- **Priority 3**: Error context and recovery
- **Priority 4**: Templates and presets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with After Effects
5. Submit a pull request

## Security Notes

- ExtendScript execution is wrapped in undo groups
- All scripts run with error handling
- Panel requires local WebSocket connection
- No external network access

## License

MIT

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check the [tasks.md](tasks.md) file for known TODOs
- Review [design-v2.md](design-v2.md) for architecture details
