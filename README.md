# dev-api-proxy
A api proxy for REST applications.

## Purpose
The purpose of this module is to provide a method to proxy api calls to your remove server while hosting static files from a local directory.
You could have a dev server hosting your api on `localhost:8080` serving `/users-api` `/banking-api` etc, while your `html, js, css` are locally available from your project directory. This is especially handing if you have something that builds your resources as you edit them (`gulp watch` eg.).

## Configuration
This modules uses a file called `devproxy.json` in the project directory for the config.

**contextPath** -
The context path on the remote server (usefull if it's not running on root `/`)

**port** -
Port the proxy should be listening on (default `8000`)

**home** -
Index page if root is hit (default `html/index.html`)

**proxies** -
List of API's to proxy

**proxies[n].host** -
Host to proxy to.

**proxies[n].port** -
Port to connect to on the remote host.

**proxies[n].path** -
Path of the local URL to math, and proxy. This is the important bit that is used to determine if this proxy should be used.
