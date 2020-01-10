// JSON to table generator
var _table_ = document.createElement("table"),
  _tr_ = document.createElement("tr"),
  _th_ = document.createElement("th"),
  _td_ = document.createElement("td");
  _thead_ = document.createElement("thead");
function buildHtmlTable(arr) {
  var table = _table_.cloneNode(false),
    columns = addAllColumnHeaders(arr, table);
  for (var i = 0, maxi = arr.length; i < maxi; ++i) {
    var tr = _tr_.cloneNode(false);
    for (var j = 0, maxj = columns.length; j < maxj; ++j) {
      var td = _td_.cloneNode(false);
      cellValue = arr[i][columns[j]];
      td.appendChild(document.createTextNode(arr[i][columns[j]] || ""));
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}
function addAllColumnHeaders(arr, table) {
  var columnSet = [],
  thead = _thead_.cloneNode(false);
  for (var i = 0, l = arr.length; i < l; i++) {
    for (var key in arr[i]) {
      if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key) === -1) {
        columnSet.push(key);
        var th = _th_.cloneNode(false);
        th.appendChild(document.createTextNode(key));
        thead.appendChild(th);
      }
    }
  }
  table.appendChild(thead);
  return columnSet;
}

window.onload = () => {
  let status = document.getElementById("status");
  let socket = io(window.location.host);
  
  socket.on("connect", () => {
    console.log("Socket connected!")
    socket.emit("wow");
    setInterval(() => {
      socket.emit("wow");
    }, 10000)
    status.innerHTML = "Connected";
    status.setAttribute("class", "connected");
  })

  socket.on("disconnect", () => {
    console.log("Socket disconnected!");
    status.innerHTML = "Disconnected"
    status.setAttribute("class", "disconnected");
  });

  function createTable(name, data) {
    console.log("Updating", name)
    let table = document.getElementById(name);
    if (table.firstChild) table.firstChild.remove();
    table.appendChild(buildHtmlTable(data));
  }

  socket.on("currentsong", data => createTable("currentsong", data));
  socket.on("songlist", data => createTable("songlist", data));
  socket.on("playlist", data => createTable("playlist", data));
};
