"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tinytech_1 = require("./lib/tinytech");
const testMiddle1 = (ctx) => {
    ctx.response.body = "Test Middle 1";
};
const testProc = (ctx) => {
    ctx.response.body += "Test Procedure done!";
};
const testProc2 = (ctx) => {
    ctx.response.body += "You invoked Hi procedure!";
};
const server = new tinytech_1.TinyTechServer();
server.use(testMiddle1);
server.attachProcedure("testProc", testProc);
server.attachProcedure("hi", testProc2);
server.listen(3002);
//# sourceMappingURL=main.js.map