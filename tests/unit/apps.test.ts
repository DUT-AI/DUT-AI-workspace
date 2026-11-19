import { WORKSPACE_APPS } from '../../src/config/apps';

describe('DUT-AI Workspace App Registry', () => {
  it('should register all three core services', () => {
    expect(WORKSPACE_APPS).toHaveLength(3);
    const ids = WORKSPACE_APPS.map((app) => app.id);
    expect(ids).toContain('manage');
    expect(ids).toContain('lms');
    expect(ids).toContain('meetly');
  });

  it('should define valid subpaths for all services', () => {
    for (const app of WORKSPACE_APPS) {
      expect(app.path.startsWith(`/${app.id}`)).toBe(true);
      expect(app.title.length).toBeGreaterThan(0);
      expect(app.icon.length).toBeGreaterThan(0);
    }
  });
});
