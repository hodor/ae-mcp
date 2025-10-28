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
    }
};

// Execute ExtendScript
function executeScript(id, jsx) {
    log(`Executing script...`);
    
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
                return JSON.stringify({ success: false, error: e.toString(), line: e.line });
            }
        })()
    `;
    
    csInterface.evalScript(wrappedJsx, (result) => {
        // Check for CSInterface error first
        if (result === EvalScript_ErrMessage) {
            log(`Script execution failed at CEP level`, 'error');
            wsClient.send({
                id: id,
                error: "Script execution failed: " + result,
                success: false
            });
            return;
        }
        
        // Result should always be JSON from our wrapper
        try {
            const parsed = JSON.parse(result);
            if (parsed.success) {
                log(`Script completed`, 'success');
                wsClient.send({
                    id: id,
                    result: JSON.stringify(parsed.result),
                    success: true
                });
            } else {
                log(`Script error: ${parsed.error}`, 'error');
                wsClient.send({
                    id: id,
                    error: parsed.error,
                    success: false
                });
            }
        } catch (e) {
            // JSON parsing failed - shouldn't happen with our wrapper unless AE crashed
            log(`Unexpected response: ${result}`, 'error');
            wsClient.send({
                id: id,
                error: `Unexpected response from After Effects: ${result}`,
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

// Logging
function log(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
    
    logDiv.insertBefore(entry, logDiv.firstChild);
    
    // Keep last 100 entries
    while (logDiv.children.length > 100) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

log('AEMCP panel loaded');