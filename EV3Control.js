const { NodeSSH } = require('node-ssh');
const localScriptPath = `${__dirname}/remoteScript.py`;
const remoteScriptPath = `./remote/remoteScript.py`;
const pythonPort = 8080;

//Event Emitter Logic From https://javascript.plainenglish.io/building-a-simple-event-emitter-in-javascript-f82f68c214ad

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get("/", (req, res) => {
    res.write(Date.now());
    res.end();
});

io.on('connection', function (socket) {
    console.log('A user connected');
    socket.emit("hello", "world", (msg) => {
        console.log(msg);
    });

    socket.on('disconnect', async function () {
        console.log(`A user disconnected`);
    });
});

// http.listen(port, function () {
//     console.log(`WebServer started on port ${port}`);
// });

module.exports = class EV3Control {
    constructor(address, port, username, password, webServerPort) {
        this.address = address;
        this.port = port;
        this.username = username;
        // password is not stored

        this.events = new Map();

        http.listen(webServerPort, function () {
            console.log(`WebServer started on port ${webServerPort}`);
        });

        var ssh = new NodeSSH();
        // ssh.connect({
        //     host: this.address,
        //     port: this.port,
        //     username: this.username,
        //     password: password
        // }).then(() => {
        //     ssh.putFile(localScriptPath, remoteScriptPath).then(async () => {
        //         ssh.execCommand(`killall screen; screen -S server -dm python3 ${remoteScriptPath}`);
        //     });
        // });

        this.motorCache = {};
        this.error = {
            MotorNotFound: new Error(`Motor Not Found In Motor Cache!!!`)
        };
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event).filter(cb => cb !== callback);
            this.events.set(event, callbacks);
        }
    }

    emit(event, ...data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                setTimeout(() => callback(...data), 0);
            });
        }
    }

    async command(str) {
        return new Promise(async (resolve) => {
            var encoded = btoa(str);
            var res = await fetch(`http://${this.address}:${pythonPort}/bash/${encoded}`);
            resolve(res.text());
        });
    }

    async resetAllMotors() {
        var str = "";
        for (var i in this.motorCache) {
            str += `echo reset > ${this.motorCache[i]}command; `;
        }
        await this.command(str);
    }

    async runDirectAllMotors() {
        var str = "";
        for (var i in this.motorCache) {
            str += `echo run-direct > ${this.motorCache[i]}command; `;
        }
        await this.command(str);
    }

    async setMotorSpeed(letter, speed) {
        return await this.setMotorSpeeds([[letter, speed]]);
    }

    async setMotorSpeeds(arr) {
        var str = ``;
        for (var i in arr) {
            var letter = arr[i][0];
            var speed = arr[i][1];
            if (this.motorCache[letter] == undefined) {
                throw this.error.MotorNotFound;
            }
            str += `echo ${speed} > ${this.motorCache[letter]}duty_cycle_sp; `;
        }
        await this.command(str);
    }

    async scanPorts() {
        var path = `/sys/class/tacho-motor/`;
        var list = await this.command(`ls ${path}`);
        list = list.split("\n");
        list.pop();

        for (var i in list) {
            var mpath = `${path}${list[i]}/`;
            var port = await this.command(`cat ${mpath}address`);
            port = port.trim();
            var letter = port.charAt(port.length - 1);
            this.motorCache[letter] = mpath;
        }
    }

    listMotors() {
        var list = [];
        for (var i in this.motorCache) list.push(i);
        return list;
    }
}