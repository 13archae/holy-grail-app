const express = require("express");
const { static } = require("express");
var app = express();
const { createClient, get, set, quit, SchemaFieldTypes } = require("redis");

const redisClient = createClient({ host: "127.0.0.1", port: "6379", db: 0 });
console.log("redisClient:  ", redisClient); //

if (!redisClient.isOpen) {
  redisClient.connect();
}

redisClient.on("error", (err) => console.log("redis client error:  ", err));

redisClient.on("connect", () => {
  console.log("Connected!");
});
// serve static files from public directory
app.use(static("./public"));

// Create an index.
// https://redis.io/commands/ft.create/
try {
  redisClient.ft.create(
    "idx:holygrail-idx",
    {
      "$.header": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "header",
      },
      "$.left": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "left",
      },
      "$.right": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "right",
      },
      "$.article": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "article",
      },
      "$.footer": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "footer",
      },
    },
    {
      ON: "JSON",
      PREFIX: "noderedis:holygrail",
    }
  );
} catch (e) {
  if (e.message === "Index already exists") {
    console.error("Index exists already, skipped creation.");
  } else {
    console.error("Index-create: Other error", e);
  }
}

// init values
const set_promise = new Promise((resolve, reject) => {
  const set_ret = redisClient.json.set(
    "tracking_obj",
    "$",
    '{ "header": 0, "left": 0, "article": 0, "right": 0, "footer": 0 }'
  );
  resolve(set_ret);
}).catch((error) => {
  console.error("ERROR: ", error);
});

set_promise
  .then((value) => {
    console.log("set_promise_val", value);
  })
  .catch((error) => {
    console.error("set_promise.then():  ", error);
  });

redisClient.json.get("tracking_obj", "$").catch((error) => {
  console.error("Error on get:  ", error);
});

function data() {
  return new Promise((resolve, reject) => {
    redisClient.json.get("tracking_obj", function (err, value) {
      const data = {
        header: Number(value[0]),
        left: Number(value[1]),
        article: Number(value[2]),
        right: Number(value[3]),
        footer: Number(value[4]),
      };
      err ? reject(null) : resolve(data);
    });
  });
}

// get key data
redisClient.json.get("/data", function (req, res) {
  data().then((data) => {
    console.log(data);
    res.send(data);
  });
});

// plus
redisClient.json.set("/update/:key/:value", function (req, res) {
  const key = req.params.key;
  let value = Number(req.params.value);
  redisClient.json.get(key, function (err, reply) {
    // new value
    value = Number(reply) + value;
    redisClient.json.set(key, value);

    // return data to client
    data().then((data) => {
      console.log(data);
      res.send(data);
    });
  });
});

app.listen(3000, () => {
  console.log("Running on 3000");
});

process.on("exit", function () {
  quit();
  console.log("Session End:  ", Date.now());
});
