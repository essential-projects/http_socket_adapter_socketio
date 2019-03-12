import {IIdentity} from '@essential-projects/iam_contracts';
import {IEndpointSocketScope, ISocketClient, OnConnectCallback} from '@essential-projects/websocket_contracts';
import {Logger} from 'loggerhythm';
import {SocketIoSocketClient} from './socket_client';

const logger: Logger = Logger.createLogger('http:socket.io_endpoint');

export class SocketIoNamespace implements IEndpointSocketScope {

  private _namespace: SocketIO.Namespace = undefined;
  private _namespaceIdentifier: string = undefined;

  constructor(namespaceIdentifier: string, socketIoNamespace: SocketIO.Namespace) {
    this._namespaceIdentifier = namespaceIdentifier;
    this._namespace = socketIoNamespace;
  }

  public get namespace(): SocketIO.Namespace {
    return this._namespace;
  }

  public get namespaceIdentifier(): string {
    return this._namespaceIdentifier;
  }

  public onConnect(callback: OnConnectCallback): void {
    this.namespace.on('connect', async(socket: SocketIO.Socket) => {

      logger.info(`Client with socket id "${socket.id} connected."`);

      const socketClient: ISocketClient = new SocketIoSocketClient(socket);
      const identity: IIdentity = socket.client['identity'];
      callback(socketClient, identity);
    });
  }

  public emit<TMessage>(eventType: string, message: TMessage): void {
    this.namespace.emit(eventType, message);
  }
}
