mod-solr-indexer
================

Vert.x module to interact with solr server.

The aim of this project is to simplifly interactions with solr server by allowing to send commands throught the Vert.x Bus.

It uses the Solr JSON API to fetch/send data.

Module configuration options
----------------------------
This module have the following configuration options:

| Property          | Default value       |                                                                               |
| ----------------- | ------------------- | ----------------------------------------------------------------------------- |
| host              | "localhost"         | Hostname of the solr host                                                     |
| port              | 8983                | Port where solr is running                                                    |
| path              | "/solr"             | Base path to solr instance                                                    |
| defaultCollection | ""                  | Default collection/core to query                                              |
| keepalive         | true                | Use keepalive to maintain a pool of HTTP connections with solr                |
| maxConnections    | 10                  | Max number of connections in the pool. It is ignored if keepalive is disabled |
| address           | "gzzz.solrindexer"  | Vert.x Bus address where listen to requests                                   |

Note that this module only accepts a single solr host to interact with. In case you need to interact with multiple Solr instances, you should deploy multiple verticle instances with the correct configuration on each.
You can reuse the solrBusAddr and the EventBus will do the loadbalancing between instances.

Basic message properties
------------------------
All messages have the same shared structure:
```
{
	action : "update|search|add",
	collection : "collection1"
}
```

The action defines the operation to run against the solr server. The collection defines in wich collection/core we should send the operation.
If no collection is specified (any non string value), the defaultCollection will be used. Empty string will be respected as a collection when building the endpoint path.

Querying data
-------------
This operation is used to fetch data from the solr index. It accepts the [Solr Common Query Parameters][Solr Common Query Parameters]. It doesn't provide any specific helper for formatting this parameters, it just constructus the requests and sends back the results. I'm planning to provide a better framework for defining prefiltered/prefaced searchs, but for now it just sends the request back to the solr server.

For now it only support q, sort, start, rows, fq (filter query), fl (field list) qf (edismax boots) and facet search.

This can be a sample search action:
```
{
	action : "search",
	collection : "collection1",
	query : {
		q : "ipsum massa",
		fq : ["owner:33e363ce-b417-47a1-b6f3-cbf74cea096b", "tag:placerat"],
		qf: 'name^2',
		fl : ["id","name","description","tags"],
		facet : {
			field : ["tags"],
			query : [
						"rating:[* TO 20]",
						"rating:[20 TO 40]",
						"rating:[40 TO 60]",
						"rating:[60 TO 80]",
						"rating:[80 TO 100]"
					]
		}
		omitHeader: false,
		sort : "id asc",
		start : 20,
		rows : 20
	}
}
```

Adding/updating documents
-------------------------
This is a sample message to push documents into the Solr instance:
```
{
	action : "add",
	collection : "collection1",
	documents : [{
		"id":"9295bb0d-6914-454a-b412-d26485f2f792",
		"owner":"33e363ce-b417-47a1-b6f3-cbf74cea096b",
		"name":"productize multiplatform users",
		"description":"Ipsum elementum amet tortor. Vitae amet vitae sollicitudin facilisis dolor sagittis magna sed.",
		"rating" : 10,
		"tags":["lorem","dolor","quis","velit"]
	},{
		"id":"2246b960-e8fa-4df9-96ef-7689565de1eb",
		"owner":"4ddfeee5-0e33-4b2c-a547-c7bad85cd5e0",
		"name":"aggregate clicks-and-mortar networks",
		"description":"Ipsum scelerisque. Pulvinar id massa porttitor lacus vitae dolor adipiscing non tortor vel.",
		"rating" : 50,
		"tags":["placerat","massa","et","nunc","ante"]
	}],
	options : {
		commit : true,
		waitFlush : false
	}
}
```
The __documents__ array will be send to Solr using the [Solr 4 JSON API][UpdateJSON Solr4 Example].

The __options__ object contains any required query param to the update solr endpoint, like commit=true and waitFlush=false. See [Solr UpdateXmlMessages documentation][Solr Update Query] for more options.

Sending commands to Solr
------------------------
This operation is used to send multiple commands to the Solr instance. It will send a batch of operations to perform in the index using [Solr Update Commands][UpdateJSON Commands].

The main difference between Solr Update Command and the messages used in this module is how multiple add/delete operations are described. SolrJSON abuses the ability to add multiple keys with the same name in the same JSON object. This can't be passed throught the Vert.x Event Bus. So instead of repeating keys in the JSON object, you should send them in an array:
```
{
	action : "update",
	collection : "collection1",
	update : {
		add : [{
			doc : {
				"id":"a17e855a-b8f9-4c7d-b596-da6b1d82b801",
				"owner":"4ddfeee5-0e33-4b2c-a547-c7bad85cd5e0",
				"name": {
					"value": "grow back-end action-items",
					"boost" : 2.3
				},
				"description":"Amet amet pretium sagittis. Libero dolor amet odio dui convallis sollicitudin facilisis.",
				"rating" : 60,
				"tags":["sollicitudin","malesuada","vestibulum"]
			}
		},{
			"commitWithin": 5000,
			"overwrite": false,
			"boost": 3.45,
			"doc" : {
				"id":"86a7e38c-8bc6-4967-880c-10e50d7545bf",
				"owner":"33e363ce-b417-47a1-b6f3-cbf74cea096b",
				"name":"enhance seamless experiences",
				"description":"Tincidunt et nullam pulvinar ipsum orci massa consequat porta morbi.",
				"rating" : 50,
				"tags":["molestie","amet","odio"]
			}
		}],
		commit: {},
		optimize: { "waitFlush":false, "waitSearcher":false },
		delete: [
			{ id : "2246b960-e8fa-4df9-96ef-7689565de1eb" },
			{ query : "tags:placerat", commitWithin: 500 }
		]
	},
	options : {}
}
```
The __update__ key contains the JSON with all the commands interpreted by Solr.

The __options__ key contains any required query param.

TODO
====

This is a alpha version of this functionality and it just fits the needs of a small university project. Lots of improvements are pending:

* Improve general response formatting: error handling/reporting, response message structure

* Offer API as imported module an not just as event bus listener

* Allow upload of documents using buffer instead of on memory strings

* Parse results and stream them into buffer instead of on memory strings

* Increase query capabilites by implementing/ensuring compatibility of more solr query params

Any suggestion is welcome!

[Solr Common Query Parameters]: https://wiki.apache.org/solr/CommonQueryParameters
[UpdateJSON Solr4 Example]: https://wiki.apache.org/solr/UpdateJSON#Solr_4.0_Example
[Solr Update Query]: https://wiki.apache.org/solr/UpdateXmlMessages#Passing_commit_and_commitWithin_parameters_as_part_of_the_URL
[UpdateJSON Commands]: https://wiki.apache.org/solr/UpdateJSON#Update_Commands