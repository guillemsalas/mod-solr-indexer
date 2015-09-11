var http = require("modules/http-utils"),
	log = require("vertx/container").logger,
	_ = require("libs/lodash");


function process_params(query) {
	var params = _.pick(query,"q","sort","start","rows","fq",'qf',"omitHeader");
	if (query.fl) {
		//keep compatibility with old solr instances
		params.fl = query.fl.join(",");
	}

	if (params.qf) {
		params.defType='edismax';
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

module.exports = function(request, reply) {
	var path = http.get_path("select",request.collection),
		params = process_params(request.query);

	if (log.isDebugEnabled()) {
		log.debug("Sending fetch request path="+path+" params="+JSON.stringify(params));
	}
	http.get(path,params,reply);
};