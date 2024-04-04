const EV3Control = require('./EV3Control');

var args = process.argv;
if (args.length < 6) {
  throw new Error(`Expecting at least 4 arguments!!!`);
}

args = args.slice(2);

// new EV3Control(address, port, username, password);
var bot = new EV3Control(args[0], args[1], args[2], args[3]);

bot.on('ready', async () => {
    var res = await fetch(`http://ev3dev.local:8080/bash/bHMgL2hvbWUvcm9ib3Q=`);
    console.log(res);
});