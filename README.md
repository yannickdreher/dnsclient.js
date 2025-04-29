[![Pipeline Status](https://gitlab.dremaxx.de/yannick/dnsclient.js/badges/main/pipeline.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/commits/main)
[![Latest Release](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/badges/release.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/releases)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/dnsclient.js/badge)](https://www.jsdelivr.com/package/npm/dnsclient.js)

# dnsclient.js

`dnsclient.js` is a JavaScript library for performing DNS queries over HTTPS.
It supports various DNS record types and handles DNS response parsing, including name compression.

## Features

- Perform DNS queries over HTTPS
- Support for multiple DNS record types
- Handles DNS response parsing and name compression
- Supports both serialization and deserialization
- Supports both DNS queries and DNS updates
    - TSIG authentication is currently not yet supported or does not yet work

Available types:
| Type    | Code |
|---------|------|
| A       | 1    |
| NS      | 2    |
| CNAME   | 5    |
| SOA     | 6    |
| HINFO   | 13   |
| MX      | 15   |
| TXT     | 16   |
| AAAA    | 28   |
| SRV     | 33   |
| DS      | 43   |
| RRSIG   | 46   |
| NSEC    | 47   |
| DNSKEY  | 48   |
| CDS     | 59   |
| CDNSKEY | 60   |
| TSIG    | 250  |
| ANY     | 255  |

Available classes:
| Calss   | Code |
|---------|------|
| IN      | 1    |
| CS      | 2    |
| CH      | 3    |
| HS      | 4    |
| NONE    | 254  |
| ANY     | 255  |

## Installation

You can install `dnsclient.js` via npm:

```bash
npm install dnsclient.js
```
or load it from CDN:
```html
<script type="module"> import dnsclient from https://cdn.jsdelivr.net/npm/dnsclient.js/+esm </script>
```

## Usage
### DNS query
```javascript
import * as dnsclient from './dnsclient.min.js';

const message  = new dnsclient.QueryMessage();
const question = new dnsclient.Question("dremaxx.de", dnsclient.TYPE.A, dnsclient.CLAZZ.IN);
message.questions.push(question);

try {
    const response = await dnsclient.query("https://dns.dremaxx.de/dns-query", message);
    console.dir(response, {depth: null});
} catch (error) {
    console.log(error.message);
}
```
Optionally, you can also have the answer interpreted:
```javascript
const response = await dnsclient.query("https://dns.dremaxx.de/dns-query", message, true);
```
The answer to a query can look like this, for example:
```json
{
    "result": {
        "id": 46279,
        "flags": {
            "qr": 1,
            "opcode": 0,
            "aa": true,
            "tc": false,
            "rd": true,
            "ra": true,
            "rcode": 0
        },
        "qdcount": 1,
        "ancount": 1,
        "nscount": 0,
        "arcount": 0,
        "questions": [
            {
                "name": "dremaxx.de",
                "type": 1,
                "clazz": 1
            }
        ],
        "answers": [
            {
                "name": "dremaxx.de",
                "type": 1,
                "clazz": 1,
                "ttl": 3600,
                "data": [
                    {
                        "key": "ipv4",
                        "value": "5.75.173.96"
                    }
                ]
            }
        ],
        "authorities": [],
        "additionals": []
    },
    "latency": 49
}
```
An interpreted answer can look like this, for example:
```json
{
    "result": {
        "id": 20538,
        "flags": {
            "qr": "RESPONSE",
            "opcode": "QUERY",
            "aa": true,
            "tc": false,
            "rd": true,
            "ra": true,
            "rcode": "NOERROR"
        },
        "qdcount": 1,
        "ancount": 1,
        "nscount": 0,
        "arcount": 0,
        "questions": [
            {
                "name": "dremaxx.de",
                "type": "A",
                "clazz": "IN"
            }
        ],
        "answers": [
            {
                "name": "dremaxx.de",
                "type": "A",
                "clazz": "IN",
                "ttl": 3600,
                "data": [
                    {
                        "key": "ipv4",
                        "value": "5.75.173.96"
                    }
                ]
            }
        ],
        "authorities": [],
        "additionals": []
    },
    "latency": 31
}
```
### DNS update
```javascript
import * as dnsclient from './dnsclient.min.js';

const message = new dnsclient.UpdateMessage();
const zone = new dnsclient.Zone("dremaxx.de");
const preq = new dnsclient.Record("test.dremaxx.de", dnsclient.TYPE.A, dnsclient.CLAZZ.ANY, 0);
const update_del = new dnsclient.Record("test.dremaxx.de", dnsclient.TYPE.A, dnsclient.CLAZZ.ANY, 0);
const update_new = new dnsclient.Record("test.dremaxx.de", dnsclient.TYPE.A, dnsclient.CLAZZ.IN, 60, [{key: "ipv4", value: "192.0.2.3"}]);

message.zones.push(zone);
message.prerequisites.push(preq);
message.updates.push(update_del);
message.updates.push(update_new);

try {
    const response = await dnsclient.query("https://dns.dremaxx.de/dns-query", message);
    console.dir(response, {depth: null});
} catch (error) {
    console.log(error.message);
}
```