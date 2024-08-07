var express = require("express");
var app = express();
var redis_client = require("@redis/client");

const redisClient = redis_client.createClient(
  "redis://default:@142.93.207.209:6379"
);
console.log("redisClient:  ", redisClient); //

//redis_client.("error", (err) => console.log("Redis Client Error", err));

if (!redisClient.isOpen) {
  redisClient.connect();
}

// serve static files from public directory
app.use(express.static("public"));

// init values
redisClient.mSet("header", 0, "left", 0, "article", 0, "right", 0, "footer", 0);
redisClient.mGet(
  ["header", "left", "article", "right", "footer"],
  function (err, value) {
    if (err) {
      throw err;
    }
    console.log(value);
  }
);

function data() {
  return new Promise((resolve, reject) => {
    redis_client.mGet(
      ["header", "left", "article", "right", "footer"],
      function (err, value) {
        const data = {
          header: Number(value[0]),
          left: Number(value[1]),
          article: Number(value[2]),
          right: Number(value[3]),
          footer: Number(value[4]),
        };
        err ? reject(null) : resolve(data);
      }
    );
  });
}

// get key data
redisClient.mGet("/data", function (req, res) {
  data().then((data) => {
    console.log(data);
    res.send(data);
  });
});

// plus
redisClient.mGet("/update/:key/:value", function (req, res) {
  const key = req.params.key;
  let value = Number(req.params.value);
  redis_client.mGet(key, function (err, reply) {
    // new value
    value = Number(reply) + value;
    redis_client.mSet(key, value);

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
  redis_client.quit();
  console.log("Session End:  ", Date.now());
});
