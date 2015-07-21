var config = require("modules/configuration"),
	http = require("modules/http-utils"),
	_ = require("libs/lodash");


function process_params(query) {
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
	return params;
}

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
	var path = http.get_path("select",request.collection),
		params = process_params(request.query),
		handler = get_handler(reply);

	http.get(path,params,handler);
};