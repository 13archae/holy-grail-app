const HOLY_GRAIL = require("./index.js");

describe("holy-grail-app", async () => {
  test("not null", async () => {
    await expect("cat").toEqual("cat");
  });
});
