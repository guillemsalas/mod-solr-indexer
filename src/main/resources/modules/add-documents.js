var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	http = require("modules/http-utils");

module.exports = function(request, reply) {
	var body = JSON.stringify(request.documents),
		path = http.update_path(request.collection);

	http.post(path,request.options,body,reply);
};