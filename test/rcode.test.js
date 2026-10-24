import * as dnsclient from '../dnsclient.js';

describe('RCODE_NAMES follows the IANA DNS RCODE registry', () => {
    const cases = [
        [0, "NOERROR"],
        [3, "NXDOMAIN"],
        [6, "YXDOMAIN"],
        [7, "YXRRSET"],
        [8, "NXRRSET"],
        [9, "NOTAUTH"],
        [10, "NOTZONE"],
        [11, "DSOTYPENI"],
        [16, "BADVERS"],
        [17, "BADKEY"],
        [18, "BADTIME"],
        [19, "BADMODE"],
        [20, "BADNAME"],
        [21, "BADALG"],
        [22, "BADTRUNC"],
        [23, "BADCOOKIE"]
    ];

    test.each(cases)('Expect rcode %i to be named %s', (code, name) => {
        expect(dnsclient.RCODE_NAMES[code]).toBe(name);
        expect(dnsclient.RCODE_BY_NAME[name]).toBe(code);
    });

    test('Expect the unassigned codes 12 to 15 to have no name', () => {
        for (const code of [12, 13, 14, 15]) {
            expect(dnsclient.RCODE_NAMES[code]).toBeUndefined();
        }
    });

    test('Expect a failed UPDATE prerequisite to be reported as NXRRSET', () => {
        const message = new dnsclient.UpdateMessage();
        message.flags.qr = 1;
        message.flags.rcode = 8;
        message.zones.push(new dnsclient.Zone("example.com"));

        const parsed = dnsclient.DnsSerializer.deserialize(dnsclient.DnsSerializer.serialize(message));

        expect(dnsclient.interpret(parsed).flags.rcode).toBe("NXRRSET");
    });
});
