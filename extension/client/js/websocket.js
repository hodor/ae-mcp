class WebSocketClient {
    constructor(url = 'ws://localhost:3000') {
        this.url = url;
        this.ws = null;
        this.reconnectInterval = 2000;
        this.messageHandlers = new Map();
        this.connect();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('Connected to MCP server');
                this.onConnectionChange(true);
            };

            this.ws.onclose = () => {
                console.log('Disconnected from MCP server');
                this.onConnectionChange(false);
                setTimeout(() => this.connect(), this.reconnectInterval);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        } catch (error) {
            console.error('Connection error:', error);
            setTimeout(() => this.connect(), this.reconnectInterval);
        }
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received:', message);
            
            if (message.id && this.messageHandlers.has(message.id)) {
                const handler = this.messageHandlers.get(message.id);
                handler(message);
                this.messageHandlers.delete(message.id);
            } else if (message.action) {
                this.onAction(message);
            }
        } catch (error) {
            console.error('Message handling error:', error);
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    sendWithCallback(message, callback) {
        if (!message.id) {
            message.id = this.generateId();
        }
        this.messageHandlers.set(message.id, callback);
        return this.send(message);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    onConnectionChange(connected) {
        // Override in main.js
    }

    onAction(message) {
        // Override in main.js
    }
}