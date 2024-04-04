print("Starting Robot")

import logging
import os

true = True
false = False

motor_path = "/sys/class/tacho-motor/"

import subprocess
import base64

def handle_command(path):
  command = path.split('/')
  if (len(command) == 3 and command[1] == "bash"):
    coded = command[2]
    print(coded)
    decoded = base64.b64decode(coded.encode("ascii")).decode("ascii")
    print(decoded)
    args_split = decoded.split(" ")
    args = ""
    for i in args_split:
      if (i != args_split[0]):
        args += i + " "
    args = args.rstrip()
    #output = subprocess.run([args_split[0], args])
    output = os.popen(decoded).read()
    print(output)
    return output
  if (len(command) == 3 and command[1] == "motor_exists"):
    if (motor_exists(command[2]) != false):
      return "true"
    else:
      return "false"
  if (len(command) == 4 and command[1] == "set_motor_speed"):
    if (motor_exists(command[2]) != false):
      set_motor_speed(command[2], command[3])
      return "success"
  return ""

#
# Code from @mdonkers
# Source: https://gist.github.com/mdonkers/63e115cc0c79b4f6b8b3a6b797e485c7
#

from http.server import BaseHTTPRequestHandler, HTTPServer

class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        self._set_response()
        self.wfile.write(format(handle_command(self.path)).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself
        logging.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                str(self.path), str(self.headers), post_data.decode('utf-8'))

        self._set_response()
        self.wfile.write("POST request for {}".format(self.path).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=S, port=8080):
    logging.basicConfig(level=logging.INFO)
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()