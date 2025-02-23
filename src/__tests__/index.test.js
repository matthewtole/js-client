const { default: LogEvent } = require('../LogEvent');
let statsig;

describe('Verify behavior of top level index functions', () => {
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          disableAutoEventLogging: true,
          gates: {
            'AoZS0F06Ub+W2ONx+94rPTS7MRxuxa+GnXro5Q1uaGY=': true,
          },
          feature_gates: {
            'AoZS0F06Ub+W2ONx+94rPTS7MRxuxa+GnXro5Q1uaGY=': {
              value: true,
              rule_id: 'ruleID123',
              name: 'AoZS0F06Ub+W2ONx+94rPTS7MRxuxa+GnXro5Q1uaGY=',
            },
          },
          dynamic_configs: {
            'RMv0YJlLOBe7cY7HgZ3Jox34R0Wrk7jLv3DZyBETA7I=': {
              value: {
                bool: true,
                number: 2,
                string: 'string',
                object: {
                  key: 'value',
                  key2: 123,
                },
                boolStr1: 'true',
                boolStr2: 'FALSE',
                numberStr1: '3',
                numberStr2: '3.3',
                numberStr3: '3.3.3',
              },
              rule_id: 'ruleID',
            },
          },
          configs: {},
        }),
    }),
  );

  const str_64 =
    '1234567890123456789012345678901234567890123456789012345678901234';
  beforeEach(() => {
    // @ts-ignore
    fetch.mockClear();
    jest.resetModules();
    statsig = require('../../index').default;
    expect.hasAssertions();

    // ensure Date.now() returns the same value in each test
    let now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);
  });

  test('Verify checkGate throws when calling before initialize', () => {
    expect(() => {
      statsig.checkGate('gate_that_doesnt_exist');
    }).toThrowError('Call and wait for initialize() to finish first.');
    const ready = statsig._ready;
    expect(ready).toBeFalsy();
  });

  test('Verify checkGate throws with no gate name', () => {
    return statsig.initialize('client-key', null).then(() => {
      expect(() => {
        // @ts-ignore
        statsig.checkGate();
      }).toThrowError('Must pass a valid string as the gateName.');
    });
  });

  test('Verify checkGate throws with wrong type as gate name', () => {
    return statsig.initialize('client-key', null).then(() => {
      expect(() => {
        // @ts-ignore
        statsig.checkGate(false);
      }).toThrowError('Must pass a valid string as the gateName.');
    });
  });

  test('Verify getConfig() and getExperiment() throw with no config name', () => {
    expect.assertions(2);
    return statsig.initialize('client-key', null).then(() => {
      expect(() => {
        // @ts-ignore
        statsig.getConfig();
      }).toThrowError('Must pass a valid string as the configName.');
      expect(() => {
        // @ts-ignore
        statsig.getExperiment();
      }).toThrowError('Must pass a valid string as the experimentName.');
    });
  });

  test('Verify getConfig and getExperiment() throw with wrong type as config name', () => {
    expect.assertions(2);
    return statsig.initialize('client-key', null).then(() => {
      expect(() => {
        // @ts-ignore
        statsig.getConfig(12);
      }).toThrowError('Must pass a valid string as the configName.');
      expect(() => {
        // @ts-ignore
        statsig.getExperiment(12);
      }).toThrowError('Must pass a valid string as the experimentName.');
    });
  });

  test('Verify getConfig and getExperiment throw when calling before initialize', () => {
    expect.assertions(3);
    expect(() => {
      statsig.getConfig('config_that_doesnt_exist');
    }).toThrowError('Call and wait for initialize() to finish first.');
    expect(() => {
      statsig.getExperiment('config_that_doesnt_exist');
    }).toThrowError('Call and wait for initialize() to finish first.');
    const ready = statsig._ready;
    expect(ready).toBeFalsy();
  });

  test('Verify logEvent throws if called before initialize()', () => {
    expect(() => {
      statsig.logEvent('test_event');
    }).toThrowError('Call and wait for initialize() to finish first.');

    const ready = statsig._ready;
    expect(ready).toBeFalsy();
  });

  test('Verify checkGate() returns the correct value under correct circumstances', () => {
    expect.assertions(4);
    return statsig.initialize('client-key', null).then(() => {
      const ready = statsig._ready;
      expect(ready).toBe(true);

      //@ts-ignore
      const spy = jest.spyOn(statsig._logger, 'log');
      let gateExposure = new LogEvent('statsig::gate_exposure');
      gateExposure.setUser({});
      gateExposure.setMetadata({
        gate: 'test_gate',
        gateValue: String(true),
        ruleID: 'ruleID123',
      });
      const gateValue = statsig.checkGate('test_gate');
      expect(gateValue).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(gateExposure);
    });
  });

  test('Updating users before initialize throws', () => {
    expect.assertions(1);
    return expect(statsig.updateUser({ userID: 123 })).rejects.toEqual(
      new Error('Call and wait for initialize() to finish first.'),
    );
  });

  test('Initialize, switch, sdk ready', () => {
    return statsig.initialize('client-key', null).then(() => {
      return statsig.updateUser({ userID: 123 }).then(() => {
        const ready = statsig._ready;
        expect(ready).toBe(true);
      });
    });
  });

  test('Initialize rejects invalid SDK Key', () => {
    // @ts-ignore
    return expect(statsig.initialize()).rejects.toEqual(
      new Error(
        'Invalid key provided.  You must use a Client or Test SDK Key from the Statsig console with the js-client-sdk',
      ),
    );
  });

  test('Initialize rejects Secret Key', () => {
    return expect(statsig.initialize('secret-key', null)).rejects.toEqual(
      new Error(
        'Invalid key provided.  You must use a Client or Test SDK Key from the Statsig console with the js-client-sdk',
      ),
    );
  });

  test('Verify getConfig() behaves correctly when calling under correct conditions', () => {
    expect.assertions(4);

    return statsig.initialize('client-key', null).then(() => {
      const ready = statsig._ready;
      expect(ready).toBe(true);

      //@ts-ignore
      const spy = jest.spyOn(statsig._logger, 'log');
      let configExposure = new LogEvent('statsig::config_exposure');
      configExposure.setUser({});
      configExposure.setMetadata({
        config: 'test_config',
        ruleID: 'ruleID',
      });
      const config = statsig.getConfig('test_config');
      expect(config?.value).toStrictEqual({
        bool: true,
        number: 2,
        string: 'string',
        object: {
          key: 'value',
          key2: 123,
        },
        boolStr1: 'true',
        boolStr2: 'FALSE',
        numberStr1: '3',
        numberStr2: '3.3',
        numberStr3: '3.3.3',
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(configExposure);
    });
  });

  test('Verify getExperiment() behaves correctly when calling under correct conditions', () => {
    expect.assertions(4);

    return statsig.initialize('client-key', null).then(() => {
      const ready = statsig._ready;
      expect(ready).toBe(true);

      //@ts-ignore
      const spy = jest.spyOn(statsig._logger, 'log');
      let configExposure = new LogEvent('statsig::config_exposure');
      configExposure.setUser({});
      configExposure.setMetadata({
        config: 'test_config',
        ruleID: 'ruleID',
      });
      const exp = statsig.getExperiment('test_config');
      expect(exp?.value).toStrictEqual({
        bool: true,
        number: 2,
        string: 'string',
        object: {
          key: 'value',
          key2: 123,
        },
        boolStr1: 'true',
        boolStr2: 'FALSE',
        numberStr1: '3',
        numberStr2: '3.3',
        numberStr3: '3.3.3',
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(configExposure);
    });
  });

  test('Verify big user object and log event are getting trimmed', () => {
    expect.assertions(7);
    let str_1k = str_64;
    // create a 32k long string
    for (let i = 0; i < 4; i++) {
      str_1k += str_1k;
    }
    expect(str_1k.length).toBe(1024);
    return statsig
      .initialize(
        'client-key',
        {
          userID: str_64 + 'more',
          email: 'jest@statsig.com',
          custom: { extradata: str_1k },
        },
        { environment: { tier: 'production' } },
      )
      .then(() => {
        // @ts-ignore
        let user = statsig._identity.getUser();
        expect(user.userID.length).toBe(64);
        expect(user.userID).toEqual(str_64);
        expect(user.email).toEqual('jest@statsig.com');
        expect(user.custom).toEqual({});
        expect(user.statsigEnvironment).toEqual({ tier: 'production' });
        // @ts-ignore
        const spy = jest.spyOn(statsig._logger, 'log');
        statsig.logEvent(str_64 + 'extra', str_64 + 'extra', {
          extradata: str_1k,
        });
        const trimmedEvent = new LogEvent(str_64.substring(0, 64));
        trimmedEvent.setValue(str_64.substring(0, 64));
        trimmedEvent.setMetadata({ error: 'not logged due to size too large' });
        trimmedEvent.addStatsigMetadata('currentPage', 'http://localhost/');
        trimmedEvent.setUser(user);
        expect(spy).toBeCalledWith(trimmedEvent);
      });
  });

  test('calling initialize() multiple times work as expected', async () => {
    expect.assertions(5);
    let count = 0;

    global.fetch = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            count++;
            resolve({
              // @ts-ignore
              headers: [],
              ok: true,
              json: () =>
                Promise.resolve({
                  disableAutoEventLogging: true,
                  feature_gates: {
                    'AoZS0F06Ub+W2ONx+94rPTS7MRxuxa+GnXro5Q1uaGY=': {
                      value: true,
                      rule_id: 'ruleID123',
                      name: 'AoZS0F06Ub+W2ONx+94rPTS7MRxuxa+GnXro5Q1uaGY=',
                    },
                  },
                  configs: {},
                }),
            });
          }, 1000);
        }),
    );

    // initialize() twice simultaneously reulsts in 1 promise
    const v1 = statsig.initialize('client-key');
    const v2 = statsig.initialize('client-key');
    await expect(v1).resolves.not.toThrow();
    await expect(v2).resolves.not.toThrow();
    expect(count).toEqual(1);

    // initialize() again after the first one completes resolves right away and does not make a new request
    await expect(statsig.initialize('client-key')).resolves.not.toThrow();
    expect(count).toEqual(1);
  });
});
