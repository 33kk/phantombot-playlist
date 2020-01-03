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
/*	winFocus()	*/
;(function() {
	var callBacks = { blur: [], focus: [], blurFocus: [] },
		hidden = "hidden"
	
	function winFocus() {
		var args = Array.prototype.slice.call(arguments, 0)
			init = true, initMethods = [], methods = []
		
		for (var x in args) {
			switch (typeof args[x]) {
				case 'boolean':
					init: args[x];
					break;
				case 'function':
					methods.push(args[x]);
					break;
				case 'object':
					if (args[x].hasOwnProperty('init')) init = args[x]["init"];
					if (args[x]["blur"]) {
						callBacks.blur.push(args[x]["blur"]);
						if (init) initMethods.push(args[x]["blur"]);
					}
					if (args[x]["focus"]) {
						callBacks.focus.push(args[x]["focus"]);
						if (init) initMethods.push(args[x]["focus"]);
					}
					if (args[x]["blurFocus"]) {
						callBacks.blurFocus.push(args[x]["blurFocus"]);
						if (init) initMethods.push(args[x]["blurFocus"]);
					}
					break;
			}
		}
		
		if (methods && methods.length) {
			if (init) initMethods.concat(methods);
			switch (methods.length) {
				case 1:
					callBacks.blurFocus.push(methods[0]);
					break;
				case 2:
					callBacks.blur.push(methods[0]);
					callBacks.focus.push(methods[1]);
					break;
				default:
					for (var x in methods) {
						switch (x%3) {
							case 0:
								callBacks.blur.push(methods[x]);
								break;
							case 1:
								callBacks.focus.push(methods[x]);
								break;
							case 2:
								callBacks.blurFocus.push(methods[x]);
								break;
						}
					}
			}
		}
		
		if (init && initMethods.length) for (var x in initMethods) initMethods[x].apply(window, [{ hidden: document[hidden] }]);
	}
	
	function onChange(e) {
		var eMap = { focus: false, focusin: false, pageshow: false, blur: true, focusout: true, pagehide: true };
		e = e || window.event;
		if (e) {
			e.hidden = e.type in eMap ? eMap[e.type] : document[hidden];
			window.visible = !e.hidden;
			exeCB(e);
		}
		else {
			try { onChange.call(document, new Event('visibilitychange')); }
			catch(err) {  }
		}
	}
	
	function exeCB(e) {
		if (e.hidden && callBacks.blur.length) for (var x in callBacks.blur) callBacks.blur[x].apply(window, [e]);
		if (!e.hidden && callBacks.focus.length) for (var x in callBacks.focus) callBacks.focus[x].apply(window, [e]);
		if (callBacks.blurFocus.length) for (var x in callBacks.blurFocus) callBacks.blurFocus[x].apply(window, [e, !e.hidden]);
	}
	
	function initWinFocus() {
		if (console && console['log']) console.log('Initializing winFocus()');
		//	Standard initialization
		if (hidden in document)	//	IE10 | FF20+
			document.addEventListener("visibilitychange", onChange);
		else if ((hidden = "mozHidden") in document)	//	Older FF Versions (?)
			document.addEventListener("mozvisibilitychange", onChange);
		else if ((hidden = "webkitHidden") in document)	//	Chrome
			document.addEventListener("webkitvisibilitychange", onChange);
		else if ((hidden = "msHidden") in document)	//	IE 4-6
			document.addEventListener("msvisibilitychange", onChange);
		else if ((hidden = "onfocusin") in document)	//	IE7-9
			document.onfocusin = document.onfocusout = onChange;
		else	//	All others:
			window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onChange;
	}
	
	winFocus.clear = function(what) {
		if (what && callBacks[what]) callBacks[what] = [];
		else if (void 0 == what || what == 'all') for (var x in callBacks) callBacks[x] = [];
		return callBacks;
	}
	
	winFocus.getCallBacks = function(what) {
		if (what && callBacks[what]) return callBacks[what];
		return callBacks;
	}
	
	if (document.readyState == "complete") initWinFocus();
	window.initWinFocus = initWinFocus;
	
	//	add as window variable
	window.hasOwnProperty("winFocus")||(window.winFocus=winFocus);
})();

window.onload = () => {
    window.initWinFocus();
    let status = document.getElementById("status");
  let socket = io(window.location.host);
    let timeout = setTimeout(() => {
                socket.disconnect();
                timeout = undefined;
            }, 60000 * 5);
  window.winFocus({
    blur: () => {
        if (socket.connected) {
            if (timeout !== undefined) clearTimeout(timeout);
            timeout = setTimeout(() => {
                socket.disconnect();
                timeout = undefined;
            }, 60000)
        }
    },
    focus: () => {
        if (timeout !== undefined) clearTimeout(timeout);
            timeout = setTimeout(() => {
                socket.disconnect();
                timeout = undefined;
            }, 60000 * 5)
        if (!socket.connected) {
            socket.connect();
        }
    }
  });
  
  let canReconnect = true;
  let reconnect = () => {
      if (!socket.connected && canReconnect === true) {
        socket.connect();
        canReconnect = false;
        setTimeout(() => {
            canReconnect = true;
        }, 2000)
      }
  }
  
  document.addEventListener("mousemove", reconnect);
  document.addEventListener("mousedown", reconnect);
  
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
