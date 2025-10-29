const csInterface = new CSInterface();
const wsClient = new WebSocketClient('ws://localhost:3000');

// Connection status
wsClient.onConnectionChange = (connected) => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        log('Connected to MCP server', 'success');
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        log('Disconnected from MCP server', 'error');
    }
};

// Handle actions from MCP server
wsClient.onAction = (message) => {
    log(`Received action: ${message.action} (ID: ${message.id || 'none'})`, 'info');
    log(`Message data: ${JSON.stringify(message)}`, 'debug');
    
    switch (message.action) {
        case 'eval':
            executeScript(message.id, message.jsx);
            break;
        case 'renderCustomPanel':
            renderCustomPanel(message.html, message.css, message.js);
            break;
        case 'closePanel':
            closeCustomPanel();
            break;
        default:
            log(`Unknown action: ${message.action}`, 'warning');
    }
};

// Execute ExtendScript
function executeScript(id, jsx) {
    log(`Executing script (ID: ${id})...`);
    log(`Script content: ${jsx}`, 'debug');
    
    // Always wrap the script to return JSON for consistent handling
    const wrappedJsx = `
        (function() {
            try {
                app.beginUndoGroup("MCP Server Action");
                var result = (function() {
                    ${jsx}
                })();
                app.endUndoGroup();
                return JSON.stringify({ success: true, result: result });
            } catch (e) {
                app.endUndoGroup();
                var errorDetails = {
                    message: e.toString(),
                    line: e.line,
                    fileName: e.fileName,
                    stack: e.stack
                };
                return JSON.stringify({ success: false, error: e.toString(), details: errorDetails });
            }
        })()
    `;
    
    csInterface.evalScript(wrappedJsx, (result) => {
        log(`Raw result from AE: "${result}"`, 'debug');
        
        // Check for CSInterface error first
        if (result === EvalScript_ErrMessage) {
            log(`Script execution failed at CEP level: ${EvalScript_ErrMessage}`, 'error');
            wsClient.send({
                id: id,
                error: "Script execution failed at CEP level",
                success: false
            });
            return;
        }
        
        // Handle empty result
        if (!result || result === '') {
            log(`Script returned empty result (this may be normal for void functions)`, 'warning');
            wsClient.send({
                id: id,
                result: JSON.stringify(undefined),
                success: true
            });
            return;
        }
        
        // Result should always be JSON from our wrapper
        try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
                log(`Script completed successfully`, 'success');
                log(`Result value: ${JSON.stringify(parsed.result)}`, 'debug');
                wsClient.send({
                    id: id,
                    result: JSON.stringify(parsed.result),
                    success: true
                });
            } else {
                log(`Script error: ${parsed.error}`, 'error');
                if (parsed.details) {
                    log(`Error details: ${JSON.stringify(parsed.details)}`, 'error');
                }
                wsClient.send({
                    id: id,
                    error: parsed.error,
                    success: false
                });
            }
        } catch (e) {
            // JSON parsing failed - log everything for debugging
            log(`JSON parsing failed: ${e.message}`, 'error');
            log(`Full response (${result.length} chars): "${result}"`, 'error');
            wsClient.send({
                id: id,
                error: `JSON parsing failed: ${e.message}`,
                success: false
            });
        }
    });
}

// Dynamic panel rendering
function renderCustomPanel(html, css, js) {
    const container = document.getElementById('dynamicPanel');
    
    // Clear existing
    container.innerHTML = '';
    
    // Add CSS
    if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // Add HTML
    container.innerHTML = html;
    
    // Add JS with helper
    if (js) {
        const script = document.createElement('script');
        script.textContent = `
            ${js}
            
            // Helper to call After Effects
            window.callAE = function(jsx, callback) {
                csInterface.evalScript(jsx, callback || function(result) {
                    console.log('AE Result:', result);
                });
            };
        `;
        document.body.appendChild(script);
    }
    
    log('Custom panel rendered', 'success');
}

function closeCustomPanel() {
    document.getElementById('dynamicPanel').innerHTML = '';
    log('Custom panel closed');
}

// Store original console methods FIRST before any logging
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

// Logging
function log(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    // Escape HTML to show raw content
    const escapedMessage = String(message)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span><span class="message">${escapedMessage}</span>`;
    
    logDiv.insertBefore(entry, logDiv.firstChild);
    
    // Keep last 200 entries for debugging
    while (logDiv.children.length > 200) {
        logDiv.removeChild(logDiv.lastChild);
    }
    
    // Use ORIGINAL console to avoid recursion
    originalConsole.log(`[${type.toUpperCase()}] ${message}`);
}

// Capture all console output
console.log = function(...args) {
    log('Console: ' + args.join(' '), 'debug');
    originalConsole.log.apply(console, args);
};

console.error = function(...args) {
    log('Console Error: ' + args.join(' '), 'error');
    originalConsole.error.apply(console, args);
};

console.warn = function(...args) {
    log('Console Warn: ' + args.join(' '), 'warning');
    originalConsole.warn.apply(console, args);
};

// Capture uncaught errors
window.addEventListener('error', (event) => {
    log(`Uncaught error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
    log(`Error stack: ${event.error?.stack || 'No stack trace'}`, 'error');
});

log('AEMCP panel loaded', 'success');
log(`CSInterface version: ${csInterface.getSystemPath('extension')}`, 'debug');
log(`Host environment: ${JSON.stringify(csInterface.getHostEnvironment())}`, 'debug');

// Clear log button
document.getElementById('clearLog').addEventListener('click', () => {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML = '';
    log('Log cleared', 'info');
});

// Export log button
document.getElementById('exportLog').addEventListener('click', () => {
    const logDiv = document.getElementById('log');
    const logs = [];
    
    // Get all log entries
    for (let i = logDiv.children.length - 1; i >= 0; i--) {
        const entry = logDiv.children[i];
        const timestamp = entry.querySelector('.timestamp')?.textContent || '';
        const message = entry.querySelector('.message')?.textContent || entry.textContent;
        logs.push(`${timestamp} ${message}`);
    }
    
    // Create export content
    const exportContent = logs.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aemcp-log-${timestamp}.txt`;
    
    // Write to file using ExtendScript
    const jsx = `
        (function() {
            try {
                var file = new File("~/Desktop/" + ${JSON.stringify(filename)});
                file.open("w");
                file.write(${JSON.stringify(exportContent)});
                file.close();
                return "Log exported to Desktop: " + file.fsName;
            } catch(e) {
                return "Export failed: " + e.toString();
            }
        })()
    `;
    
    csInterface.evalScript(jsx, (result) => {
        log(result, result.includes('failed') ? 'error' : 'success');
    });
});