import * as dnsclient from '../src/dnsclient.js';

describe('Message should be serialized correctly', () => {
    let message = new dnsclient.QueryMessage();
    message.questions.push(new dnsclient.Question("google.com", dnsclient.TYPE.A, dnsclient.CLAZZ.IN));
    message.qdcount  = message.questions.length;
    let response;
    
    beforeAll(async () => {
        response = await dnsclient.query("https://theo.dremaxx.de/dns-query", message);
    });

    test('Expect buffer length to be correct', () => {
        expect(response.result.flags.rcode).toBe(0);
    });
});