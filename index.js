#!/usr/bin/env node

var http = require('http'),
	httpProxy = require('http-proxy'),
	find = require('lodash/find'),
	url = require('url'),
	path = require('path'),
	fs = require('fs'),
	mime = require('mime-types'),
	argv = require('minimist')(process.argv.slice(2));

// File from which proxy settings are read
var CONFIG_FILENAME = 'devproxy.json';

// Directory from which this script is called
var currentDirectory = process.cwd();

// Load the config
var proxyConfig = require(currentDirectory + '/' + CONFIG_FILENAME);

// Debug print paths
if(!argv.silent){
	console.log('Serving: ' + process.cwd() + '/' + proxyConfig.staticPath);
	for(var idx in proxyConfig.proxies){
		var proxy = proxyConfig.proxies[idx];
		var proxyFrom =  'http://localhost:' + proxyConfig.port +  proxy.path;
		var proxyTo = 'http://' + proxy.host + ':' + proxy.port + proxyConfig.contextPath + proxy.path;
		console.log(proxyFrom + ' -> ' + proxyTo);
	}
}

startProxy(proxyConfig.proxies, proxyConfig.port);

function handleLocalResource(request, response) {

	var uri = url.parse(request.url).pathname;

	// If the uri starts with the context, strip it
	if(uri.indexOf(proxyConfig.contextPath) == 0){
		uri = uri.substring(proxyConfig.contextPath.length);
	}

	var filename = path.join(process.cwd() + '/' + proxyConfig.staticPath, uri);
	fs.exists(filename, function(exists) {
		if(!exists) {
			response.writeHead(404, {'Content-Type' : 'text/plain'});
			response.write('404 Not Found\n');
			response.end();
			return;
		}

		if (fs.statSync(filename).isDirectory()){
			response.writeHead(302, {'Location' : 'http://' + request.headers.host + uri + proxyConfig.home});
			response.write('Moved\n');
			response.end();
			return;
		}

		fs.readFile(filename, 'binary', function(err, file) {
			if(err) {
				response.writeHead(500, {'Content-Type' : 'text/plain'});
				response.write(err + '\n');
				response.end();
				return;
			}

			var extention = path.extname(filename);
			var contentType = mime.contentType(extention);

			response.writeHead(200, {'Content-Type' : contentType});
			response.write(file, 'binary');
			response.end();
		});
	});
}

function startProxy(hostsMap, port) {
	var proxy = httpProxy.createProxyServer();

	var proxyServer = http.createServer(function (req, res) {
		req.headers.origin = 'http://' + req.headers.host;
		var target = getTarget(req, hostsMap);
		if(target == null){
			handleLocalResource(req, res);
		}
		else{
			var proxiedPath = 'http://' + target.host + ':' + target.port;
			req.url = proxyConfig.contextPath + req.url;
			proxy.web(req, res, { target : proxiedPath }, function (e) {
				console.log('ERROR in Request');
				console.log(e);
			});
		}


	});


	proxyServer.listen(port, function (err) {
		if (err) {
			console.log(err);
		}
		console.log('Proxy Server Listening at http://localhost:' + port);
	});

}

function getTarget(req, hostsMap) {
	var reqPath = req.url || '/';
	var actualHost = find(hostsMap, function(h) {
		return h.path ? reqPath.indexOf(h.path) == 0 : false;
	});
	return actualHost;
}
