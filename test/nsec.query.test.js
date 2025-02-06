import * as dnsclient from '../src/dnsclient.js';

describe('Query type "NSEC" should return the correct data', () => {
    let result;
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.NSEC, dnsclient.CLAZZ.IN);

    beforeAll(async () => {
        result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    });

    test('RCODE is "NOERROR"', () => {
        expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    });

    test('Record type of answers is "NSEC"', () => {
        result.message.answers.forEach(answer => {
            expect(answer.type).toBe('NSEC');
        });
    });
});