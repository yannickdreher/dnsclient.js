import * as dnsclient from '../src/dnsclient.js';
import net from "net";

describe('Query type "AAAA" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.AAAA, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "AAAA"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('AAAA');
        });
    });

    test('Data has property "ipv6"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[0]).toHaveProperty("key", "ipv6");
        });
    });

    test('Data value is valid IPv6', () => {
        result.message.answers.forEach(answer => {
            expect(net.isIPv6(answer.data[0].value)).toBe(true);
        });
    });
});