import * as dnsclient from '../src/dnsclient.min.js';
import net from "net";

describe('Query type "A" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.A, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "A"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('A');
        });
    });

    test('Data has property "ipv4"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[0]).toHaveProperty("key", "ipv4");
        });
    });

    test('Data value is valid IPv4', () => {
        result.message.answers.forEach(answer => {
            expect(net.isIPv4(answer.data[0].value)).toBe(true);
        });
    });
});