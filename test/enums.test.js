import * as dnsclient from '../dnsclient.js';

describe('The type tables are consistent with each other', () => {
    test('Expect every name in TYPE_NAMES to have an entry in TYPE', () => {
        const missing = Object.values(dnsclient.TYPE_NAMES).filter(name => dnsclient.TYPE[name] === undefined);

        expect(missing).toEqual([]);
    });

    test('Expect every entry in TYPE to use the code from TYPE_NAMES', () => {
        const mismatched = Object.entries(dnsclient.TYPE)
            .filter(([name, code]) => dnsclient.TYPE_NAMES[code] !== name)
            .map(([name, code]) => `${name}=${code}`);

        expect(mismatched).toEqual([]);
    });

    test('Expect TYPE_BY_NAME to invert TYPE_NAMES', () => {
        for (const [code, name] of Object.entries(dnsclient.TYPE_NAMES)) {
            expect(dnsclient.TYPE_BY_NAME[name]).toBe(Number(code));
        }
    });

    test('Expect OPT to be a known type', () => {
        expect(dnsclient.TYPE.OPT).toBe(41);
        expect(dnsclient.TYPE_NAMES[41]).toBe("OPT");
    });

    test('Expect the tables to be frozen', () => {
        expect(Object.isFrozen(dnsclient.TYPE)).toBe(true);
        expect(Object.isFrozen(dnsclient.TYPE_NAMES)).toBe(true);
        expect(Object.isFrozen(dnsclient.TYPE_BY_NAME)).toBe(true);
        expect(Object.isFrozen(dnsclient.CLAZZ)).toBe(true);
        expect(Object.isFrozen(dnsclient.CLASS_NAMES)).toBe(true);
        expect(Object.isFrozen(dnsclient.OPCODE)).toBe(true);
    });
});

describe('The class and opcode tables are consistent', () => {
    test('Expect every name in CLASS_NAMES to have an entry in CLAZZ', () => {
        for (const [code, name] of Object.entries(dnsclient.CLASS_NAMES)) {
            expect(dnsclient.CLAZZ[name]).toBe(Number(code));
        }
    });

    test('Expect every name in OPCODE_NAMES to have an entry in OPCODE', () => {
        for (const [code, name] of Object.entries(dnsclient.OPCODE_NAMES)) {
            expect(dnsclient.OPCODE[name]).toBe(Number(code));
        }
    });
});

describe('Every type with a codec is reachable from the dispatcher', () => {
    const codecs = Object.getOwnPropertyNames(dnsclient.DnsRecordSerializer)
        .filter(name => dnsclient.TYPE[name] !== undefined)
        .filter(name => typeof dnsclient.DnsRecordSerializer[name] === "object");

    test('Expect at least 50 record codecs to be present', () => {
        expect(codecs.length).toBeGreaterThanOrEqual(50);
    });

    test.each(codecs)('Expect the %s codec to expose serialize and deserialize', (name) => {
        expect(typeof dnsclient.DnsRecordSerializer[name].serialize).toBe("function");
        expect(typeof dnsclient.DnsRecordSerializer[name].deserialize).toBe("function");
    });

    test.each(codecs)('Expect serializeRData to route the %s type to its codec', (name) => {
        // An unrouted type falls into the default branch and reports that raw
        // bytes are required. Any other failure means the codec was reached and
        // merely rejected the deliberately empty rdata.
        const record = new dnsclient.Record("example.com", dnsclient.TYPE[name], dnsclient.CLAZZ.IN, 0, []);
        let reachedCodec = true;
        try {
            dnsclient.DnsRecordSerializer.serializeRData(record);
        } catch (error) {
            reachedCodec = !/pass raw bytes as a Uint8Array instead/.test(error.message);
        }

        expect(reachedCodec).toBe(true);
    });

    test.each(codecs)('Expect the deserialize dispatcher to route the %s type', (name) => {
        // Assert against the dispatcher directly: an unrouted type falls into the
        // default branch and yields the raw bytes verbatim, so a codec that is
        // wired up must produce something other than exactly those bytes.
        // Feeding a deliberately implausible rdata makes most codecs throw, which
        // is itself proof that the dispatcher reached them -- but an unrouted type
        // can never throw, so the two outcomes stay distinguishable.
        const rdata = new Uint8Array(24).fill(0x01);
        const view = new DataView(new Uint8Array([
            0x00,                                            // Name: root
            (dnsclient.TYPE[name] >> 8) & 0xff, dnsclient.TYPE[name] & 0xff,
            0x00, 0x01,                                      // Class: IN
            0x00, 0x00, 0x00, 0x00,                          // TTL
            0x00, rdata.length,                              // RDLENGTH
            ...rdata
        ]).buffer);

        let threw = false;
        let data;
        try {
            data = dnsclient.DnsRecordSerializer.deserialize(view, 0).record.data;
        } catch {
            threw = true;
        }

        // Either the codec rejected the bytes, or it parsed them into something
        // that is not the untouched raw buffer.
        const passedThroughRaw = !threw && data instanceof Uint8Array && data.length === rdata.length
            && Array.from(data).every(b => b === 0x01);
        expect(passedThroughRaw).toBe(false);
    });
});
