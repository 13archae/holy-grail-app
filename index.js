const express = require("express");
const { static } = require("express");
const { createClient, quit } = require("redis");
const cors = require("cors");
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Access-Control-Allow-Origin"],
};

var app = express();
app.use(cors(corsOpts));

const REDIS_CLIENT = createClient({
  url: "redis://:@127.0.0.1:6379/0",
});
console.log("REDIS_CLIENT:  ", REDIS_CLIENT);

while (true) {
  if (!REDIS_CLIENT.isOpen) {
    REDIS_CLIENT.connect();
    break;
  }
}

REDIS_CLIENT.on("error", (err) => console.log("redis client error:  ", err));

REDIS_CLIENT.on("connect", () => {
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

REDIS_CLIENT.hSet("tracking_obj", "screen_data", JSON.stringify(json))
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
    REDIS_CLIENT.hGet("tracking_obj", "screen_data", function (err, value) {
      if (err) {
        console.log("error in data() on hGet");
        throw err;
      }

      console.log(`hGet Success:  ${value}`);

      const value_obj = JSON.parse(value);

      const data = {
        header: Number(value_obj[0]),
        left: Number(value_obj[1]),
        article: Number(value_obj[2]),
        right: Number(value_obj[3]),
        footer: Number(value_obj[4]),
      };
      data_string = JSON.stringify(data);
      err ? reject(null) : resolve(data);
    });
  });
}

/**
 * DATA Endpoint
 */
app.get("/data", (req, res) => {
  console.log("*** in /data endpoint ***");
  data()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((err) => {
      console.log("app.get() /data error", err);
      throw err;
    });
});

/**
 *  UPDATE Endpoint
 */
app.get("/update/:key/:value", (req, res) => {
  console.log(`*** in /update endpoint ***`);
  const key = req.params.key;
  let value = Number(req.params.value);
  console.log(`KEY: ${key}  ::  VALUE: ${value}`);
  REDIS_CLIENT.hGet(
    "tracking_obj",
    "screen_data",
    function (err, track_obj_out) {
      if (err) {
        console.log("/update hGet error: ", err);
        res.send(null);
      }

      console.log("/update hGet() : Object Found: ", track_obj_out);

      let track_obj = JSON.parse(track_obj_out);
      let key_value = track_obj[key];

      // new value
      new_value = key_value + value;

      track_obj[key] = new_value;

      let track_obj_in = JSON.stringify(track_obj);

      REDIS_CLIENT.hSet("tracking_obj", "screen_data", track_obj_in)
        .then((response) => {
          console.log("hSet() in /update SUCCESS : values set: ", response);
        })
        .catch((err) => {
          console.log("Failed hSet() in /update", err);
        });

      // return data to client
      data()
        .then((data) => {
          res.send(data);
        })
        .catch((err) => {
          console.log("/update data() call error:  ", err);
        });
    }
  ).catch((err) => {
    console.log("/update data() error: ", err);
  });
});

app.listen(3000, () => {
  console.log("Running on 3000");
});

process.on("exit", function () {
  quit();
  console.log("Session End:  ", Date.now());
});
