const { NodeSSH } = require('node-ssh')
const localScriptPath = `./remoteScript.py`;
const remoteScriptPath = `./remote/remoteScript.py`;

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
                        await fetch(`http://${this.address}:8080`);
                        loop = false;
                    } catch (err) {
                        loop = true;
                    }
                }
                this.emit('ready');
            });
        });
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
}