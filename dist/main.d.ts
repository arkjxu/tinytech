/// <reference types="node" />
import http2 from "http2";
export interface ITinyTechServiceInfo {
    name: string;
    endpoint: string;
    version: string;
    port: string;
    procs: string[];
}
export interface ITinyTechContext {
    request: ITinyTechRequest;
    response: ITinyTechResponse;
}
export interface ITinyTechHeader {
    method?: string | undefined;
    status?: number | undefined;
    "content-type": string | undefined;
    path: string;
    authorization?: string | undefined;
    "access-control-allow-credentials"?: boolean;
    "content-encoding"?: string | undefined;
    "content-length"?: string | undefined;
    date?: string | undefined;
    "referer"?: string | undefined;
    "accept"?: string | undefined;
}
export interface ITinyTechResponse {
    body: any;
    headers: ITinyTechHeader;
}
export interface ITinyTechRequest {
    headers: ITinyTechHeader;
    body: any;
    stream: http2.Http2Stream | undefined;
}
export interface ITinyTechMiddleWare {
    (context: ITinyTechContext): void;
}
export interface ITinyTechProcedure {
    (...args: any[]): any;
}
export declare class TinyTechServer {
    protected _config: http2.ServerOptions;
    private _server;
    private _middlewares;
    private _procedures;
    private _graceful;
    constructor(_config?: http2.ServerOptions);
    private onExitHandler;
    private onRequest;
    attachProcedure(name: string, proc: ITinyTechProcedure): void;
    use(cb: ITinyTechMiddleWare): void;
    unuse(toBeRemoved: ITinyTechMiddleWare): void;
    private removeFromList;
    listen(port?: number): void;
    close(runExitHandler?: boolean): void;
    graceful(cb: (() => void) | undefined): void;
}
export declare class TinyTechClient {
    readonly jsonInterface: string | ITinyTechServiceInfo;
    private _client;
    private _serviceInfo;
    constructor(jsonInterface: string | ITinyTechServiceInfo);
    getServiceInfo(): ITinyTechServiceInfo;
    procedure(name: string, data?: string, headers?: http2.OutgoingHttpHeaders): Promise<ITinyTechContext>;
    availableProcedures(): readonly string[];
    close(): void;
}
export declare function compress(data: string): Promise<string>;
export declare function decompress(data: string): Promise<string>;
declare const _default: {
    TinyTechServer: typeof TinyTechServer;
    TinyTechClient: typeof TinyTechClient;
};
export default _default;
//# sourceMappingURL=main.d.ts.map