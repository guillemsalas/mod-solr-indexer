var _ = require("libs/lodash"),
	log = require("vertx/container").logger,
	http = require("modules/http-utils");

module.exports = function(request, reply) {
	var body = JSON.stringify(request.documents),
		path = http.update_path(request.collection);
	if (log.isDebugEnabled()) {
		log.debug("Sendig add to solr: path="+path+" body="+body);
	}
	http.post(path,request.options,body,reply);
};