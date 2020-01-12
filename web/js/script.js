function toSeconds(str) {
    var p = str.split(':'),
        s = 0, m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}
function toHms(totalSeconds) {
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    minutes = Math.floor(totalSeconds / 60);
    seconds = totalSeconds % 60;
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    let res = '';
    if (hours > 0) {
        res += hours + ':';
    }
    return res + minutes + ':' + seconds;
}
function setAndSave(object, key, value) {
    object[key] = value;
    localStorage.setItem(key, value);
}
function toggleBool(object, key) {
    setAndSave(object, key, !object[key]);
}
function loadSavedBool(key) {
    let item = localStorage.getItem(key);
    return item === null ? undefined : item === 'true';
}
function copy(text) {
    var textArea = document.createElement("textarea");
    textArea.setAttribute("style", "position: fixed; top: 0; left: 0; width: 2em; height: 2em; padding: 0; border: none; outline: none; background: transparent");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch {}
    document.body.removeChild(textArea);
}

Vue.component('songlist', {
    props: ['songlist', 'title', 'show-index', 'show-after', 'show-requester', 'show-duration', 'negative-index', 'zero-index'],
    methods: {
        trimString: function (str) {
            if (str.length > 10) {
                str = str.substring(0, 9) + '…';
            }
            return str;
        },
        sumPreviousTimes: function(index, object) {
            let result = 0;
            for (let i = 0; i < index ; i++) {
                result += this.toSeconds(object[i].duration);
            }
            return this.toHms(result);
        },
        copy: copy,
        toSeconds: toSeconds,
        toHms: toHms
    },
    template: `
    <div style="overflow-x: auto">
        <table>
            <thead>
                <tr>
                    <th colspan=5><p style="font-size: 1.25rem">{{ title }}</p></th>
                </tr>
                <tr>
                    <th v-if="showIndex" style="width: 40px"><p>№</p></th>
                    <th><p>Name</p></th>
                    <th v-if="showRequester" style="width: 100px"><p>Requester</p></th>
                    <th v-if="showAfter" style="width: 80px"><p>After</p></th>
                    <th v-if="showDuration" style="width: 80px"><p>Duration</p></th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="songlist.length > 0" v-for="(song, index) in songlist">
                    <td v-if="showIndex"><a @click="copy(song.song)" :title="'Copy ' + song.song + ' to clipboard'">{{ zeroIndex ? '0' : (negativeIndex ? '-' + (index + 1) : index + 1) }}</a></td>
                    <td><a :href="'https://youtu.be/'+song.song" target="_blank">{{ song.title }}</a></td>
                    <td v-if="showRequester"><a :href="'https://twitch.tv/' + song.requester" :title="song.requester" target="_blank">{{ song.requester ? trimString(song.requester) : "-" }}</a></td>
                    <td v-if="showAfter"><p>{{ sumPreviousTimes(index, songlist) }}</p></td>
                    <td v-if="showDuration"><p>{{ toHms(toSeconds(song.duration)) }}</p></td>
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
        isConnected: false,
        showPlayer: false,
        showAfter: false,
        showDuration: true,
        showIndex: true,
        showRequester: true
    },
    methods: {
        toggleBool: toggleBool,
        loadSavedBool: loadSavedBool,
        toggleDarkTheme: function() {
            let body = document.getElementById("body");
            this.toggleBool(this, 'darkTheme');
            body.className = this.loadSavedBool('darkTheme') ? 'dark' : '';
        },
        toggleShowPlayer: function() { this.toggleBool(this, 'showPlayer') },
        toggleShowAfter: function () { this.toggleBool(this, 'showAfter') },
        toggleShowIndex: function () { this.toggleBool(this, 'showIndex') },
        toggleShowRequester: function () { this.toggleBool(this, 'showRequester') },
        toggleShowDuration: function () { this.toggleBool(this, 'showDuration') }
    }
});

if (loadSavedBool("darkTheme"))
    document.getElementById("body").className =  'dark';
if (loadSavedBool("showPlayer") !== undefined)
    vue.showPlayer = loadSavedBool("showPlayer");
if (loadSavedBool("showAfter") !== undefined)
    vue.showAfter = loadSavedBool("showAfter");
if (loadSavedBool("showDuration") !== undefined)
    vue.showDuration = loadSavedBool("showDuration");
if (loadSavedBool("showRequester") !== undefined)
    vue.showRequester = loadSavedBool("showRequester");
if (loadSavedBool("showIndex") !== undefined)
    vue.showIndex = loadSavedBool("showIndex");

let socket = io(window.location.host);

socket.on("connect", () => {
    console.log("Socket connected!")
    socket.emit("wow");
    setInterval(() => {
        socket.emit("wow");
    }, 10000)
    vue.isConnected = true;
})

socket.on("disconnect", () => {
    console.log("Socket disconnected!");
    vue.isConnected = false;
});

socket.on("currentsong", data => vue.currentsong = data);
socket.on("songlist", data => vue.songlist = data);
socket.on("playlist", data => vue.playlist = data);
socket.on("history", data => vue.history = data);