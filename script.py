true = True
false = False

import socketio

sio = socketio.Client()
sio.connect('http://localhost:8001')

@sio.event
def message(data):
    print("I got a message")

@sio.on('hello')
def on_hello(data):
    print("hello world")

    