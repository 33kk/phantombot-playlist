let con = {
    host: process.env.HOST || "localhost",
    wport: process.env.WPORT || ":25000",
    wsport: process.env.WSPORT || ":25003",
    wproto: process.env.WPROTO ||"http://",
    wsproto: process.env.WSPROTO || "ws://",
    port: process.env.PORT || 1337
};

let data = {
    currentsong: [],
    songlist: [],
    playlist: []
};
let oldMessageObject = {
    currentsong: [],
    songlist: [],
    playlist: []
};



let app = require("express")();
let httpServer = require("http").createServer(app);
let socketServer = require("socket.io")(httpServer);

app.get("/", function(_, res) {
    res.sendFile(__dirname + "/web/index.html");
});
app.get("/script.js", function(_, res) {
    res.sendFile(__dirname + "/web/script.js");
});
app.get("/style.css", function(_, res) {
    res.sendFile(__dirname + "/web/style.css");
});

let fetch = require("node-fetch");
let WebSocketClient = require("./ws.js");
let socketClient = new WebSocketClient();
socketClient.open(con.wsproto + con.host + con.wsport);

socketClient.onopen = function(e) {
    console.log("Connected");
    fetch(con.wproto + con.host + con.wport + "/playlist/js/playerConfig.js")
        .then(r => r.text())
        .then(text => {
            socketClient.send(
                JSON.stringify({
                    readauth: text.match(/var auth="(.*?)"/)[1]
                })
            );
        })
        .catch(e => {
            console.log(e);
        });
};

socketClient.onmessage = function(edata) {
    let messageObject = JSON.parse(edata);
    if (messageObject.authresult !== undefined) {
        console.log("Auth", messageObject.authresult == true ? "success" : "fail");
        return;
    }

    if (messageObject.currentsong !== undefined) {
        let newdata = JSON.stringify(messageObject.currentsong);
        if (
            newdata ===
            oldMessageObject.currentsong
        )
            return;
        data.currentsong = formatCurrentSong(messageObject.currentsong);
        socketServer.sockets.emit("currentsong", data.currentsong);
        oldMessageObject.currentsong = newdata;
        return;
    }

    if (messageObject.songlist !== undefined) {
        let newdata = JSON.stringify(messageObject.songlist);
        if (
            newdata ===
            oldMessageObject.songlist
        )
            return;
        data.songlist = formatList(messageObject.songlist);
        socketServer.sockets.emit("songlist", data.songlist);
        oldMessageObject.songlist = newdata;
        return;
    }

    if (messageObject.playlist !== undefined) {
        let newdata = JSON.stringify(messageObject.playlist);
        if (
            newdata ===
            oldMessageObject.playlist
        )
            return;
        data.playlist = formatList(messageObject.playlist);
        socketServer.sockets.emit("playlist", data.playlist);
        oldMessageObject.playlist = JSON.stringify(messageObject.playlist);
        return;
    }
};

function createSongObject(title, duration, requester, id) {
    return {
        Title: title !== undefined ? title : "-",
        Duration: duration !== undefined ? duration : "-",
        Requester: requester !== undefined ? requester : "-",
        ID: id !== undefined ? id : "-"
    };
}

function formatCurrentSong(currentsong) {
    if (currentsong === undefined) return createSongObject();
    return [
        createSongObject(
            currentsong.title,
            currentsong.duration,
            currentsong.requester,
            currentsong.song
        )
    ];
}

function formatList(list) {
    let newList = [];
    if (list !== undefined)
        list.forEach(o => {
            newList.push(createSongObject(o.title, o.duration, o.requester, o.song));
        });
    return newList;
}

let checkForUpdates = false;

setInterval(() => {
    if (checkForUpdates === true) {
        requestData();
    }
}, 10000);

function requestData() {
    socketClient.send(JSON.stringify({
        query: "playlist"
    }));
    socketClient.send(JSON.stringify({
        query: "songlist"
    }));
    socketClient.send(JSON.stringify({
        query: "currentsong"
    }));
}



let updateTimeout;
socketServer.on("connection", function(socket) {
    socket.emit("playlist", data.playlist);
    socket.emit("songlist", data.songlist);
    socket.emit("currentsong", data.currentsong);
    socket.on("wow", () => {
        if (checkForUpdates === false) {
            requestData();
        }
        checkForUpdates = true;
        if (updateTimeout !== undefined) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            checkForUpdates = false;
        }, 25000);
    });
});

httpServer.listen(con.port, function() {
    console.log("Listening on", con.port);
});
