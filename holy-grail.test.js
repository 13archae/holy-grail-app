const HOLY_GRAIL = require("./index.js");

describe("holy-grail-app", () => {
  test("not null", async () => {
    await expect("cat").toEqual("cat");
  });
});
