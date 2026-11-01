import { parseTargetTime, targetPaceSec } from './helpers';

const SEMI = 21.0975;

describe('parseTargetTime', () => {
  it('reads « 1:15 » as 1h15 on 15 km, and finds no pace on 5 km', () => {
    expect(parseTargetTime('1:15', 15)).toBe(4500);
    expect(targetPaceSec('1:15', 15)).toBe(300);
    expect(parseTargetTime('1:15', 5)).toBeUndefined();
    expect(targetPaceSec('1:15', 5)).toBeUndefined();
  });

  it('reads « 45:00 » as 45 minutes on 10 km, not on a half-marathon', () => {
    expect(parseTargetTime('45:00', 10)).toBe(2700);
    expect(targetPaceSec('45:00', 10)).toBe(270);
    expect(parseTargetTime('45:00', SEMI)).toBeUndefined();
  });

  it('reads « 1:45 » as 1h45 on a half-marathon, and finds no pace on 5 and 10 km', () => {
    expect(parseTargetTime('1:45', SEMI)).toBe(6300);
    expect(targetPaceSec('1:45', SEMI)).toBe(299);
    expect(parseTargetTime('1:45', 5)).toBeUndefined();
    expect(parseTargetTime('1:45', 10)).toBeUndefined();
  });

  it('reads the unambiguous formats', () => {
    expect(targetPaceSec('1:45:00', SEMI)).toBe(299);
    expect(parseTargetTime('1:45:00', SEMI)).toBe(6300);
    expect(targetPaceSec('1h45', SEMI)).toBe(299);
    expect(targetPaceSec('1h45m', SEMI)).toBe(299);
    expect(targetPaceSec(' 1H45 ', SEMI)).toBe(299);
    expect(targetPaceSec('3:30:00', 42.195)).toBe(299);
  });

  it('rejects unreadable text and invalid distances', () => {
    for (const bad of ['abc', '', '   ', '1:', ':45', '1:75', '1h45x', '1:45:00:00', '1,5']) {
      expect(parseTargetTime(bad, SEMI)).toBeUndefined();
    }
    expect(parseTargetTime(undefined, SEMI)).toBeUndefined();
    expect(parseTargetTime('45:00', 0)).toBeUndefined();
  });

  it('keeps only paces between 2:30 and 10:00 per km, whatever the format', () => {
    expect(targetPaceSec('25:00', 10)).toBe(150);
    expect(targetPaceSec('24:00', 10)).toBeUndefined();
    expect(targetPaceSec('1:40:00', 10)).toBe(600);
    expect(targetPaceSec('1:41:00', 10)).toBeUndefined();
    expect(targetPaceSec('4:00:00', SEMI)).toBeUndefined();
    expect(targetPaceSec('1h', 5)).toBeUndefined();
  });
});
