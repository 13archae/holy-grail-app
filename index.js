const express = require("express");
const { createClient, quit } = require("@node-redis/client");
const cors = require("cors");
const corsOpts = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Access-Control-Allow-Origin"],
};

var app = express();
app.use(cors(corsOpts));

const REDIS_CLIENT = createClient({
  url: "redis://default:0VAMxueUaV9KqJvK1zjAekMOwVnKX41p@redis-10925.c8.us-east-1-4.ec2.redns.redis-cloud.com:10925",
  connectTimeout: 10000,
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
    console.log("init DB: ", value);
  })
  .catch((e) => {
    console.log("error in init set", e);
  });

// serve static files from public directory
app.use(express.static("public"));

/**
 * Function : data
 *
 * @returns  Promise
 */
function data() {
  return new Promise((resolve, reject) => {
    REDIS_CLIENT.hGet("tracking_obj", "screen_data")
      .then((data_string) => {
        console.log(`hGet Success:  ${data_string}`);

        //const value_obj = JSON.parse(value);

        // const data = {
        //   header : Number(value_obj[0]),
        //   left : Number(value_obj[1]),
        //   article: Number(value_obj[2]),
        //   right: Number(value_obj[3]),
        //   footer: Number(value_obj[4])
        // };

        //data_string = JSON.stringify(value);
        console.log("data() data_string : ", data_string);

        resolve(data_string);
      })
      .catch((err) => {
        console.log("data() error", err);
        reject(null);
      });
  });
}

/**
 * DATA Endpoint
 */
app.get("/data", (req, res) => {
  console.log("*** in /data endpoint ***");
  data()
    .then((outData) => {
      console.log(outData);
      res.send(outData);
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
  const req_key = req.params.key;
  const req_value = Number(req.params.value);
  console.log(`req_key: ${req_key}  ::  req_value: ${req_value}`);
  REDIS_CLIENT.hGet("tracking_obj", "screen_data")
    .then((str_JSON) => {
      console.log("/update hGet() : Object Found: ", str_JSON);

      if (!str_JSON) {
        console.log("/update hGet() str_JSON error: ", err);
        res.status(404).send("/update hGet str_JSON error: " + err);
      }

      let track_obj = JSON.parse(str_JSON);
      let key_value = track_obj[req_key];

      // new value
      const new_value = Number(key_value) + Number(req_value);

      track_obj[req_key] = new_value;

      let track_obj_JSON = JSON.stringify(track_obj);

      REDIS_CLIENT.hSet("tracking_obj", "screen_data", track_obj_JSON)
        .then((response) => {
          console.log("hSet() in /update SUCCESS : values set: ", response);
        })
        .catch((err) => {
          console.log("Failed hSet() in /update", err);
        });

      // return data to client
      data()
        .then((in_data) => {
          console.log("in_data", in_data);

          res.send(in_data);
        })
        .catch((err) => {
          console.log("/update data() call error:  ", err);
        });
    })
    .catch((err) => {
      if (err) {
        console.log("/update hGet() error: ", err);
        res.status(404).send("/update hGet: ", err);
      }
    });
});

app.listen(3000, () => {
  console.log("Running on 3000");
});

process.on("exit", function () {
  quit();
  console.log("Session End:  ", Date.now());
});
