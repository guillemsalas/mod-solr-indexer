var eb = require('vertx/event_bus'),
	container = require("vertx/container"),
	console = require("vertx/console"),
	vertx = require("vertx"),
	_ = require("libs/lodash"),
	config = _.merge({
		solrHost: 'localhost',
		solrPort: '8983',
		solrPath: '/solr',
		defaultCollection : "",
		keepalive: true,
		maxConnections: 10,
		solrBusAddr: 'gzzz.solr-persistor',
	}, container.config),
	httpClient = (function() {
		var client = vertx.createHttpClient()
			.host(config.solrHost)
			.port(config.solrPort);
		return config.keepalive ?
					client.maxPoolSize(config.maxConnections) :
					client.keepalive(false);
	})();

function serializeBatch(json) {
	var rootKeys = _.map(json, function (value,name) {
		var toPartial = function(val) {
			return name+":"+JSON.stringify(val);
		};
		return _.isArray(value) ? _.map(value, toPartial) : toPartial(value);
	});
	return "{" + rootKeys.join(",") + "}";
}

function sendUpdate(batch, reply) {
	var path = [config.solrPath],
		collection = batch.collection || config.defaultCollection,
		resultHandler = function(response) {
			var result = {
				status : "ok"
			};
			if (response.statusCode() !== 200) {
				result.status = "error";
				result.message = response.statusCode() + ":" + response.statusMessage();
			}
			response.dataHandler(function(buff) {
				result.raw = buff.getString(0,buff.length());
				try {
					result.data = JSON.parse(result.raw);
				} catch(e) {
					if (result.status === "ok") {
						result.status = "error";
						result.message = e.message;
					}
				}
				reply(result);
			});
		},
		body = serializeBatch(_.pick(batch,"add","remove","commit","optimize"));

	if (collection) {
		path.push(collection);
	}
	path.push("update/json");
	httpClient.post(path.join("/"),resultHandler)
		.putHeader("Content-type","text/json")
		.chunked(true)
		.write(body)
		.end();
}

function fetchResults(query,reply) {
	reply({
		status : "error",
		message : "not implemented"
	});
}

function messageHandler(request,reply) {
	switch (request.action) {
		case "update":
			sendUpdate(request.update, reply);
			break;
		case "search":
			fecthResults(request.query,reply);
			break;
		default:
			reply({
				status : "error",
				message : "invalid request"
			});
	}
}

eb.registerHandler(config.solrBusAddr, messageHandler);