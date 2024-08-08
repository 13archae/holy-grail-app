const express = require("express");
const { static } = require("express");
var app = express();
const cors = require("cors");
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOpts));

const { createClient, get, set, quit, SchemaFieldTypes } = require("redis");

const redisClient = createClient({
  url: "redis://:@127.0.0.1:6379/0",
});
console.log("redisClient:  ", redisClient);

while (true) {
  if (!redisClient.isOpen) {
    redisClient.connect();
    break;
  }
}

redisClient.on("error", (err) => console.log("redis client error:  ", err));

redisClient.on("connect", () => {
  console.log("Connected!");
});

// init values
const json = {
  header: 0,
  left: 0,
  article: 0,
  right: 0,
  footer: 0,
};

redisClient
  .hSet("tracking_obj", json)
  .then((value) => {
    console.log("set_promise_val", value);
  })
  .catch((e) => {
    console.log("error in init set", e);
  });

// serve static files from public directory
app.use(static("./public"));

function data() {
  return new Promise((resolve, reject) => {
    redisClient.hGet("tracking_obj", "$", function (err, value) {
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
app.get("/data", function (req, res) {
  data().then((data) => {
    console.log(data);
    res.send(data);
  });
});

// plus
app.get("/update/:key/:value", function (req, res) {
  const key = req.params.key;
  let value = Number(req.params.value);
  redisClient.get(key, function (err, reply) {
    // new value
    value = Number(reply) + value;
    redisClient.set(key, value);

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
