const {TinyTechClient, TinyTechServer} = require("../dist/main");
const TestService = require("./services/testService.json");
const testPort = 4196;
let testService = undefined;
let testClient = undefined;

beforeAll(() => {
  TestService.port = testPort;
  testService = new TinyTechServer();
  testService.attachProcedure("hi", (ctx) => ctx.response.body = "Hi!");
  testService.attachProcedure("calculate", (ctx) => ctx.response.body = "Calced!");
  testService.listen(testPort);
});

afterAll(() => {
  testService.close();
});

test("Check Test Services Connection", async () => {
  let testClient = new TinyTechClient(TestService);
  const result = await testClient.procedure("hi");
  expect(result.response.body).toBe("Hi!");
  testClient.close();
});