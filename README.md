Why This Repo Exists:

This is a node.js class that is meant to be used between a Raspberry Pi and a Lego Mindstorms EV3 running Ev3dev as its operating system.
I made this project because of some niche requirements and it's not really useful/meant for any other use.

I wanted to control an Ev3 over the internet along with some video streaming from a mounted camera,
but a Lego Mindstorms Ev3 does not have capable enough hardware or software support.
So I have delegated the majority of the networking and thinking to be done by a Raspberry pi 3B+

Since the Raspberry Pi will have to do the "thinking", I made this class as a way to communicate with the Ev3 from the Pi.

The code that runs on the EV3 is written in python because there is practically no node.js support for the Ev3 (I am more comfortable using node.js than python)

DISCLAIMER:
This module is really janky and I've only uploaded it so that other people can see what I'm up to. Use it at your own risk. I'm not responsible for any damage caused.

How To Use This Module:
To use this node.js module just clone this repo or download the repo as a zip file.
There is one required dependency, which is the ```node-ssh``` module.
To install it use the command ```npm install node-ssh```. Also check out its npmjs page at https://www.npmjs.com/package/node-ssh.

For examples on how to use the class, check ```main.js```
