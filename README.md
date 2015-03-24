mod-solr-indexer
================

Vert.x module to interact with solr server.

The aim of this project is to simplifly interactions with solr server by allowing to send commands throught the Vert.x Bus.

It uses the Solr JSON API to fetch/send data.

Module configuration options
----------------------------
This module have the following configuration options:

| Property          | Default value     |                                                                               |
| ----------------- | ----------------- | ----------------------------------------------------------------------------- |
| solrHost          | localhost         | Hostname of the solr host                                                     |
| solrPort          | 8983              | Port where solr is running                                                    |
| solrPath          | /solr             | Base path to solr instance                                                    |
| defaultCollection | ""                | Default collection to query                                                   |
| keepalive         | true              | Use keepalive to maintain a pool of HTTP connections with solr                |
| maxConnections    | 10                | Max number of connections in the pool. It is ignored if keepalive is disabled |
| solrBusAddr       | gzzz.solr-indexer | Vert.x Bus address where listen to requests                                   |

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

The action defines the operation to run against the solr server. The collection defines in wich collection we should send the operation.
If no operation is specified (null or undefined), the defaultCollection will be used.

Querying data
-------------
This operation is used to fetch data from the solr index.

Adding/updating documents
-------------------------
This operations will post an array of documents to the Solr index.

Batch operations
----------------
This operation is used to perform batch updates to the solr index.