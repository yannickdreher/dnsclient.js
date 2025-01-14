import * as dnsclient from '../src/dnsclient.js';

test('Query type "MX" should return the correct data', async () => {
    const question = new dnsclient.Question('dremaxx.de', dnsclient.TYPE.MX, dnsclient.CLAZZ.IN);
    const result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    //console.dir(result, { depth: null });
    expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    expect(result.message.answers[0].data[0]).toHaveProperty("key", "preference");
    expect(result.message.answers[0].data[0]).toHaveProperty("value", 10);
    expect(result.message.answers[0].data[1]).toHaveProperty("key", "exchange");
    expect(result.message.answers[0].data[1]).toHaveProperty("value", "dremaxx-de.mail.protection.outlook.com");
});