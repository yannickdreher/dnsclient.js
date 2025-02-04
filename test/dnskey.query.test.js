import * as dnsclient from '../src/dnsclient.js';

describe('Query type "DNSKEY" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.DNSKEY, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "DNSKEY"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('DNSKEY');
        });
    });

    test('Data has property "flag"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[0]).toHaveProperty("key", "flag");
        });
    });

    test('Data has property "protocol"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[1]).toHaveProperty("key", "protocol");
        });
    });

    test('Data has property "algorithm"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[2]).toHaveProperty("key", "algorithm");
        });
    });

    test('Data has property "publickey"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[3]).toHaveProperty("key", "publickey");
        });
    });

    test('Flag is "ZSK" or "KSK"', () => {
        result.message.answers.forEach(answer => {
            expect(['ZSK', 'KSK']).toContain(answer.data[0].value);
        })
    });

    test('Public keys are base64 strings', () => {
        result.message.answers.forEach(answer => {
            expect(() => atob(answer.data[3].value)).not.toThrow();
        });
    });
});