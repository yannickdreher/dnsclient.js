import * as dnsclient from '../src/dnsclient.js';

describe('Query type "RRSIG" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.RRSIG, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "RRSIG"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('RRSIG');
        });
    });

    test('Data has property "typeCovered"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[0]).toHaveProperty("key", "typeCovered");
        });
    });

    test('Data has property "algorithm"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[1]).toHaveProperty("key", "algorithm");
        });
    });

    test('Data has property "labels"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[2]).toHaveProperty("key", "labels");
        });
    });

    test('Data has property "originalTtl"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[3]).toHaveProperty("key", "originalTtl");
        });
    });

    test('Data has property "expiration"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[4]).toHaveProperty("key", "expiration");
        });
    });

    test('Data has property "inception"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[5]).toHaveProperty("key", "inception");
        });
    });

    test('Data has property "keyTag"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[6]).toHaveProperty("key", "keyTag");
        });
    });

    test('Data has property "signersName"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[7]).toHaveProperty("key", "signersName");
        });
    });

    test('Data has property "signature"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.data[8]).toHaveProperty("key", "signature");
        });
    });
});