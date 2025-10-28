import { WebSocket, WebSocketServer } from 'ws';

export interface PendingCommand {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class AEWebSocketServer {
  private wss: WebSocketServer;
  private cepClient: WebSocket | null = null;
  private pendingCommands = new Map<string, PendingCommand>();
  private commandTimeout = 30000; // 30 seconds

  constructor(port: number = 3000) {
    this.wss = new WebSocketServer({ port });
    
    this.wss.on('connection', (ws) => {
      console.log('CEP panel connected');
      this.cepClient = ws;

      ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      ws.on('close', () => {
        console.log('CEP panel disconnected');
        this.cepClient = null;
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log(`WebSocket server listening on port ${port}`);
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      if (message.id && this.pendingCommands.has(message.id)) {
        const pending = this.pendingCommands.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingCommands.delete(message.id);
        
        if (message.success) {
          pending.resolve(message.result);
        } else {
          pending.reject(new Error(message.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  async sendCommand(action: string, data: any = {}): Promise<any> {
    if (!this.cepClient || this.cepClient.readyState !== WebSocket.OPEN) {
      throw new Error('CEP panel not connected');
    }

    const id = this.generateId();
    const message = { id, action, ...data };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error('Command timeout'));
      }, this.commandTimeout);

      this.pendingCommands.set(id, { resolve, reject, timeout });
      
      this.cepClient!.send(JSON.stringify(message));
    });
  }

  isConnected(): boolean {
    return this.cepClient !== null && this.cepClient.readyState === WebSocket.OPEN;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}