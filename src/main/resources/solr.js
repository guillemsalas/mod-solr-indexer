var eb = require('vertx/event_bus'),
	container = require("vertx/container"),
	console = require("vertx/console"),
	vertx = require("vertx"),
	_ = require("libs/lodash"),
	config = _.merge({
		host: 'localhost',
		port: '8983',
		path: '/solr',
		defaultCollection : "",
		keepalive: true,
		maxConnections: 10,
		address: 'gzzz.solrindexer',
	}, container.config),
	httpClient = (function() {
		var client = vertx.createHttpClient()
			.host(config.host)
			.port(config.port);
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
    var pairs = [],
		addPair = _.curry(function(key,value) {
			pairs.push(encodeURIComponent(key)+"="+encodeURIComponent(value));
		}),
		encode = function(value,key) {
			var attach = addPair(key);

			if (_.isArray(value)) {
				_.each(value,attach);
			} else {
				attach(value);
			}
		};
	_.each(params,encode);
	return pairs.join("&");
}

function collectionOrDefault(options) {
	return options.collection != null ? options.collection : config.defaultCollection;
}

function updateRequest(collection,params,replier) {
	var path = [config.path],
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

function sendUpdate(request, reply) {
	var body = serializeBatch(_.pick(request.update,"add","delete","commit","optimize")),
		collection = collectionOrDefault(request);
	
	updateRequest(collection, request.options, reply)
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

function getQueryParams(query) {
	var params = _.pick(query,"q","sort","start","rows","fq","omitHeader");
	if (query.fl) {
		//keep compatibility with old solr instances
		params.fl = query.fl.join(",");
	}

	if (query.facet) {
		params["facet"] = "on";
		if (query.facet.field) {
			params["facet.field"] = query.facet.field;
		}
		if (query.facet.query) {
			params["facet.query"] = query.facet.query;
		}
	}
	params.wt = "json";
	return encodeQueryParams(params);
}

function getSearchPath(collection) {
	var path = [config.path];
	if (collection) {
		path.push(collection);
	}
	path.push("select");
	return path.join("/");
}

function fetchResults(request,reply) {
	var collection = collectionOrDefault(request),
		params = getQueryParams(request.query),
		path = getSearchPath(collection),
		uri = path + "?" + params,
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
				reply(result);
			});
		};
	httpClient.getNow(uri,requestHandler);
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

eb.registerHandler(config.address, messageHandler);