import http2 from "http2";
import zlib from "zlib";

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

export class TinyTechServer {
  private _server: http2.Http2Server;
  private _middlewares: ITinyTechMiddleWare[];
  private _procedures: Map<string, ITinyTechProcedure>;
  private _graceful: (()=>void) | undefined;
  constructor(protected _config: http2.ServerOptions = {}) { 
    this._server = http2.createServer(_config, this.onRequest.bind(this));
    this._middlewares = [];
    this._procedures = new Map<string, ITinyTechProcedure>();
    this._graceful = undefined;
    process.on("exit", this.onExitHandler.bind(this));
    process.on("SIGINT", this.onExitHandler.bind(this));
    process.on("SIGUSR1", this.onExitHandler.bind(this));
    process.on("SIGUSR2", this.onExitHandler.bind(this));
    process.on("uncaughtException", this.onExitHandler.bind(this));
  }
  
  private onExitHandler() {
    if (this._graceful) this._graceful();
    if (this._server.listening) {
      console.log("CLOSING SERVER");
      this._server.close();
    }
  }

  private onRequest(req: http2.Http2ServerRequest, _res: http2.Http2ServerResponse) {
    const headers: ITinyTechHeader = {
      method: req.headers[":method"],
      path: req.headers[":path"] ? req.headers[":path"] : "/",
      "content-type": req.headers["content-type"],
      date: req.headers.date,
      authorization: req.headers.authorization,
      "content-length": req.headers["content-length"],
      referer: req.headers["referer"],
      "content-encoding": req.headers["content-encoding"],
      "accept": req.headers["accept"]
    }
    const reqCtx: ITinyTechRequest = {
      headers,
      body: "",
      stream: req.stream
    }
    const ctx: ITinyTechContext = {
      request: reqCtx,
      response: {
        body: "",
        headers: {
          path: "/",
          status: 200,
          "content-type": "plain/text"
        }
      }
    }
    req.on("data", async (chunk)=>{
      if (ctx.request) {
        ctx.request.body += chunk.toString("utf8");
      }
    })
    req.on("end", async () => {
      if (this._procedures.has(ctx.request.headers.path)) {
        for (let i = this._middlewares.length - 1, j = 0; i >= 0; --i, ++j) {
          this._middlewares[j](ctx);
        }
        const proc: ITinyTechProcedure  | undefined = this._procedures.get(ctx.request.headers.path);
        if (proc) await proc(ctx);
      } else {
        ctx.response.body = "Procedure not found!";
      }
      req.setEncoding("utf8");
      req.stream.respond({
        ":method": ctx.response.headers.method,
        date: ctx.response.headers.date,
        authorization: ctx.response.headers.authorization,
        "content-length": ctx.response.headers["content-length"],
        referer: ctx.response.headers.referer,
        "content-encoding": ctx.response.headers["content-encoding"],
        "accept": ctx.response.headers["accept"]
      });
      if (ctx.request.headers["accept"] === "gzip") {
        req.stream.end(await compress(ctx.response.body));
      } else {
        req.stream.end(Buffer.alloc(ctx.response.body.length, ctx.response.body));
      }
    });
  }

  public attachProcedure(name:string, proc: ITinyTechProcedure): void {
    this._procedures.set(['/', name].join(''), proc);
  }

  public use(cb: ITinyTechMiddleWare) {
    this._middlewares.push(cb);
  }

  public unuse(toBeRemoved: ITinyTechMiddleWare) {
    this._middlewares = this.removeFromList(this._middlewares, toBeRemoved);
  } 

  private removeFromList(ori: ITinyTechMiddleWare[], toBeRemoved: ITinyTechMiddleWare): ITinyTechMiddleWare[] {
    const newList: ITinyTechMiddleWare[] = [];
    for (let i = ori.length - 1; i >= 0; --i) {
      if (ori[i] !== toBeRemoved) newList.push(ori[i]);
    }
    return newList;
  }

  public listen(port: number = 8400): void {
    this._server.listen(port);
  }

  public close(runExitHandler: boolean = false): void {
    this._server.close();
    if (runExitHandler) this.onExitHandler();
  }

  public graceful(cb: (()=>void) | undefined): void {
    this._graceful = cb;
  }
}

