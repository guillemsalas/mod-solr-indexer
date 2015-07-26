var eb = require('vertx/event_bus'),
	container = require("vertx/container"),
	log = container.logger,
	config = require("modules/configuration"),
	fetch_results = require("modules/fetch-results"),
	add_documents = require("modules/add-documents"),
	send_update = require("modules/send-update");


function message_handler(request,reply) {
	switch (request.action) {
		case "update":
			if (log.isDebugEnabled()) {
				log.debug("Recevied update request: "+JSON.stringify(request));
			}
			send_update(request, reply);
			break;
		case "search":
			if (log.isDebugEnabled()) {
				log.debug("Recevied search request: "+JSON.stringify(request));
			}
			fetch_results(request,reply);
			break;
		case "add":
			if (log.isDebugEnabled()) {
				log.debug("Recevied add request: "+JSON.stringify(request));
			}
			add_documents(request,reply);
			break;
		default:
			log.warn("Invalid request received: "+JSON.stringify(request));
			reply({
				status : "error",
				message : "invalid request"
			});
	}
}
eb.registerHandler(config.address, message_handler);
log.info("mod-solr-indexer listening on "+config.address);