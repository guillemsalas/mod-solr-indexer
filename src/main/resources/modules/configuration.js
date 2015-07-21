var container = require("vertx/container"),
	_ = require("libs/lodash"),
	defaults = {
		host: 'localhost',
		port: 8983,
		path: '/solr',
		defaultCollection : "",
		keepalive: true,
		maxConnections: 10,
		address: 'gzzz.solrindexer',
	};

_.merge(exports,defaults,container.config);