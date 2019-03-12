import {IContainer, IInstanceWrapper} from 'addict-ioc';
import * as http from 'http';

import {IHttpSocketAdapter} from '@essential-projects/http_socket_adapter_contracts';
import {IIdentity, IIdentityService} from '@essential-projects/iam_contracts';
import {IEndpointSocketScope, ISocketClient, OnConnectCallback} from '@essential-projects/websocket_contracts';

import * as socketIo from 'socket.io';
import {SocketIoSocketClient} from './socket_client';
import {SocketIoNamespace} from './socketio_namespace';

export class SocketioHttpSocketAdapter implements IHttpSocketAdapter, IEndpointSocketScope {

  private _container: IContainer<IInstanceWrapper<any>> = undefined;
  private _identityService: IIdentityService;
  private _httpServer: http.Server = undefined;
  private _socketServer: SocketIO.Server = undefined;
  private _defaultNamespace: IEndpointSocketScope = undefined;

  public config: any = undefined;

  constructor(container: IContainer<IInstanceWrapper<any>>, identityService: IIdentityService) {
    this._container = container;
    this._identityService = identityService;
  }

  public get container(): IContainer<IInstanceWrapper<any>> {
    return this._container;
  }

  public get httpServer(): http.Server {
    return this._httpServer;
  }

  public get socketServer(): SocketIO.Server {
    return this._socketServer;
  }

  public get defaultNamespace(): IEndpointSocketScope {
    return this._defaultNamespace;
  }

  public get identityService(): IIdentityService {
    return this._identityService;
  }

  public async initializeAdapter(httpServer: http.Server): Promise<void> {

    this._httpServer = httpServer;

    const socketIoHeaders: any = {
      'Access-Control-Allow-Headers': this.config.cors.options.allowedHeaders
        ? this.config.cors.options.allowedHeaders.join(',')
        : 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': this.config.cors.options.origin || '*',
      'Access-Control-Allow-Credentials': this.config.cors.options.credentials || true,
    };

    // TODO: The socket.io typings are currently very much outdated and do not contain the "handlePreflightRequest" option.
    // It is still functional, though.
    this._socketServer = socketIo(this.httpServer as any, <any> {
      handlePreflightRequest: (req: any, res: any): void => {
        // tslint:disable-next-line:no-magic-numbers
        res.writeHead(200, socketIoHeaders);
        res.end();
      },
    });

    const defaultNamespaceIdentifier: string = '/';
    const defaultSocketIoNamespace: SocketIO.Namespace = this._socketServer.of(defaultNamespaceIdentifier);
    this._defaultNamespace = new SocketIoNamespace(defaultNamespaceIdentifier, defaultSocketIoNamespace);
  }

  public async dispose(): Promise<void> {
    this._closeSockets();
    await this._closeSocketServer();
  }

  public getNamespace(namespaceIdentifier: string): IEndpointSocketScope {
    const namespace: SocketIO.Namespace = this.socketServer.of(namespaceIdentifier);

    return new SocketIoNamespace(namespaceIdentifier, namespace);
  }

  private _closeSockets(): void {
    const connectedSockets: Array<socketIo.Socket> = Object.values(this.socketServer.of('/').connected);
    for (const socket of connectedSockets) {
      socket.disconnect(true);
    }
  }

  private async _closeSocketServer(): Promise<void> {
    return new Promise((resolve: Function, reject: Function): void => {
      this.socketServer.close(() => {
        resolve();
      });
    });
  }

  public onConnect(callback: OnConnectCallback): void {

    this._socketServer.on('connect', async(socket: SocketIO.Socket) => {

      const bearerToken: string = socket.handshake.headers['authorization'];
      const jwtToken: string = bearerToken.substr('Bearer '.length);

      const identity: IIdentity = await this._identityService.getIdentity(jwtToken);

      socket.client['identity'] = identity;

      this.defaultNamespace.onConnect(callback);

      const socketClient: ISocketClient = new SocketIoSocketClient(socket);
      callback(socketClient, identity);
    });
  }

  public emit<TMessage>(eventType: string, message: TMessage): void {
    this.defaultNamespace.emit(eventType, message);
  }
}
