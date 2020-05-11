"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http2_1 = __importDefault(require("http2"));
const zlib_1 = __importDefault(require("zlib"));
class TinyTechServer {
    constructor(_config = {}) {
        this._config = _config;
        this._server = http2_1.default.createServer(_config, this.onRequest.bind(this));
        this._middlewares = [];
        this._procedures = new Map();
        this._graceful = undefined;
        process.on("exit", this.onExitHandler.bind(this));
        process.on("SIGINT", this.onExitHandler.bind(this));
        process.on("SIGUSR1", this.onExitHandler.bind(this));
        process.on("SIGUSR2", this.onExitHandler.bind(this));
        process.on("uncaughtException", this.onExitHandler.bind(this));
    }
    onExitHandler() {
        if (this._graceful)
            this._graceful();
        if (this._server.listening)
            this._server.close();
    }
    onRequest(req, _res) {
        const headers = {
            method: req.headers[":method"],
            path: req.headers[":path"] ? req.headers[":path"] : "/",
            "content-type": req.headers["content-type"],
            date: req.headers.date,
            authorization: req.headers.authorization,
            "content-length": req.headers["content-length"],
            referer: req.headers["referer"],
            "content-encoding": req.headers["content-encoding"],
            "accept": req.headers["accept"]
        };
        const reqCtx = {
            headers,
            body: "",
            stream: req.stream
        };
        const ctx = {
            request: reqCtx,
            response: {
                body: "",
                headers: {
                    path: "/",
                    status: 200,
                    "content-type": "plain/text"
                }
            }
        };
        req.on("data", async (chunk) => {
            if (ctx.request) {
                ctx.request.body += chunk.toString("utf8");
            }
        });
        req.on("end", async () => {
            if (this._procedures.has(ctx.request.headers.path)) {
                for (let i = this._middlewares.length - 1, j = 0; i >= 0; --i, ++j) {
                    this._middlewares[j](ctx);
                }
                const proc = this._procedures.get(ctx.request.headers.path);
                if (proc)
                    await proc(ctx);
            }
            else {
                ctx.response.body = "Procedure not found!";
            }
            req.setEncoding("utf8");
            req.stream.respond({
                ":path": ctx.response.headers.path,
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
            }
            else {
                req.stream.end(Buffer.alloc(ctx.response.body.length, ctx.response.body));
            }
        });
    }
    attachProcedure(name, proc) {
        this._procedures.set(['/', name].join(''), proc);
    }
    use(cb) {
        this._middlewares.push(cb);
    }
    unuse(toBeRemoved) {
        this._middlewares = this.removeFromList(this._middlewares, toBeRemoved);
    }
    removeFromList(ori, toBeRemoved) {
        const newList = [];
        for (let i = ori.length - 1; i >= 0; --i) {
            if (ori[i] !== toBeRemoved)
                newList.push(ori[i]);
        }
        return newList;
    }
    listen(port = 8400) {
        this._server.listen(port);
    }
    close(runExitHandler = false) {
        this._server.close();
        if (runExitHandler)
            this.onExitHandler();
    }
    graceful(cb) {
        this._graceful = cb;
    }
}
exports.TinyTechServer = TinyTechServer;
class TinyTechClient {
    constructor(jsonInterface) {
        this.jsonInterface = jsonInterface;
        this._serviceInfo = { name: "", endpoint: "", version: "", procs: [], port: "" };
        switch (typeof jsonInterface) {
            case "string":
                this._serviceInfo = require(jsonInterface);
                break;
            case "object":
                const { name, endpoint, version, procs, port } = jsonInterface;
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
        this._client = http2_1.default.connect([this._serviceInfo.endpoint, this._serviceInfo.port].join(':'));
        this._client.on("error", (e) => {
            console.log("BAD CONNECTION!");
            throw e;
        });
    }
    getServiceInfo() {
        return this._serviceInfo;
    }
    async procedure(name, data, headers) {
        return new Promise((resolve, reject) => {
            const ctx = {
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
            };
            const req = this._client.request(Object.assign({}, {
                ":path": ["/", name].join(""),
                ":method": headers && headers.method ? headers.method : data ? "POST" : "GET"
            }, headers));
            req.on("error", (err) => reject(err));
            req.on("response", (headers) => {
                ctx.response.headers = headers;
            });
            req.on("data", (chunk) => {
                ctx.response.body += chunk.toString("utf8");
            });
            req.on("end", () => {
                resolve(ctx);
            });
            req.setEncoding("utf8");
            if (req.writable && data) {
                req.write(Buffer.alloc(data.length, data));
            }
            req.end();
        });
    }
    availableProcedures() {
        return this._serviceInfo.procs.map(v => v);
    }
    close() {
        if (!this._client.closed) {
            this._client.close();
            this._client.destroy();
        }
    }
}
exports.TinyTechClient = TinyTechClient;
function compress(data) {
    return new Promise((resolve, reject) => {
        zlib_1.default.gzip(data, (err, result) => {
            if (err)
                reject(err);
            resolve(result.toString("base64"));
        });
    });
}
exports.compress = compress;
function decompress(data) {
    return new Promise((resolve, reject) => {
        const decodedData = Buffer.from(data, "base64");
        zlib_1.default.unzip(decodedData, (err, data) => {
            if (err)
                reject(err);
            resolve(data.toString("utf8"));
        });
    });
}
exports.decompress = decompress;
exports.default = {
    TinyTechServer,
    TinyTechClient
};
//# sourceMappingURL=main.js.map