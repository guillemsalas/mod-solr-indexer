var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	http = require("modules/http-utils");

var get_handler = _.curry(function(reply, response) {
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
});

module.exports = function(request, reply) {
	var body = JSON.stringify(request.documents),
		path = http.update_path(request.collection),
		handler = get_handler(reply);

	http.post(path,request.options,body,reply);
};