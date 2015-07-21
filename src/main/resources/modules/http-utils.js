var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	config =require("modules/configuration"),
	client = require("modules/http-client");

var query_string_key_serializer = _.curry(function(key,value) {
	return encodeURIComponent(key)+"="+encodeURIComponent(value);
});

var encode_query_param = function(value,key) {
	var serialize = query_string_key_serializer(key);
	return _.isArray(value) ?
				_.map(value,serialize).join("&")
				: serialize(value);
};

exports.to_query_string = function(params) {
	return _.map(params,encode_query_param).join("&");
};

var json_body_key_serializer = _.curry(function(key,value) {
	return JSON.stringify(key)+':'+JSON.stringify(value);
});

var encode_json_body_key = function(value,key) {
	var serialize = json_body_key_serializer(key);
	return _.isArray(value) ?
				_.map(value,serialize).join(",")
				: serialize(value);
};

exports.to_json_body = function(body) {
	return "{" + _.map(body,encode_json_body_key).join(",") + "}";
};

var get_handler = _.curry(function(reply, response) {
	var result = {
		status : "ok"
	};
	if (response.statusCode() !== 200) {
		result.status = "error";
		result.message = response.statusCode() + ": " + response.statusMessage();
	}
	response.dataHandler(function(buff) {
		log.info("dataHandler");
		var raw = buff.getString(0,buff.length());
		try {
			result.data = JSON.parse(result.raw);
		} catch(e) {
			if (result.status === "ok") {
				result.status = "error";
				result.message = e.message;
			} else {
				result.data = raw;
			}
		}

		if (result.status === "error") {
			log.warn("Solr server error. Status "+result.message);
		}
		reply(result);
	});
});

var get_exception_handler = _.curry(function(reply,err) {
	log.error("Failed to connect with solr", err);
	reply({
		status:"error",
		message: "can not connect to solr server"
	});
});

exports.get = function(path,params,callback) {
	var query = exports.to_query_string(params),
		uri = path + "?" + query;
		client.get(uri,get_handler(callback))
			.exceptionHandler(get_exception_handler(callback))
			.end();
};

exports.post = function(path,params,body,callback) {
	var query = exports.to_query_string(params),
		uri = path + "?" + query;

	client.post(uri,get_handler(callback))
		.putHeader("Content-type","text/json")
		.chunked(true)
		.write(body)
		.exceptionHandler(get_exception_handler(callback))
		.end();
};

exports.get_path = function(action, collection) {
	var path = [config.path],
		col = _.isString(collection) ?
				collection.trim()
				: config.defaultCollection;

	if (col !== "")
		path.push(col);

	path.push(action);

	return path.join("/");
};

exports.update_path = _.partial(exports.get_path,"update/json");