import * as dnsclient from '../src/dnsclient.js';

test('Query type "ANY" should return the correct rcode', async () => {
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.ANY, dnsclient.CLAZZ.IN);
    const result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    //console.dir(result, { depth: null });
    expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
});