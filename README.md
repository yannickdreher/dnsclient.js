# dnsclient.js

`dnsclient.js` is a JavaScript library for performing DNS queries over HTTPS.
It supports various DNS record types and handles DNS response parsing, including name compression.

## Features

- Perform DNS queries over HTTPS
- Support for multiple DNS record types (A, NS, CNAME, SOA, MX, TXT, AAAA)
- Handles DNS response parsing and name compression

## Usage

```JavaScript
import * as DNS from './dnsclient.js';

const question = new DNS.Question(<domainname>, <type>, <class>);

try {
    const result = await DNS.query('https://<hostname>/dns-query', question);
    console.log(result);
} catch {
    console.log('Error in DNS query.');
}
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License. See the LICENSE file for details.