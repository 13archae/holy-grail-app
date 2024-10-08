const API_URL = "http://localhost:3000";
const API_CLIENT = superagent;

function PlusMinus(props) {
  function handle(e) {
    console.log("event.target.id: ", e.target.id);
    console.log("PlusMinusProps: ", props);
    if (e.target.id.includes("minus")) {
      props.handle({ name: props.section, value: -1 });
      return;
    }
    props.handle({ name: props.section, value: 1 });
  }
  return (
    <>
      <img
        src={`icons/${props.section}_plus.png`}
        id="plus"
        onClick={(e) => {
          console.log("event: ", e);
          handle(e);
        }}
      />
      <img
        src={`icons/${props.section}_minus.png`}
        id="minus"
        onClick={(e) => {
          console.log("event: ", e);
          handle(e);
        }}
      />
    </>
  );
}

function Data(props) {
  console.log("*** in Data() - props: " + props);
  return (
    <div>
      Header: {props.data.header}, Left: {props.data.left}, Article:
      {props.data.article}, Right: {props.data.right}, Footer:
      {props.data.footer}
    </div>
  );
}

async function update(section, value) {
  return await new Promise((resolve, reject) => {
    var url = `${API_URL}/update/${section}/${value}`;
    console.log("URL: ", url);
    API_CLIENT.get(url)
      .then((res) => {
        if (res) {
          console.log("*** res.text", res.text);
          resolve(res.text);
        } else {
          console.log(`*** res: NULL`);
        }
      })
      .catch((err) => {
        console.log("/update get() error", err);
      });
  }).catch((err) => {
    console.log("/update get() error", err);
    reject(null);
  });
}

async function read() {
  return await new Promise((resolve, reject) => {
    var url = `${API_URL}/data`;
    API_CLIENT.get(url)
      .then((res) => {
        console.log("read() get() res.text : ", res.text);
        resolve(res.text);
      })
      .catch((err) => {
        console.log("read()  get() error", err);
        reject(null);
      });
  });
}

function App() {
  const [data, setData] = React.useState({
    header: 0,
    left: 0,
    article: 0,
    right: 0,
    footer: 0,
  });

  React.useEffect(() => {
    // read db data & update UI
    read()
      .then((res) => {
        console.log("useEffect res screen_data: ", res);
        const screen_data_obj = JSON.parse(res);

        setData(screen_data_obj);
      })
      .catch((err) => {
        console.log("read() error:  ", err);
      });
  }, []);

  function handle(section) {
    // update db & local state
    update(section.name, section.value)
      .then((res) => {
        console.log("res in handle()" + res);
        const screen_data_obj = JSON.parse(res);

        setData(screen_data_obj);
      })
      .catch((err) => {
        console.log("props.handle get() error", err);
      });
  }

  return (
    <>
      <div className="grid">
        <Header handle={handle} data={data} />
        <Left handle={handle} data={data} />
        <Article handle={handle} data={data} />
        <Right handle={handle} data={data} />
        <Footer handle={handle} data={data} />
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
