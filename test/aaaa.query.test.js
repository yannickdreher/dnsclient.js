import * as dnsclient from '../src/dnsclient.js';
import net from "net";

test('Query type "AAAA" should return the correct IPv4 address', async () => {
    const question = new dnsclient.Question('dns.dremaxx.de', dnsclient.TYPE.AAAA, dnsclient.CLAZZ.IN);
    const result = await dnsclient.query('https://dns.dremaxx.de/dns-query', question);
    expect(result.message.flags).toHaveProperty("rcode", "NOERROR");
    expect(net.isIPv6(result.message.answers[0].data[0].value)).toBe(true);
});