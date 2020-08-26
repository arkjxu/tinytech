const {TinyTechClient, TinyTechServer, compress, decompress } = require("../dist/main");
const testPort = 4196;
let testService = undefined;
let testClient = undefined;

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
    ctx.response.body = "";
    console.log(ctx.request.body);
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
  const result = await testClient.procedure("testPost", `
    {"type":"view_submission","team":{"id":"T0G3T5X2B","domain":"nikedigital","enterprise_id":"ED6QX9KRV","enterprise_name":"Nike, Inc."},"user":{"id":"WSVR5BP1V","username":"kxu16","name":"kxu16","team_id":"T0G3T5X2B"},"api_app_id":"AU94U73RR","token":"38BKOGbXEPtGI4Qj13kpBQsX","trigger_id":"1337748330945.16129201079.27d537f22081d6a6677a57cc8294c630","view":{"id":"V01A8ST4BG8","team_id":"T0G3T5X2B","type":"modal","blocks":[{"type":"section","block_id":"vrAou","text":{"type":"mrkdwn","text":"*Squad*: Demo Project","verbatim":false}},{"type":"input","block_id":"projectactiveupdate","label":{"type":"plain_text","text":"Active:","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"projectactiveupdate","placeholder":{"type":"plain_text","text":"Is it still active?","emoji":true},"initial_option":{"text":{"type":"plain_text","text":"Active","emoji":true},"value":"Active"},"options":[{"text":{"type":"plain_text","text":"Active","emoji":true},"value":"Active"},{"text":{"type":"plain_text","text":"Inactive","emoji":true},"value":"Inactive"}]}},{"type":"input","block_id":"projectstatusupdate","label":{"type":"plain_text","text":"Status:","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"projectstatusupdate","placeholder":{"type":"plain_text","text":"What's the status?","emoji":true},"initial_option":{"text":{"type":"plain_text","text":"COMPLETED","emoji":true},"value":"COMPLETED"},"options":[{"text":{"type":"plain_text","text":"START","emoji":true},"value":"START"},{"text":{"type":"plain_text","text":"ON TRACK","emoji":true},"value":"ON TRACK"},{"text":{"type":"plain_text","text":"AT RISK","emoji":true},"value":"AT RISK"},{"text":{"type":"plain_text","text":"DELAYED","emoji":true},"value":"DELAYED"},{"text":{"type":"plain_text","text":"LIVE","emoji":true},"value":"LIVE"},{"text":{"type":"plain_text","text":"ANALYSIS","emoji":true},"value":"ANALYSIS"},{"text":{"type":"plain_text","text":"RESEARCH","emoji":true},"value":"RESEARCH"},{"text":{"type":"plain_text","text":"PLANNING","emoji":true},"value":"PLANNING"},{"text":{"type":"plain_text","text":"DEV","emoji":true},"value":"DEV"},{"text":{"type":"plain_text","text":"E2E/SIT","emoji":true},"value":"E2E/SIT"},{"text":{"type":"plain_text","text":"UAT","emoji":true},"value":"UAT"},{"text":{"type":"plain_text","text":"COMPLETED","emoji":true},"value":"COMPLETED"},{"text":{"type":"plain_text","text":"OPEN","emoji":true},"value":"OPEN"},{"text":{"type":"plain_text","text":"CLOSED","emoji":true},"value":"CLOSED"}]}},{"type":"input","block_id":"projectphaseupdate","label":{"type":"plain_text","text":"Phase:","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"projectphaseupdate","placeholder":{"type":"plain_text","text":"What's the phase?","emoji":true},"initial_option":{"text":{"type":"plain_text","text":"LIVE","emoji":true},"value":"LIVE"},"options":[{"text":{"type":"plain_text","text":"DEV","emoji":true},"value":"DEV"},{"text":{"type":"plain_text","text":"QA","emoji":true},"value":"QA"},{"text":{"type":"plain_text","text":"E2E","emoji":true},"value":"E2E"},{"text":{"type":"plain_text","text":"UAT","emoji":true},"value":"UAT"},{"text":{"type":"plain_text","text":"E2E & UAT","emoji":true},"value":"E2E & UAT"},{"text":{"type":"plain_text","text":"PVT","emoji":true},"value":"PVT"},{"text":{"type":"plain_text","text":"DONE","emoji":true},"value":"DONE"},{"text":{"type":"plain_text","text":"LIVE","emoji":true},"value":"LIVE"}]}},{"type":"input","block_id":"projectheadlineupdate","label":{"type":"plain_text","text":"Headline:","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"projectheadlineupdate","placeholder":{"type":"plain_text","text":"• Example update 1\n• Example update 2","emoji":true},"initial_value":"TEST","multiline":true,"max_length":500}},{"type":"context","block_id":"B8k","elements":[{"type":"plain_text","text":"Last update: Wed, Jul 08, 2020 9:45 AM","emoji":true}]}],"private_metadata":"Demo Project\\0Leaderboard\\0MISC\\0COMPLETED\\0LIVE\\0project\\01321985602405.16129201079.78938eda06bd2fd0f2f9a544a35ed35e","callback_id":"projectupdate","state":{"values":{"projectactiveupdate":{"projectactiveupdate":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Active","emoji":true},"value":"Active"}}},"projectstatusupdate":{"projectstatusupdate":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"COMPLETED","emoji":true},"value":"COMPLETED"}}},"projectphaseupdate":{"projectphaseupdate":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"LIVE","emoji":true},"value":"LIVE"}}},"projectheadlineupdate":{"projectheadlineupdate":{"type":"plain_text_input","value":"TESTasass"}}}},"hash":"1598462931.2jnOXTmR","title":{"type":"plain_text","text":"Your NBR Project","emoji":true},"clear_on_close":false,"notify_on_close":true,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Update","emoji":true},"previous_view_id":null,"root_view_id":"V01A8ST4BG8","app_id":"AU94U73RR","external_id":"","app_installed_team_id":"T0G3T5X2B","bot_id":"BUNHFMV6K"},"response_urls": []}
  `, {
    "content-type": "application/json"
  });
  testClient.close();
});