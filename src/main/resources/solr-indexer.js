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
			send_update(request, reply);
			break;
		case "search":
			fetch_results(request,reply);
			break;
		case "add":
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