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
}
export interface ITinyTechResponse {
    body: string;
    headers: ITinyTechHeader;
}
export interface ITinyTechRequest {
    headers: ITinyTechHeader;
    body: string;
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
    constructor(_config?: http2.ServerOptions);
    private onRequest;
    attachProcedure(name: string, proc: ITinyTechProcedure): void;
    procedure(name: string, ...args: any[]): any;
    use(cb: ITinyTechMiddleWare): void;
    unuse(toBeRemoved: ITinyTechMiddleWare): void;
    private removeFromList;
    listen(port?: number): void;
    close(): void;
}
export declare class TinyTechClient {
    readonly jsonInterface: string | ITinyTechServiceInfo;
    private _client;
    private _serviceInfo;
    constructor(jsonInterface: string | ITinyTechServiceInfo);
    procedure(name: string, data?: string, headers?: http2.OutgoingHttpHeaders): Promise<ITinyTechContext>;
    availableProcedures(): readonly string[];
    close(): void;
}
declare const _default: {
    TinyTechServer: typeof TinyTechServer;
};
export default _default;
//# sourceMappingURL=main.d.ts.map