[![Pipeline Status](https://gitlab.dremaxx.de/yannick/dnsclient.js/badges/main/pipeline.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/commits/main)
[![Latest Release](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/badges/release.svg)](https://gitlab.dremaxx.de/yannick/dnsclient.js/-/releases)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/dnsclient.js/badge)](https://www.jsdelivr.com/package/npm/dnsclient.js)

# dnsclient.js

A zero-dependency JavaScript library for DNS-over-HTTPS (DoH). Supports 50+
record types, full DNSSEC, RFC 2136 dynamic updates and RFC 2845 TSIG signing —
in the browser and in Node.js.

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [High-level API](#high-level-api)
  - [`new DnsClient(serverUrl)`](#new-dnsclientserverurl)
  - [`client.resolve(name, type?)`](#clientresolvename-type)
  - [`client.reverse(ip)`](#clientreverseip)
  - [`client.update(zone)` — `UpdateBuilder`](#clientupdatezone--updatebuilder)
- [Low-level API](#low-level-api)
  - [`query(url, message, interpreted?)`](#queryurl-message-interpreted)
  - [`sign(message, keyName, secret)` (TSIG)](#signmessage-keyname-secret-tsig)
  - [`interpret(message)`](#interpretmessage)
- [Record data format](#record-data-format)
- [Supported record types](#supported-record-types)
- [Supported classes](#supported-classes)
- [Testing](#testing)
- [License](#license)

## Features

- DNS-over-HTTPS (RFC 8484) — secure, modern DoH transport
- 50+ record types including modern (SVCB/HTTPS, CAA, TLSA, SSHFP, …) and legacy
- Full DNSSEC chain (DS, RRSIG, NSEC, DNSKEY, NSEC3, NSEC3PARAM, CDS, CDNSKEY, …)
- RFC 2136 dynamic updates with a fluent `UpdateBuilder`
- RFC 2845 TSIG signing (HMAC-SHA256, WebCrypto)
- Bidirectional binary serialization (encode + decode, name compression)
- Plain-object rdata (`{ipv4: "1.2.3.4"}`) — no proprietary key/value arrays
- Zero runtime dependencies; works in browsers and Node.js

## Installation

npm:

```bash
npm install dnsclient.js
```

CDN (UMD):

```html
<script src="https://cdn.jsdelivr.net/npm/dnsclient.js/dnsclient.min.js"></script>
```

CDN (ESM):

```html
<script type="module">
  import * as dnsclient from 'https://cdn.jsdelivr.net/npm/dnsclient.js/+esm';
</script>
```

## Quick start

```javascript
import { DnsClient } from 'dnsclient.js';

const client = new DnsClient('https://dns.dremaxx.de/dns-query');

const res = await client.resolve('dremaxx.de', 'A');
console.log(res.answers[0].data.ipv4); // "5.75.173.96"
```

## High-level API

The recommended entry point is the `DnsClient` class. It returns user-friendly
objects with named record types and plain-object rdata.

### `new DnsClient(serverUrl)`

Creates a client bound to a DoH endpoint URL.

```javascript
const client = new DnsClient('https://cloudflare-dns.com/dns-query');
```

### `client.resolve(name, type?)`

Performs a forward lookup. `type` may be a string (`"A"`, `"AAAA"`, `"MX"`, …)
or a numeric `TYPE.*` constant. Defaults to `"A"`.

```javascript
const res = await client.resolve('example.com', 'MX');
// {
//   id: 12345,
//   rcode: "NOERROR",
//   question:  { name: "example.com", type: "MX", class: "IN" },
//   questions: [ ... ],
//   answers: [
//     { name: "example.com", type: "MX", class: "IN", ttl: 3600,
//       data: { priority: 10, exchange: "mail.example.com" } }
//   ],
//   authorities:  [ ... ],
//   additionals:  [ ... ],
//   latency: 23
// }
```

### `client.reverse(ip)`

Reverse-lookup for an IPv4 or IPv6 address. Builds the correct
`in-addr.arpa` / `ip6.arpa` name and issues a PTR query.

```javascript
await client.reverse('93.184.216.34');     // 34.216.184.93.in-addr.arpa
await client.reverse('2001:db8::1');        // ...ip6.arpa
```

### `client.update(zone)` — `UpdateBuilder`

Returns a fluent builder for RFC 2136 dynamic UPDATE messages.

```javascript
import { DnsClient } from 'dnsclient.js';

const client = new DnsClient('https://dns.dremaxx.de/dns-query');

const { result } = await client.update('dremaxx.de')
    .requireAbsent('test.dremaxx.de', 'A')
    .add('test.dremaxx.de', 'A', { ipv4: '192.0.2.3' }, 60)
    .send({ tsig: { name: 'mykey', secret: 'RGFzSXN0RWluVGVzdA==' } });
```

`UpdateBuilder` methods (all chainable, all return `this`):

| Method                                | Effect (RFC 2136)                                     |
|---------------------------------------|-------------------------------------------------------|
| `.add(name, type, data, ttl=300)`     | Add an RR (`CLASS=IN`)                                |
| `.delete(name)`                       | Delete all RRsets at `name` (`CLASS=ANY`, `TYPE=ANY`) |
| `.delete(name, type)`                 | Delete the entire RRset of `type` (`CLASS=ANY`)       |
| `.delete(name, type, data)`           | Delete one specific RR (`CLASS=NONE`)                 |
| `.replace(name, type, data, ttl=300)` | Atomic delete-RRset + add                             |
| `.requirePresent(name, type?)`        | Prerequisite: name (and type) MUST exist              |
| `.requireAbsent(name, type?)`         | Prerequisite: name (and type) MUST NOT exist          |
| `.send({tsig?})`                      | POST the message; optionally TSIG-sign it first       |
| `.toMessage()`                        | Get the raw underlying `UpdateMessage`                |

## Low-level API

Use these when you need full control over the wire format (e.g. custom
transports, manual message construction, debugging).

### `query(url, message, interpreted?)`

POSTs an already-constructed `QueryMessage` or `UpdateMessage` to a DoH
endpoint and returns `{result, latency}`. With `interpreted = true` the result
is post-processed by `interpret()`.

```javascript
import * as dnsclient from 'dnsclient.js';

const message = new dnsclient.QueryMessage();
message.questions.push(
    new dnsclient.Question('dremaxx.de', dnsclient.TYPE.A, dnsclient.CLAZZ.IN));

const { result, latency } = await dnsclient.query(
    'https://dns.dremaxx.de/dns-query', message, true);
```

### `sign(message, keyName, secret)` (TSIG)

Signs `message` in-place per RFC 2845 with HMAC-SHA256 and appends the TSIG RR
to `message.additionals`. `secret` is a base64-encoded shared key.

```javascript
const signed = await dnsclient.sign(message, 'mykey', 'RGFzSXN0RWluVGVzdA==');
const { result } = await dnsclient.query(url, signed);
```

The high-level `UpdateBuilder.send({tsig})` does this for you.

### `interpret(message)`

Replaces numeric type/class/opcode/rcode codes with their canonical names
(`"A"`, `"IN"`, `"QUERY"`, `"NOERROR"`, …). Useful for human-readable logging.

## Record data format

`record.data` is always a plain object whose keys are the named fields of the
RR type. Examples:

| Type    | `record.data` shape                                                          |
|---------|------------------------------------------------------------------------------|
| `A`     | `{ ipv4: "1.2.3.4" }`                                                        |
| `AAAA`  | `{ ipv6: "2001:db8::1" }`                                                    |
| `MX`    | `{ priority: 10, exchange: "mail.example.com" }`                             |
| `TXT`   | `{ text: "v=spf1 ..." }`                                                     |
| `SRV`   | `{ priority, weight, port, target }`                                         |
| `CAA`   | `{ flags, tag, value }`                                                      |
| `HTTPS` | `{ priority, target, params: { 1: "...", 3: "01bb" } }` (numeric SvcParamKeys) |
| `SVCB`  | same shape as `HTTPS`                                                        |
| `RRSIG` | `{ typeCovered, algorithm, labels, originalTtl, expiration, inception, keyTag, signersName, signature }` |

See [`test/*.serialization.test.js`](test/) for the exact shape of every
supported record type.

## Supported record types

### Core internet records
| Type   | Code | Description           | RFC      |
|--------|------|-----------------------|----------|
| A      | 1    | IPv4 address          | RFC 1035 |
| NS     | 2    | Name server           | RFC 1035 |
| CNAME  | 5    | Canonical name        | RFC 1035 |
| SOA    | 6    | Start of authority    | RFC 1035 |
| PTR    | 12   | Pointer (reverse DNS) | RFC 1035 |
| HINFO  | 13   | Host information      | RFC 1035 |
| MX     | 15   | Mail exchange         | RFC 1035 |
| TXT    | 16   | Text                  | RFC 1035 |
| AAAA   | 28   | IPv6 address          | RFC 3596 |

### Mail (legacy)
| Type   | Code | Description               | RFC      |
|--------|------|---------------------------|----------|
| MD     | 3    | Mail domain (obsolete)    | RFC 1035 |
| MF     | 4    | Mail forwarder (obsolete) | RFC 1035 |
| MB     | 7    | Mailbox domain            | RFC 1035 |
| MG     | 8    | Mail group member         | RFC 1035 |
| MR     | 9    | Mail rename               | RFC 1035 |
| MINFO  | 14   | Mailbox information       | RFC 1035 |

### Service & network
| Type   | Code | Description            | RFC      |
|--------|------|------------------------|----------|
| WKS    | 11   | Well known service     | RFC 1035 |
| AFSDB  | 18   | AFS database           | RFC 1183 |
| SRV    | 33   | Service location       | RFC 2782 |
| NAPTR  | 35   | Name authority pointer | RFC 3403 |
| SVCB   | 64   | Service binding        | RFC 9460 |
| HTTPS  | 65   | HTTPS service binding  | RFC 9460 |

### DNSSEC
| Type       | Code | Description               | RFC      |
|------------|------|---------------------------|----------|
| DS         | 43   | Delegation signer         | RFC 4034 |
| RRSIG      | 46   | Resource record signature | RFC 4034 |
| NSEC       | 47   | Next secure               | RFC 4034 |
| DNSKEY     | 48   | DNS key                   | RFC 4034 |
| NSEC3      | 50   | Next secure v3            | RFC 5155 |
| NSEC3PARAM | 51   | NSEC3 parameters          | RFC 5155 |
| CDS        | 59   | Child DS                  | RFC 7344 |
| CDNSKEY    | 60   | Child DNS key             | RFC 7344 |
| CSYNC      | 62   | Child-to-parent sync      | RFC 7477 |
| ZONEMD     | 63   | Zone message digest       | RFC 8976 |

### Security & authentication
| Type        | Code | Description                          | RFC      |
|-------------|------|--------------------------------------|----------|
| CERT        | 37   | Certificate                          | RFC 4398 |
| SSHFP       | 44   | SSH fingerprint                      | RFC 4255 |
| IPSECKEY    | 45   | IPsec key                            | RFC 4025 |
| TLSA        | 52   | TLS authentication                   | RFC 6698 |
| SMIMEA      | 53   | S/MIME certificate association       | RFC 8162 |
| OPENPGPKEY  | 61   | OpenPGP public key                   | RFC 7929 |
| CAA         | 257  | Certificate authority authorization  | RFC 6844 |

### Specialized
| Type   | Code | Description             | RFC      |
|--------|------|-------------------------|----------|
| RP     | 17   | Responsible person      | RFC 1183 |
| LOC    | 29   | Location                | RFC 1876 |
| DNAME  | 39   | Delegation name         | RFC 6672 |
| DHCID  | 49   | DHCP identifier         | RFC 4701 |
| SPF    | 99   | Sender policy framework | RFC 7208 |
| URI    | 256  | Uniform resource id     | RFC 7553 |

### Transaction & control
| Type   | Code | Description               | RFC      |
|--------|------|---------------------------|----------|
| TKEY   | 249  | Transaction key           | RFC 2930 |
| TSIG   | 250  | Transaction signature     | RFC 2845 |
| NULL   | 10   | Arbitrary data            | RFC 1035 |
| ANY    | 255  | Query for any record type | RFC 1035 |

## Supported classes

| Class | Code | Description       |
|-------|------|-------------------|
| IN    | 1    | Internet          |
| CS    | 2    | CSNET (obsolete)  |
| CH    | 3    | CHAOS             |
| HS    | 4    | Hesiod            |
| NONE  | 254  | QCLASS NONE       |
| ANY   | 255  | QCLASS ANY        |

## Testing

```bash
npm test
```

The repository ships with 46 Jest test suites covering serialization /
deserialization for every supported record type, the high-level `DnsClient` /
`UpdateBuilder` API (with mocked `fetch`) and TSIG signing.

## License

MIT — see [LICENSE](LICENSE).
