import { PortMonitor } from '../src/monitor';

describe('PortMonitor', () => {
  it('should instantiate without error', () => {
    const monitor = new PortMonitor();
    expect(monitor).toBeDefined();
  });
});
