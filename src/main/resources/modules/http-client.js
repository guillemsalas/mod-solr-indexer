var config = require("modules/configuration"),
	vertx = require("vertx"),
	client = vertx.createHttpClient()
			.host(config.host)
			.port(config.port),
	log = require("vertx/container").logger;

log.info("Http client initialized to connect with solr at http://"+config.host+":"+config.port);

module.exports = config.keepalive ?
					client.maxPoolSize(config.maxConnections) :
					client.keepAlive(false);