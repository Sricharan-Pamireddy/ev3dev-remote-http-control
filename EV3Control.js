const { NodeSSH } = require('node-ssh')
const localScriptPath = `./remoteScript.py`;
const remoteScriptPath = `./remote/remoteScript.py`;
const pythonPort = 8080;

//Event Emitter Logic From https://javascript.plainenglish.io/building-a-simple-event-emitter-in-javascript-f82f68c214ad

module.exports = class EV3Control {
    constructor(address, port, username, password) {
        this.address = address;
        this.port = port;
        this.username = username;
        // password is not stored

        this.events = new Map();

        var ssh = new NodeSSH();
        ssh.connect({
            host: this.address,
            port: this.port,
            username: this.username,
            password: password
        }).then(() => {
            ssh.putFile(localScriptPath, remoteScriptPath).then(async () => {
                ssh.execCommand(`killall screen; screen -S server -dm python3 ${remoteScriptPath}`);
                // I know this loop is janky lol
                // It's to make sure that we know when the webserver is started on the Ev3
                var loop = true;
                while (loop) {
                    try {
                        await fetch(`http://${this.address}:${pythonPort}`);
                        loop = false;
                    } catch (err) {
                        loop = true;
                    }
                }
                await this.scanPorts();
                await this.resetAllMotors();
                this.emit('ready');
            });
        });

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