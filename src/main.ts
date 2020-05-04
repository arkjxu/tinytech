import { TinyTechServer, ITinyTechMiddleWare, ITinyTechContext, ITinyTechProcedure } from "./lib/tinytech";

const testMiddle1: ITinyTechMiddleWare = (ctx: ITinyTechContext) => {
  ctx.response.body = "Test Middle 1";
}
const testProc: ITinyTechProcedure = (ctx: ITinyTechContext) => {
  ctx.response.body += "Test Procedure done!";
}
const testProc2: ITinyTechProcedure = (ctx: ITinyTechContext) => {
  ctx.response.body += "You invoked Hi procedure!";
}
const server = new TinyTechServer();
server.use(testMiddle1);
server.attachProcedure("testProc", testProc);
server.attachProcedure("hi", testProc2);
server.listen(3002);