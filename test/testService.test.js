const {TinyTechClient, TinyTechServer, compress, decompress } = require("../dist/main");
const TestService = require("./services/testService.json");
const testPort = 4196;
let testService = undefined;
let testClient = undefined;

beforeAll(() => {
  TestService.port = testPort;
  testService = new TinyTechServer();
  testService.attachProcedure("hi", (ctx) => ctx.response.body = "Hi!");
  testService.attachProcedure("testPost", async (ctx) => {ctx.response.body = ctx.request.body});
  testService.listen(testPort);
});

afterAll(() => {
  testService.close();
});

test("Check Test Services Connection", async () => {
  let testClient = new TinyTechClient(TestService);
  const result = await testClient.procedure("hi");
  testClient.close();
  expect(result.response.body).toBe("Hi!");
});

test("Test POST", async () => {
  let testClient = new TinyTechClient(TestService);
  const result = await testClient.procedure("testPost", "Hello world!", {
    ":method": "POST"
  });
  testClient.close();
  expect(result.response.body).toBe("Hello world!");
});

test("Test POST with gzip write", async () => {
  let testClient = new TinyTechClient(TestService);
  const compressedData = await compress(JSON.stringify({msg: "Hi!"}));
  const result = await testClient.procedure("testPost", compressedData, {
    "content-encoding": "gzip",
    ":method": "POST"
  });
  testClient.close();
  expect(result.response.body).toBe(compressedData);
});

test("Test POST with gzip accept", async () => {
  let testClient = new TinyTechClient(TestService);
  const compressedData = await compress("Hi");
  const result = await testClient.procedure("testPost", "Hi", {
    "accept": "gzip",
    ":method": "POST"
  });
  testClient.close();
  expect(result.response.body).toBe(compressedData);
});


