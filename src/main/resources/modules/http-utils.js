var _ = require("libs/lodash"),
	client = require("modules/http-client");


exports.to_query_string = function(params) {
	var keySerializer = _.curry(function(key,value) {
			return encodeURIComponent(key)+"="+encodeURIComponent(value);
		}),
		encode = function(value,key) {
			var serialize = keySerializer(key);
			return _.isArray(value) ?
						_.map(value,serialize).join("&")
						: serialize(value);
		};

	return _.map(params,encode).join("&");
};

exports.to_json_body = function(body) {
	var keySerializer = _.curry(function(key,value) {
			return JSON.stringify(key)+':'+JSON.stringify(value);
		}),
		encode = function(value,key) {
			var serialize = keySerializer(key);
			return _.isArray(value) ?
						_.map(value,serialize).join(",")
						: serialize(value);
		};

	return "{" + _.map(body,encode).join(",") + "}";
};

exports.get = function(path,params,callback) {
	var query = exports.to_query_string(params),
		uri = path + "?" + query;

	client.get(uri,callback).end();
};

exports.post = function(path,params,body,callback) {
	var query = exports.to_query_string(params),
		uri = path + "?" + query;

	client.post(uri,callback)
		.putHeader("Content-type","text/json")
		.chunked(true)
		.write(body)
		.end();
};

exports.get_path = function(action, collection) {
	var path = [config.path],
		col = collection == null ?
				config.defaultCollection
				: collection;

	if (collection)
		path.push(collection);

	path.push(action);

	return path.join("/");
};

exports.update_path = _.partial(exports.get_path,"update/json");