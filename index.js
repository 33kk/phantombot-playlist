let con = {
    host: process.env.HOST || "localhost",
    wport: process.env.WPORT || ":25000",
    wsport: process.env.WSPORT || ":25003",
    wproto: process.env.WPROTO ||"http://",
    wsproto: process.env.WSPROTO || "ws://",
    port: process.env.PORT || 1337
};
const fetch = require("node-fetch");
const express = require("express");
const WebSocketClient = require("./ws.js");

let app = express();
let httpServer = require("http").createServer(app);
app.use(express.static('web'))

let socketServer = require("socket.io")(httpServer);
let socketClient = new WebSocketClient();
socketClient.open(con.wsproto + con.host + con.wsport);

let data = {
    currentsong: {},
    songlist: [],
    playlist: []
};

let oldData = {
    currentsong: "",
    songlist: "",
    playlist: ""
};

let history = [];
function addToHistory(song) {
    history.unshift(song);
    if (history.length > 5) {
        history.pop();
    }
    socketServer.sockets.emit("history", history);
    console.log(history);
}

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
        let moStr = JSON.stringify(messageObject.currentsong);
        if (moStr !== oldData.currentsong) {
            try {
                let oldO = JSON.parse(oldData.currentsong);
                if (oldO !== undefined)
                    addToHistory(oldO);
            }
            catch {
                console.log('JSON parse error');
            }
            oldData.currentsong = moStr;
            data.currentsong = messageObject.currentsong;
            socketServer.sockets.emit("currentsong", messageObject.currentsong);
        }
        return;
    }

    if (messageObject.songlist !== undefined) {
        let moStr = JSON.stringify(messageObject.songlist);
        if (moStr !== oldData.songlist) {
            oldData.songlist = moStr;
            data.songlist = messageObject.songlist;
            socketServer.sockets.emit("songlist", messageObject.songlist);
        }
        return;
    }

    if (messageObject.playlist !== undefined) {
        let moStr = JSON.stringify(messageObject.playlist);
        if (moStr !== oldData.playlist) {
            oldData.playlist = moStr;
            data.playlist = messageObject.playlist;
            socketServer.sockets.emit("playlist", messageObject.playlist);
        }
        return;
    }
};

let checkForUpdates = false;

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

setInterval(() => {
    if (checkForUpdates === true) {
        requestData();
    }
}, 10000);

let updateTimeout;
socketServer.on("connection", function(socket) {
    socket.emit("playlist", data.playlist);
    socket.emit("songlist", data.songlist);
    socket.emit("currentsong", data.currentsong);
    socket.emit("history", history);
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



httpServer.listen(con.port, function () {
    console.log("Listening on", con.port);
});