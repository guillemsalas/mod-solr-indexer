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

function encodeQueryParams(o) {
    if (typeof o !== 'object') return '';
    var k, p = [];
    for (k in o) {
        if (o.hasOwnProperty(k)) {
            p.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k]));
        }
    }
    return p.join('&');
}

function collectionOrDefault(options) {
	return options.collection != null ? options.collection : config.defaultCollection;
}

function updateRequest(collection,params,replier) {
	var path = [config.solrPath],
		queryString = encodeQueryParams(params),
		resultHandler = function(response) {
			var result = {
				status : "ok"
			};
			if (response.statusCode() !== 200) {
				result.status = "error";
				result.message = response.statusCode() + ": " + response.statusMessage();
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
				replier(result);
			});
		};
	if (collection) {
		path.push(collection);
	}
	path.push("update/json");
	path = path.join("/");
	if (queryString) {
		path += "?" + queryString;
	}
	return httpClient.post(path,resultHandler)
					.putHeader("Content-type","text/json")
					.chunked(true);
}

function sendUpdate(batch, reply) {
	var body = serializeBatch(_.pick(batch.update,"add","delete","commit","optimize")),
		collection = collectionOrDefault(batch);
	
	updateRequest(collection, batch.queryParams, reply)
		.write(body)
		.end();
}

function saveBatch(request,reply) {
	var body = JSON.stringify(request.documents),
		collection = collectionOrDefault(request);
	
	updateRequest(collection,request.options,reply)
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
			sendUpdate(request, reply);
			break;
		case "search":
			fecthResults(request,reply);
			break;
		case "add":
			saveBatch(request,reply);
			break;
		default:
			reply({
				status : "error",
				message : "invalid request"
			});
	}
}

eb.registerHandler(config.solrBusAddr, messageHandler);