function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

if (getCookie("dark") === "true")
    document.getElementById("body").className = "dark";

Vue.component('songlist', {
    props: ['songlist', 'title', 'showNumbers'],
    methods: {
        ytopen: function(id) {
            window.open('https://youtu.be/' + id);
        },
        trimString: function (id) {
            window.open('https://youtu.be/' + id);
        }
    },
    template: `
    <div style="overflow: auto">
        <table>
            <thead>
                <tr>
                    <th colspan=5><p style="font-size: 1.25rem">{{ title }}</p></th>
                </tr>
                <tr>
                    <th v-if="showNumbers"><p>№</p></th>
                    <th><p>Name</p></th>
                    <th><p>Duration</p></th>
                    <th><p>Requester</p></th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="songlist.length > 0" v-for="(song, index) in songlist">
                    <td width="2%" v-if="showNumbers"><p>{{ index + 1 }}</p></td>
                    <td><a :href="'https://youtu.be/'+song.song">{{ song.title }}</a></td>
                    <td width="6%"><p>{{ song.duration }}</p></td>
                    <td width="10%"><p>{{ song.requester ? song.requester : "-" }}</p></td>
                </tr>
            </tbody>
        </table>
    </div>
`})

let vue = new Vue({
    el: '#app',
    data: {
        currentsong: {},
        songlist: [],
        playlist: [],
        history: [],
        connected: false,
        iframe: false
    },
    methods: {
        setCookie: setCookie,
        getCookie: getCookie,
        toggleTheme: function() {
            let body = document.getElementById("body");
            if (body.className === "dark") {
                body.className = "";
                this.setCookie("dark", "false", "99999");
            }
            else {
                body.className = "dark";
                this.setCookie("dark", "true", "99999");
            }
        },
        togglePlayer: function () {
            if (this.iframe) {
                this.iframe = false;
                this.setCookie("iframe", "false", "99999");
            }
            else {
                this.iframe = true;
                this.setCookie("iframe", "true", "99999");
            }
        }
    }
});

if (getCookie("iframe") === "true")
    vue.iframe = true;

let socket = io(window.location.host);

socket.on("connect", () => {
    console.log("Socket connected!")
    socket.emit("wow");
    setInterval(() => {
        socket.emit("wow");
    }, 10000)
    vue.connected = true;
})

socket.on("disconnect", () => {
    console.log("Socket disconnected!");
    vue.connected = false;
});

socket.on("currentsong", data => vue.currentsong = data);
socket.on("songlist", data => vue.songlist = data);
socket.on("playlist", data => vue.playlist = data);
socket.on("history", data => vue.history = data);