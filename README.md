# Tiny Tech
Tiny tech is the abbreviation for tiny technology.
typescript.  It's basically a wrapper for the NodeJS HTTP/2 module.

## Current Status
***
![alt text][build]
![alt text][license]
![alt text][docs]

## Usage
***
```typescript
const TinyTech = require("tinytech").default;
```
OR
```typescript
import TinyTech from "tinytech";
// You can also do
import {TinyTechServer, TinyTechClient} from "tinytech";
```

### How to tell server compress the results?
```
In the request header sent by the client, set
the accept parameter as "gzip"

This will tell the server to use it's compression function
to compress and encode in base64 string.
```

```typescript
const result = await testClient.procedure("getUsers", undefined, {
  "accept": "gzip"
});
```

### How to tell server that my data is compressed?
```
In the request header sent by the client, set
the content-encoding as "gzip"

This will tell the server to use it's decompression function
to decompress the base64encoded gziped data.
```

```typescript
const result = await testClient.procedure("getUsers", undefined, {
  "content-encoding": "gzip"
});
```

## How to make a Middleware
***
```typescript
async function jsonParser(ctx: ITinyTechContext) {
  if (ctx.request.headers["content-type"] === "application/json") {
    ctx.request.body = JSON.parse(ctx.request.body);
  }
}

service.use(jsonParser);
```


## How to make a procedure
***
```typescript
async function ping(ctx: ITinyTechContext) {
  ctx.response.body = "pong";
}

service.attachProcedure("ping", ping);
```

## Context
***
Every handler or middleware is passed in a ctx: `ITinyTechContext`
object that has a `reponse` and a `request`.  `request`.

```typescript
// Response Object
body: any;
headers: ITinyTechHeader;
```

```typescript
// Request Object
body: any;
headers: ITinyTechHeader;
stream: http2.stream
```

```typescript
// Header Object
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
```

## Server API
***
[TinyTechServer](): `TinyTechServer`

Parameters:
* options: `http2.ServerOptions`

Returns:
* TinyTechServer: `TinyTechServer`

This function returns a tinytechserver with or without TLS configurations.

[graceful](): `void`

Parameters:
* Callback: `function`

This function runs before exit

[attachProcedure](): `void`
Parameters:
* Name: `string`
* Handler: `function`

This function registers the given name with the handler.
The procedure then can be invoke by client through name.

[use](): `void`
Parameters:
* Middleware: `function`

This function registers the function type `ITinyTechMiddleware` as
a middle ware that is run in order prior to the requests being handled
by the procedure function.

[unuse](): `void`
Parameters:
* Middleware: `function`

This function unregisters the function type `ITinyTechMiddleware` as 
a middleware so it won't be invoked.

[listen](): `void`
Parameters:
* Port: `number`

This function starts the server and listens on the port number

[close](): `void`
Parameters:
* runExitHandler: `boolean`

This function stops and closes the server and runs the exit handler
specified by `graceful()` if `runExitHandler` is `True`

## Client API
***
[TinyTechClient](): `TinyTechClient`

Parameters:
* jsonInterface: `string | ITinyTechServiceInfo`

Returns:
* TinyTechServer: `TinyTechServer`

This function returns a tinytechserver with the specified interface
settings

[getServiceInfo](): `ITinyTechServiceInfo`

Returns:
* ServiceInfo: `ITinyTechServiceInfo`

[procedure](): `void`

Parameters:
* Name: `string`

Invoke the corresponding procedure remotely on the server.

[availableProcedures](): `void`

Returns
* Procs: `string[]`

Returns the name of all the available procedures

[close](): `void`

Closes the current connection with the service

## Common API
***
[compress](): `string`

Parameters:
* data: `string`

Returns:
* base64Str: `string`

gzip the data string into a base64 string


[decompress](): `string`

Parameters:
* data: `string`

Returns:
* oriStr: `string`

ungzip the base64 encoded string into it's original content

## FAQ
```
Q: Why is this created?

A: This was made for a quick and easy effort to spin up a simple microservice for my work with minimum latency which requires http2.
```

```
Q: Can features be added?

A: Maybe, I'll fix bugs, but not sure about features.
```

## Contributor
* Kevin Xu


[license]: https://camo.githubusercontent.com/2b5c48821f22738887c98a07f95852b610fb555b/68747470733a2f2f696d672e736869656c64732e696f2f61706d2f6c2f61746f6d69632d64657369676e2d75692e7376673f "MIT license"

[docs]: https://camo.githubusercontent.com/614c7585c82b25086d62bfe7745aa9f765291151/68747470733a2f2f72656164746865646f63732e6f72672f70726f6a656374732f7974326d70332f62616467652f3f76657273696f6e3d6c6174657374 "docs"

[build]: https://camo.githubusercontent.com/7795340899e8ed519dc205d2c73b2360e17faaba/68747470733a2f2f7472617669732d63692e6f72672f626f656e6e656d616e6e2f6261646765732e7376673f6272616e63683d6d6173746572 "build"
