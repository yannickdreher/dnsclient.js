[![Pipeline Status](https://gitlab.dremaxx.de/yannick/dnsclient.js/badges/main/pipeline.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/commits/main)
[![Latest Release](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/badges/release.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/releases)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/dnsclient.js/badge)](https://www.jsdelivr.com/package/npm/dnsclient.js)

# dnsclient.js

`dnsclient.js` is a JavaScript library for performing DNS queries over HTTPS.
It supports various DNS record types and handles DNS response parsing, including name compression.

## Features

- Perform DNS queries over HTTPS
- Support for multiple DNS record types (27+ types supported)
- Handles DNS response parsing and name compression
- Supports both serialization and deserialization
- Supports both DNS queries and DNS updates
- Full DNSSEC support (DS, DNSKEY, RRSIG, NSEC records)
- Modern security records (CAA, TLSA, SSHFP)
- Service discovery records (SRV, NAPTR)
- Legacy and obsolete record support for compatibility

## Supported DNS Record Types

### Core Internet Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| A        | 1    | IPv4 Address                            | RFC 1035|
| NS       | 2    | Name Server                             | RFC 1035|
| CNAME    | 5    | Canonical Name                          | RFC 1035|
| SOA      | 6    | Start of Authority                      | RFC 1035|
| PTR      | 12   | Pointer (Reverse DNS)                   | RFC 1035|
| HINFO    | 13   | Host Information                        | RFC 1035|
| MX       | 15   | Mail Exchange                           | RFC 1035|
| TXT      | 16   | Text Record                             | RFC 1035|
| AAAA     | 28   | IPv6 Address                            | RFC 3596|

### Mail System Records (Legacy)
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| MD       | 3    | Mail Domain (obsolete)                  | RFC 1035|
| MF       | 4    | Mail Forwarder (obsolete)               | RFC 1035|
| MB       | 7    | Mailbox Domain Name                     | RFC 1035|
| MG       | 8    | Mail Group Member                       | RFC 1035|
| MR       | 9    | Mail Rename Domain Name                 | RFC 1035|
| MINFO    | 14   | Mailbox Information                     | RFC 1035|

### Service and Network Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| WKS      | 11   | Well Known Service                      | RFC 1035|
| SRV      | 33   | Service Location                        | RFC 2782|
| NAPTR    | 35   | Name Authority Pointer                  | RFC 3403|
| AFSDB    | 18   | AFS Database Location                   | RFC 1183|

### DNSSEC Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| DS       | 43   | Delegation Signer                       | RFC 4034|
| RRSIG    | 46   | Resource Record Signature               | RFC 4034|
| NSEC     | 47   | Next Secure                             | RFC 4034|
| DNSKEY   | 48   | DNS Key                                 | RFC 4034|
| CDS      | 59   | Child DS                                | RFC 7344|
| CDNSKEY  | 60   | Child DNS Key                           | RFC 7344|

### Security and Authentication Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| CERT     | 37   | Certificate                             | RFC 4398|
| SSHFP    | 44   | SSH Fingerprint                         | RFC 4255|
| TLSA     | 52   | Transport Layer Security Authentication | RFC 6698|
| CAA      | 257  | Certificate Authority Authorization     | RFC 6844|

### Modern and Specialized Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| RP       | 17   | Responsible Person                      | RFC 1183|
| LOC      | 29   | Location Information                    | RFC 1876|
| DNAME    | 39   | Delegation Name                         | RFC 6672|
| SPF      | 99   | Sender Policy Framework                 | RFC 7208|
| URI      | 256  | Uniform Resource Identifier             | RFC 7553|

### Special Purpose Records
| Type     | Code | Description                              | RFC     |
|----------|------|------------------------------------------|---------|
| NULL     | 10   | Null Record (arbitrary data)           | RFC 1035|
| TSIG     | 250  | Transaction Signature                   | RFC 2845|
| ANY      | 255  | Query for any record type               | RFC 1035|

### Supported DNS Classes
| Class   | Code | Description                              |
|---------|------|------------------------------------------|
| IN      | 1    | Internet                                |
| CS      | 2    | CSNET (obsolete)                        |
| CH      | 3    | CHAOS                                   |
| HS      | 4    | Hesiod                                  |
| NONE    | 254  | QCLASS NONE                             |
| ANY     | 255  | QCLASS ANY                              |

## Installation

You can install `dnsclient.js` via npm:

```bash
npm install dnsclient.js
```
or load it from CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/dnsclient.js/dnsclient.min.js"></script>
```
or
```html
<script type="module"> import dnsclient.js from https://cdn.jsdelivr.net/npm/dnsclient.js/+esm </script>
```

## Usage
### DNS query
```javascript
import * as dnsclient from 'dnsclient.js';

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
import * as dnsclient from 'dnsclient.js';

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