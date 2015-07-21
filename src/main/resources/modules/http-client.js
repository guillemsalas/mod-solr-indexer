var config = require("modules/configuration"),
	vertx = require("vertx"),
	client = vertx.createHttpClient()
			.host(config.host)
			.port(config.port);

module.exports = config.keepalive ?
					client.maxPoolSize(config.maxConnections) :
					client.keepalive(false);