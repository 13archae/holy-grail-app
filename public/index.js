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
      <script>console.log('FIVE');</script>
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
  console.log("THREE");
  return (
    <div>
      Header: {props.data.header}, Left: {props.data.left}, Article:
      {props.data.article}, Right: {props.data.right}, Footer:{" "}
      {props.data.footer}
    </div>
  );
}

function update(section, value) {
  return new Promise((resolve, reject) => {
    var url = `${API_URL}/update/${section}/${value}`;
    console.log("URL: ", url);
    API_CLIENT.get(url).then(function (err, res) {
      if (err) {
        console.log("get() error", e);
      }
      console.log("res.body", res.body);
      err ? reject(null) : resolve(res.body);
    });
  });
}

function read() {
  return new Promise((resolve, reject) => {
    var url = `${API_URL}/data`;
    API_CLIENT.get(url).then(function (err, res) {
      err ? reject(null) : resolve(res.body);
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
    const response = read().then((res) => {
      setData(res);
    });
  }, []);

  function handle(section) {
    // update db & local state
    const response = update(section.name, section.value).then((res) => {
      setData(res);
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
