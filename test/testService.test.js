const {TinyTechClient, TinyTechServer, compress, decompress } = require("../dist/main");
const TestServiceInterface = require("./services/testService.json");
const testPort = 4196;
let testService = undefined;
let testClient = undefined;

beforeAll(() => {
  TestServiceInterface.port = testPort;
  testService = new TinyTechServer();
  testService.attachProcedure("hi", (ctx) => ctx.response.body = "Hi!");
  testService.attachProcedure("testPost", async (ctx) => {ctx.response.body = ctx.request.body});
  testService.listen(testPort);
});

afterAll(() => {
  testService.close();
});

test("Services Connection", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  if (!testClient.isClosed()) {
    const result = await testClient.procedure("hi");
    testClient.close();
    expect(result.response.body).toBe("Hi!");
  }
});

test("Basic POST Request", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const result = await testClient.procedure("testPost", "Hello world!", {
    ":method": "POST"
  });
  testClient.close();
  expect(result.response.body).toBe("Hello world!");
});

test("POST with gzip write", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const compressedData = await compress(JSON.stringify({msg: "Hi!"}));
  const result = await testClient.procedure("testPost", compressedData, {
    "content-encoding": "gzip",
    ":method": "POST"
  });
  testClient.close();
  expect(result.response.body).toBe(compressedData);
});

test("POST with gzip accept", async () => {
  let testClient = new TinyTechClient(TestServiceInterface);
  const compressedData = await compress("Hi");
  const result = await testClient.procedure("testPost", "Hi", {
    "accept": "gzip"
  });
  testClient.close();
  expect(result.response.body).toBe(compressedData);
});