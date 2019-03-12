import {IIdentity} from '@essential-projects/iam_contracts';
import {ISocketClient, MessageCallback, OnConnectCallback} from '@essential-projects/websocket_contracts';
import {Logger} from 'loggerhythm';

const logger: Logger = Logger.createLogger('http:socket.io_client');

export class SocketIoSocketClient implements ISocketClient {

  private _socket: SocketIO.Socket = undefined;
  private _onDisconnectCallback: Function = undefined;

  constructor(socket: SocketIO.Socket) {
    this._socket = socket;

    this._initializeHandlers();
  }

  public get socket(): SocketIO.Socket {
    return this._socket;
  }

  public dispose(): void {
    this._onDisconnectCallback = undefined;
  }

  private _initializeHandlers(): void {

    this.socket.on('disconnect', async(reason: any) => {
      this._onDisconnectCallback();
      logger.info(`Client with socket id "${this.socket.id} disconnected."`);
    });
  }

  public onConnect(callback: OnConnectCallback): void {
    this.socket.on('connect', async(socket: SocketIO.Socket) => {
      const socketClient: ISocketClient = new SocketIoSocketClient(socket);
      const identity: IIdentity = socket.client['identity'];
      callback(socketClient, identity);
    });
  }

  public onDisconnect(callback: Function): void {
    if (this._onDisconnectCallback !== undefined) {
      throw new Error('onDisconnect callback has already been set.');
    }
    this._onDisconnectCallback = callback;
  }

  public emit<TMessage>(eventType: string, message: TMessage): void {
    this.socket.emit(eventType, message);
  }

  public off<TMessage>(eventType: string, callback: MessageCallback<TMessage>): void {
    this.socket.on(eventType, callback);
  }

  public on<TMessage>(eventType: string, callback: MessageCallback<TMessage>): void {
    this.socket.off(eventType, callback);
  }

  public once<TMessage>(eventType: string, callback: MessageCallback<TMessage>): void {
    this.socket.once(eventType, callback);
  }
}
