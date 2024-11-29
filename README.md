# dnsclient.js

`dnsclient.js` is a JavaScript library for performing DNS queries over HTTPS.
It supports various DNS record types and handles DNS response parsing, including name compression.

## Features

- Perform DNS queries over HTTPS
- Support for multiple DNS record types (A, NS, CNAME, SOA, MX, TXT, AAAA)
- Handles DNS response parsing and name compression

## Installation

You can install `dnsclient.js` via npm:

```bash
npm install doh-client
```

## Usage

```JavaScript
import * as DNS from './dnsclient.js';

const question = new DNS.Question(<domainname>, DNS.TYPE.A, DNS.CLAZZ.IN);

try {
    const result = await DNS.query('https://<hostname>/dns-query', question);
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
    AAAA: 28
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

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.