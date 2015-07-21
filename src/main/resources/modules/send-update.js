var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	http = require("modules/http-utils");

module.exports = function(request, reply) {
	var update = _.pick(request.update,"add","delete","commit","optimize"),
		body = http.to_json_body(update),
		path = http.update_path(request.collection),
		handler = get_handler(reply);

	http.post(path,request.options,body,reply);
};