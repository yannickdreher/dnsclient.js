import * as dnsclient from '../src/dnsclient.js';

describe('Query type "MX" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.MX, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "MX"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('MX');
        });
    });

    test('Data has property "preference"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[0]).toHaveProperty("key", "preference");
        });
    });

    test('Data has property "exchange"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[1]).toHaveProperty("key", "exchange");
        });
    });
});