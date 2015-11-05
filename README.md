Cache, Proxies, Queues
=========================

This is the fork of the Redis workshop repository provided in the class. I have included the Load Balancer proxy code in this repository under a separate file named `proxy-server.js`

The server runs at the `8090` port and redirects requests to the numerous main.js instances spawned at the time of startup. 

### Setup

* Clone this repo, run `npm install`.
* Install redis and run on localhost:6379
* Start the proxy server using the command `node proxy-server.js <number_of_servers>`
* Access the application from the URL `http://localhost:8090`

### Using Redis to determine target
The various URLs are pushed as a queue to the Redis store. When a request is sent to the application, the Redis stre is queried and the first value is popped off the queue and the request is redirected to that particular main.js instance.

### Screencast
