const EV3Control = require('./EV3Control');

var args = process.argv;
if (args.length < 7) {
  throw new Error(`Expecting at least 7 arguments!!!`);
}

args = args.slice(2);

// new EV3Control(address, port, username, password, webServerPort);
var bot = new EV3Control(args[0], args[1], args[2], args[3], args[4]);

bot.on('ready', async () => {
    console.log(bot.listMotors());
    await bot.runDirectAllMotors();
    await bot.setMotorSpeeds([["A", 50], ["D", 50]]);
    await bot.setMotorSpeeds([["A", -50], ["D", -50]]);
    await bot.resetAllMotors();
});