export class TinyTechClient {
  private _client: http2.ClientHttp2Session;
  private _serviceInfo: ITinyTechServiceInfo = {name: "", endpoint: "", version: "", procs: [], port: ""};
  constructor(readonly jsonInterface: string | ITinyTechServiceInfo) {
    switch(typeof jsonInterface) {
      case "string":
        this._serviceInfo = require(jsonInterface);
        break;
      case "object":
        const {name, endpoint, version, procs, port} = jsonInterface;
        this._serviceInfo.endpoint = endpoint;
        this._serviceInfo.name = name;
        this._serviceInfo.version = version;
        this._serviceInfo.procs = procs;
        this._serviceInfo.port = port.toString();
        break;
      default:
        throw new Error("Invalid Interface!");
    }
    if (this._serviceInfo.endpoint.charAt(0) === '{' && this._serviceInfo.endpoint.charAt(this._serviceInfo.endpoint.length - 1) === '}') {
      const envEndpoint = process.env[this._serviceInfo.endpoint.substr(1, this._serviceInfo.endpoint.length - 2)];
      this._serviceInfo.endpoint = envEndpoint ? envEndpoint : "http://127.0.0.1:8080";
    }
    if (this._serviceInfo.name.charAt(0) === '{' && this._serviceInfo.name.charAt(this._serviceInfo.name.length - 1) === '}') {
      const envName = process.env[this._serviceInfo.name.substr(1, this._serviceInfo.name.length - 2)];
      this._serviceInfo.name = envName ? envName : "Unknown";
    }
    if (this._serviceInfo.version.charAt(0) === '{' && this._serviceInfo.version.charAt(this._serviceInfo.version.length - 1) === '}') {
      const envVersion = process.env[this._serviceInfo.version.substr(1, this._serviceInfo.version.length - 2)];
      this._serviceInfo.version = envVersion ? envVersion : "Unknown";
    }
    if (this._serviceInfo.port.charAt(0) === '{' && this._serviceInfo.port.charAt(this._serviceInfo.port.length - 1) === '}') {
      const envPort = process.env[this._serviceInfo.port.substr(1, this._serviceInfo.port.length - 2)];
      this._serviceInfo.version = envPort ? envPort : "Unknown";
    }
    this._client = http2.connect([this._serviceInfo.endpoint, this._serviceInfo.port].join(':'));
    this._client = this._client.on("error", () => {
      this._client.close();
    });
    this._client = this._client.on("close", () => {
      this._client.close();
      this._client.destroy();
    });
  }
  public on(event: string, cb: (...args: any[]) => void) {
    this._client.on(event, cb);
  }
  public isClosed(): boolean {
    return this._client.closed;
  }
  public isDestoryed(): boolean {
    return this._client.destroyed;
  }
  public  getServiceInfo(): ITinyTechServiceInfo {
    return this._serviceInfo;
  }
  public async procedure(name: string, data?: string, headers?: http2.OutgoingHttpHeaders): Promise<ITinyTechContext> {
    return new Promise((resolve, reject) => {
      const ctx: ITinyTechContext = {
        request: {
          headers: {
            "content-type": "plain/text",
            "path": "/"
          },
          body: "",
          stream: undefined
        },
        response: {
          headers: {
            "content-type": "plain/text",
            "path": "/"
          },
          body: ""
        }
      }
      const req = this._client.request(Object.assign({}, {
        ":path": ["/", name].join(""),
        ":method": headers && headers.method ? headers.method : data ? "POST" : "GET"
      }, headers));
      req.on("error", (err)=>reject(err));
      req.on("response", (headers: ITinyTechHeader) => {
        ctx.response.headers = headers;
      });
      req.on("data", (chunk: Buffer) => {
        ctx.response.body += chunk.toString("utf8");
      });
      req.on("end", ()=>{
        resolve(ctx)
      });
      req.setEncoding("utf8");
      if (req.writable && data) {
        req.write(Buffer.alloc(data.length, data));
      }
      req.end();
    });
  }
  public availableProcedures(): readonly string[] {
    return this._serviceInfo.procs.map(v=>v);
  }
  public close() {
    if (!this._client.closed) {
      this._client.close();
      this._client.destroy();
    }
  }
}

export function compress(data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err: Error | null, result: Buffer) => {
      if (err) reject(err);
      resolve(result.toString("base64"));
    })
  });
}

export function decompress(data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const decodedData = Buffer.from(data, "base64");
    zlib.unzip(decodedData, (err: Error | null, data: Buffer) => {
      if (err) reject(err);
      resolve(data.toString("utf8"));
    })
  });
}

export default { 
  TinyTechServer, 
  TinyTechClient
};
