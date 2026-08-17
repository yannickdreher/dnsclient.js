[![Tests](https://github.com/yannickdreher/dnsclient.js/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/yannickdreher/dnsclient.js/actions/workflows/tests.yml)
[![Latest Release](https://img.shields.io/github/v/release/yannickdreher/dnsclient.js?label=Latest%20Release&sort=semver)](https://github.com/yannickdreher/dnsclient.js/releases)
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
  - [`query(url, message, options?)`](#queryurl-message-options)
  - [`sign(message, keyName, secret, options?)` (TSIG)](#signmessage-keyname-secret-options-tsig)
  - [Internationalized domain names](#internationalized-domain-names)
  - [EDNS(0)](#edns0)
  - [`interpret(message)`](#interpretmessage)
- [Record data format](#record-data-format)
- [Supported record types](#supported-record-types)
- [Supported classes](#supported-classes)
- [Error handling](#error-handling)
- [Releases](#releases)
- [Testing](#testing)
- [License](#license)

## Features

- DNS-over-HTTPS (RFC 8484) — secure, modern DoH transport, with timeout and `AbortSignal` support
- 54 record codecs including modern (SVCB/HTTPS, CAA, TLSA, SSHFP, …) and legacy
- Full DNSSEC chain (DS, RRSIG, NSEC, DNSKEY, NSEC3, NSEC3PARAM, CDS, CDNSKEY, …)
- EDNS(0) OPT pseudo-record with option parsing (RFC 6891)
- RFC 2136 dynamic updates with a fluent `UpdateBuilder`
- RFC 2845 / RFC 8945 TSIG signing (HMAC-SHA1/256/384/512, WebCrypto)
- Automatic IDNA A-label conversion for internationalized names (RFC 5891)
- Bidirectional binary serialization (encode + decode, name compression)
- Hardened parser: compression-pointer loop protection, strict bounds and length checks
- Lossless — record types without a codec keep their raw rdata instead of being dropped
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
//       data: { preference: 10, exchange: "mail.example.com" } }
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

### `query(url, message, options?)`

POSTs an already-constructed `QueryMessage` or `UpdateMessage` to a DoH
endpoint and returns `{result, latency}`. The third argument is either a boolean
(`interpreted`, kept for backwards compatibility) or an options object:

| Option        | Description                                            |
|---------------|--------------------------------------------------------|
| `interpreted` | Post-process the result with `interpret()`             |
| `timeout`     | Abort the request after this many milliseconds         |
| `signal`      | An `AbortSignal` to cancel the request from outside    |
| `headers`     | Additional request headers, merged into the defaults   |

```javascript
const { result, latency } = await dnsclient.query(url, message, {
    interpreted: true,
    timeout: 5000,
    signal: controller.signal
});
```

```javascript
import * as dnsclient from 'dnsclient.js';

const message = new dnsclient.QueryMessage();
message.questions.push(
    new dnsclient.Question('dremaxx.de', dnsclient.TYPE.A, dnsclient.CLAZZ.IN));

const { result, latency } = await dnsclient.query(
    'https://dns.dremaxx.de/dns-query', message, true);
```

### `sign(message, keyName, secret, options?)` (TSIG)

Signs `message` in-place per RFC 2845 / RFC 8945 and appends the TSIG RR to
`message.additionals`. `secret` is a base64-encoded shared key. The MAC covers
the message as it will be sent — before the TSIG RR is appended and before
ARCOUNT is incremented — followed by the TSIG variables of RFC 2845 §3.4.2.

```javascript
const signed = await dnsclient.sign(message, 'mykey', 'RGFzSXN0RWluVGVzdA==');
const { result } = await dnsclient.query(url, signed);
```

| Option      | Default         | Description                                    |
|-------------|-----------------|------------------------------------------------|
| `algorithm` | `"hmac-sha256"` | One of the keys of `TSIG_ALGORITHMS`           |
| `fudge`     | `300`           | Permitted clock skew in seconds                |
| `timestamp` | now             | Signing time as a `BigInt` of epoch seconds    |

```javascript
const signed = await dnsclient.sign(message, 'mykey', secret, {
    algorithm: 'hmac-sha512' // hmac-sha1 | hmac-sha256 | hmac-sha384 | hmac-sha512
});
```

Key and algorithm names are lower-cased before hashing, which is the canonical
form the RFC requires. The high-level `UpdateBuilder.send({tsig})` does all of
this for you.

### Internationalized domain names

Names are converted to their IDNA A-label form before they go on the wire, so
Unicode names can be queried directly:

```javascript
await client.resolve('münchen.de', 'A'); // queried as xn--mnchen-3ya.de
```

The conversion is applied per label and only to labels containing non-ASCII
characters, so pure ASCII names are encoded byte-for-byte including their case —
underscore labels (`_dmarc`), wildcards (`*.example.com`) and 0x20-encoded names
are left untouched. Responses report names as they appear on the wire, i.e. in
A-label form.

### EDNS(0)

An OPT pseudo-record uses the class field for the accepted UDP payload size and
the TTL field for the extended rcode and flags, so those live on the record
rather than in the rdata:

```javascript
message.additionals.push(new dnsclient.Record(
    '.',                 // OPT always uses the root name
    dnsclient.TYPE.OPT,
    1232,                // class field: UDP payload size
    0,                   // ttl field: extended rcode and flags
    { options: [{ code: 10, data: '0123456789abcdef' }] } // COOKIE, hex encoded
));
```

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
| `MX`    | `{ preference: 10, exchange: "mail.example.com" }`                             |
| `TXT`   | `{ text: "v=spf1 ..." }`                                                     |
| `SRV`   | `{ priority, weight, port, target }`                                         |
| `CAA`   | `{ flags, tag, value }`                                                      |
| `HTTPS` | `{ priority, target, params: { 1: "...", 3: "01bb" } }` (numeric SvcParamKeys) |
| `SVCB`  | same shape as `HTTPS`                                                        |
| `RRSIG` | `{ typeCovered, algorithm, labels, originalTtl, expiration, inception, keyTag, signersName, signature }` |
| `NSEC`  | `{ nextDomain, typeBitmaps: ["A", "MX", "RRSIG"] }`                           |
| `NSEC3` | `{ algorithm, flags, iterations, salt, nextHashedOwnerName, typeBitmaps }`     |
| `CSYNC` | `{ serial, flags, typeBitmaps }`                                              |
| `DNSKEY`| `{ flag: "ZSK" \| "KSK" \| number, protocol, algorithm, publickey }`          |
| `OPT`   | `{ options: [{ code: 10, data: "0123456789abcdef" }] }` (EDNS(0), hex data)   |
| `KX`    | `{ preference, exchanger }`                                                   |
| `NID`   | `{ preference, nodeId }` — also `L32`/`L64`/`LP` with `locator32`/`locator64`/`fqdn` |
| `EUI48` | `{ address: "00-00-5e-00-53-2a" }` — also `EUI64`                             |

`typeBitmaps` holds record type names; codes without a mnemonic appear as
`TYPE<n>` so nothing is lost. Types for which the library has no dedicated codec
keep their rdata verbatim as a `Uint8Array` and are written back unchanged, so
every record round-trips losslessly.

**TSIG is the one exception** to the plain-object rule in spirit only: its fields
are `algorithm`, `timestamp` (`BigInt`), `fudge`, `mac` (`Uint8Array`),
`originalId`, `error` and `otherData` (`Uint8Array`).

A `TXT` record longer than 255 bytes is split into several character-strings on
serialization and rejoined on deserialization, so long DKIM and SPF records work
transparently. Splits are placed on UTF-8 boundaries.

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

### Identifiers & locators
| Type   | Code  | Description                        | RFC      |
|--------|-------|------------------------------------|----------|
| X25    | 19    | X.25 PSDN address                  | RFC 1183 |
| KX     | 36    | Key exchanger                      | RFC 2230 |
| NID    | 104   | Node identifier                    | RFC 6742 |
| L32    | 105   | 32-bit locator                     | RFC 6742 |
| L64    | 106   | 64-bit locator                     | RFC 6742 |
| LP     | 107   | Locator pointer                    | RFC 6742 |
| EUI48  | 108   | 48-bit MAC address                 | RFC 7043 |
| EUI64  | 109   | 64-bit MAC address                 | RFC 7043 |
| AVC    | 258   | Application visibility and control | Cisco    |

### Transaction & control
| Type   | Code  | Description                   | RFC      |
|--------|-------|-------------------------------|----------|
| NULL   | 10    | Arbitrary data                | RFC 1035 |
| OPT    | 41    | EDNS(0) pseudo-record         | RFC 6891 |
| TKEY   | 249   | Transaction key               | RFC 2930 |
| TSIG   | 250   | Transaction signature         | RFC 2845 |
| ANY    | 255   | Query for any record type     | RFC 1035 |
| TA     | 32768 | DNSSEC trust anchor           | —        |
| DLV    | 32769 | DNSSEC lookaside validation   | RFC 4431 |

Every code in `TYPE_NAMES` has a matching entry in `TYPE`, so types beyond the
ones listed above can be queried by code as well; their rdata is kept as raw
bytes.

## Supported classes

| Class | Code | Description       |
|-------|------|-------------------|
| IN    | 1    | Internet          |
| CS    | 2    | CSNET (obsolete)  |
| CH    | 3    | CHAOS             |
| HS    | 4    | Hesiod            |
| NONE  | 254  | QCLASS NONE       |
| ANY   | 255  | QCLASS ANY        |

## Error handling

The parser rejects malformed input rather than returning silently wrong data.
Expect an `Error` for a truncated message, an rdata length that does not match
the record type, a cyclic or out-of-range compression pointer, a name or label
that exceeds the RFC 1035 size limits, a malformed IP address, an invalid base64
or hex field, an unsupported opcode or an unsupported TSIG algorithm. A
`RangeError` is raised when a read would leave the bounds of the supplied buffer.

`DnsSerializer.deserialize()` accepts an `ArrayBuffer`, any typed array or a
`DataView` — including views that cover only part of a larger buffer, which is
what you need when a message arrives inside a DNS-over-TCP length-prefixed frame.

## Releases

Versions are derived automatically from [Conventional Commits](https://www.conventionalcommits.org/)
by [release-please](https://github.com/googleapis/release-please). Merging to
`main` updates a release pull request that bumps `package.json` and
`CHANGELOG.md`; merging *that* pull request creates the tag and the GitHub
release, and publishes to npm via OIDC trusted publishing.

| Commit subject                    | Result           |
|-----------------------------------|------------------|
| `fix: ...`                        | patch (1.1.0 → 1.1.1) |
| `feat: ...`                       | minor (1.1.0 → 1.2.0) |
| `feat!: ...` or a `BREAKING CHANGE:` footer | major (1.1.0 → 2.0.0) |
| `docs:`, `refactor:`, `test:`, `ci:`, `chore:` | no release |

Pull requests are squash-merged, so the pull request **title** becomes the
commit message on `main` and is what determines the version. A CI check enforces
the convention on it.

## Testing

```bash
npm test        # run the suite
npm run coverage # run it with a coverage report
```

The repository ships with 58 Jest suites and 536 tests covering serialization
and deserialization for every supported record type, the high-level `DnsClient` /
`UpdateBuilder` API (with mocked `fetch`), TSIG signing, IDNA conversion and the
parser's rejection of malformed input. Wire-format expectations are pinned
against the byte sequences from the relevant RFCs, and the TSIG MAC is
cross-checked against an independent HMAC computation. Coverage is 95% of
statements and 96% of functions in `dnsclient.js`.

## License

MIT — see [LICENSE](LICENSE).
