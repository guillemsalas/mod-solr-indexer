var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	http = require("modules/http-utils");

module.exports = function(request, reply) {
	var update = _.pick(request.update,"add","delete","commit","optimize"),
		body = http.to_json_body(update),
		path = http.update_path(request.collection);
	if (log.isDebugEnabled()) {
		log.debug("Sendig update to solr: path="+path+" body="+body);
	}
	http.post(path,request.options,body,reply);
};