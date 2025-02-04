[![Tests](https://github.com/yannickdreher/dnsclient.js/actions/workflows/tests.yml/badge.svg)](https://github.com/yannickdreher/dnsclient.js/actions/workflows/tests.yml)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/dnsclient.js/badge)](https://www.jsdelivr.com/package/npm/dnsclient.js)

# dnsclient.js

`dnsclient.js` is a JavaScript library for performing DNS queries over HTTPS.
It supports various DNS record types and handles DNS response parsing, including name compression.

## Features

- Perform DNS queries over HTTPS
- Support for multiple DNS record types (A, NS, CNAME, SOA, MX, TXT, AAAA, RSIG, DNSKEY, ANY)
- Handles DNS response parsing and name compression

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

```JavaScript
import * as DNS from './dnsclient.min.js';

const question = new DNS.Question(<domainname>, DNS.TYPE.A, DNS.CLAZZ.IN);

try {
    const result = await DNS.query('https://dns.dremaxx.de/dns-query', question);
    console.log(result);
} catch {
    console.log('Error in DNS query.');
}
```

Available types and classes:
```JavaScript
export const TYPE = Object.freeze({
    A: 1,
    NS: 2,
    CNAME: 5,
    SOA: 6,
    MX: 15,
    TXT: 16,
    AAAA: 28,
    RRSIG: 46,
    DNSKEY: 48,
    ANY: 255
});

export const CLAZZ = Object.freeze({
    IN: 1,
    CS: 2,
    CH: 3,
    HS: 4,
    NONE: 254,
    ANY: 255
})
```
The answer to a query can look like this, for example:
```Json
{
    "message": {
        "transactionID": 15136,
        "flags": {
            "qr": "RESPONSE",
            "opcode": "QUERY",
            "aa": 1,
            "tc": 0,
            "rd": 1,
            "ra": 1,
            "rcode": "NOERROR"
        },
        "qdcount": 1,
        "ancount": 1,
        "arcount": 0,
        "adcount": 0,
        "questions": [
            {
                "name": "dremaxx.de",
                "type": "SOA",
                "clazz": "IN"
            }
        ],
        "answers": [
            {
                "name": "dremaxx.de",
                "type": "SOA",
                "clazz": "IN",
                "ttl": 3600,
                "data": [
                    {
                        "key": "mname",
                        "value": "theo.dremaxx.de"
                    },
                    {
                        "key": "rname",
                        "value": "hostmaster.dremaxx.de"
                    },
                    {
                        "key": "serial",
                        "value": 2024112610
                    },
                    {
                        "key": "refresh",
                        "value": 3600
                    },
                    {
                        "key": "retry",
                        "value": 900
                    },
                    {
                        "key": "expire",
                        "value": 2419200
                    },
                    {
                        "key": "minimum",
                        "value": 3600
                    }
                ]
            }
        ]
    },
    "latency": 60
}
```
## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.