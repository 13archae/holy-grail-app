const express = require("express");
const { static } = require("express");
//const { useParams } = require("react-router-dom");
var app = express();
const cors = require("cors");
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Access-Control-Allow-Origin"],
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
  .hSet("tracking_obj", "screen_data", JSON.stringify(json))
  .then((value) => {
    console.log("set fields updated: ", value);
  })
  .catch((e) => {
    console.log("error in init set", e);
  });

// serve static files from public directory
app.use(static("./public"));

/**
 * Function : data
 *
 * @returns  Promise
 */
function data() {
  return new Promise((resolve, reject) => {
    redisClient.hGet("tracking_obj", "screen_data", function (err, value) {
      if (err) {
        console.log("error in data() on hGet");
        throw err;
      }

      console.log(`hGet Success:  ${value}`);

      const val_string = JSON.parse(value);

      const data = {
        header: Number(value[0]),
        left: Number(value[1]),
        article: Number(value[2]),
        right: Number(value[3]),
        footer: Number(value[4]),
      };
      data_string = JSON.stringify(data);
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

/**
 *
 */
app.get("/update/:key/:value", function (req, res) {
  console.log(`in update endpoint`);
  const key = req.params.key;
  let value = Number(req.params.value);
  console.log(`KEY: ${key}  ::  VALUE: ${value}`);
  redisClient.hGet("tracking_obj", "screen_data", (err, track_obj_out) => {
    // Error Catcher
    if (err) {
      console.log("No Data Object Found");
      throw err;
    }

    console.log("Object Found: ", track_obj_out);

    let track_obj = JSON.parse(track_obj_out);
    let key_value = track_obj[key];

    // new value
    new_value = key_value + value;

    track_obj[key] = new_value;

    let track_obj_in = JSON.stringify();

    redisClient.hSet("tracking_obj", "screen_data", track_obj_in);

    // return data to client
    data().then((data) => {
      console.log(data);
      res.send(data).catch((e) => {
        console.log("Error: update() call to data()", e);
      });
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
