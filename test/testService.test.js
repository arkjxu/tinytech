const {TinyTechClient, TinyTechServer, compress, decompress } = require("../dist/main");
const testPort = 4196;
let testService = undefined;

const TestServiceInterface = {
  name: "Test Service",
  endpoint: "http://127.0.0.1",
  version: "1.0.0",
  port: "",
  procs: [
    "ping",
    "jsonTester"
  ]
}

async function jsonParser(ctx) {
  if (ctx.request.headers["content-type"] === "application/json") {
    ctx.request.body = JSON.parse(ctx.request.body);
  }
}

beforeAll(() => {
  TestServiceInterface.port = testPort;
  testService = new TinyTechServer();
  testService.use(jsonParser);
  testService.attachProcedure("ping", (ctx) => ctx.response.body = "pong");
  testService.attachProcedure("jsonTester", (ctx) => ctx.response.body = ctx.request.body.user);
  testService.attachProcedure("testPost", (ctx) => {
    ctx.response.body = ctx.request.body.test_msg;
  });
  testService.attachProcedure("testStatus", (ctx) => {
    ctx.response.headers.status = 404;
    ctx.response.body = "hi";
  });
  testService.attachProcedure("testStatus2", (ctx) => {
    ctx.response.headers.status = 500;
    ctx.response.body = "hi";
  });
  testService.listen(testPort);
});

afterAll(() => {
  testService.close();
});

test("Services Connection", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  if (!testClient.isClosed()) {
    const result = await testClient.procedure("ping");
    testClient.close();
    expect(result.response.body).toBe("pong");
  }
});

test("Test POST JSON middleware", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const result = await testClient.procedure("jsonTester", JSON.stringify({
    user: "kevin.xu@nike.com"
  }), {
    "content-type": "application/json"
  });
  testClient.close();
  expect(result.response.body).toBe("kevin.xu@nike.com");
});

test("Test JSON", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const worked = "worked!";
  const result = await testClient.procedure("testPost", JSON.stringify({
    test_msg: worked
  }), {
    "content-type": "application/json"
  });
  testClient.close();
  expect(result.response.body).toBe(worked)
});

test("return status", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const result = await testClient.procedure("testStatus");
  testClient.close();
  expect(result.response.headers.status).toBe(404);
});

test("return status 2", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const result = await testClient.procedure("testStatus2", JSON.stringify({
    test: "just testing"
  }), {
    "content-type": "application/json"
  });
  testClient.close();
  expect(result.response.headers.status).toBe(500);
});