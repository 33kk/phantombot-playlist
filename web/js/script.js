document.getElementById("body").className = document.cookie;

Vue.component('songlist', {
    props: ['songlist', 'title', 'showNumbers'],
    methods: {
        ytopen: function(id) {
            window.open('https://youtu.be/' + id);
        }
    },
    template: `
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
                <th><p>YT</p></th>
            </tr>
        </thead>
        <tbody>
            <tr v-if="songlist.length > 0" v-for="(song, index) in songlist">
                <td width="2%" v-if="showNumbers"><p>{{ index + 1 }}</p></td>
                <td><p>{{ song.title }}</p></td>
                <td width="6%"><p>{{ song.duration }}</p></td>
                <td width="10%"><p>{{ song.requester ? song.requester : "-" }}</p></td>
                <td width="3%"><i class="fab fa-youtube" @click="ytopen(song.song)" target="_blank"/></td>
            </tr>
        </tbody>
    </table>
`})

let vue = new Vue({
    el: '#app',
    data: {
        currentsong: {},
        songlist: [],
        playlist: [],
        connected: false
    },
    methods: {
        toggleTheme: function() {
            let body = document.getElementById("body");
            if (body.className === "dark") {
                body.className = "";
                document.cookie = "";
            }
            else {
                body.className = "dark";
                document.cookie = "dark";
            }
        }
    }
});

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