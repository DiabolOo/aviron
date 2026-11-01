import { parseTargetTime, targetPaceSec } from './helpers';

const SEMI = 21.0975;

describe('targetPaceSec', () => {
  it('reads unambiguous formats', () => {
    expect(targetPaceSec('1:45:00', SEMI)).toBe(299);
    expect(targetPaceSec('1h45', SEMI)).toBe(299);
    expect(targetPaceSec('1h45m', SEMI)).toBe(299);
    expect(targetPaceSec(' 1H45 ', SEMI)).toBe(299);
    expect(targetPaceSec('3:30:00', 42.195)).toBe(299);
  });

  it('settles « 1:45 » by distance: 1h45 for a half-marathon or more, invalid for 5 and 10 km', () => {
    expect(targetPaceSec('1:45', SEMI)).toBe(299);
    expect(targetPaceSec('1:45', 5)).toBeUndefined();
    expect(targetPaceSec('1:45', 10)).toBeUndefined();
    expect(parseTargetTime('1:45', 10)).toBe(105);
    expect(parseTargetTime('1:45', SEMI)).toBe(6300);
  });

  it('reads « 45:00 » as 45 minutes on 10 km, and rejects it on a half-marathon', () => {
    expect(targetPaceSec('45:00', 10)).toBe(270);
    expect(targetPaceSec('45:00', SEMI)).toBeUndefined();
  });

  it('rejects unreadable text', () => {
    for (const bad of ['abc', '', '   ', '1:', ':45', '1:75', '1h45x', '1:45:00:00', '1,5']) {
      expect(targetPaceSec(bad, SEMI)).toBeUndefined();
    }
    expect(targetPaceSec(undefined, SEMI)).toBeUndefined();
    expect(targetPaceSec('45:00', 0)).toBeUndefined();
  });

  it('keeps only paces between 2:30 and 10:00 per km', () => {
    expect(targetPaceSec('25:00', 10)).toBe(150);
    expect(targetPaceSec('24:00', 10)).toBeUndefined();
    expect(targetPaceSec('1:40:00', 10)).toBe(600);
    expect(targetPaceSec('1:41:00', 10)).toBeUndefined();
    expect(targetPaceSec('4:00:00', SEMI)).toBeUndefined();
  });
});
