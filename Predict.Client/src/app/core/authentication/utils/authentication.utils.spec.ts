import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationUtils } from './authentication.utils';

describe('AuthenticationUtils', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('saves and reads the token from local storage', () => {
    AuthenticationUtils.saveToken('test-token');

    expect(AuthenticationUtils.getToken()).toBe('test-token');
  });

  it('removes the token on logout', () => {
    AuthenticationUtils.saveToken('test-token');

    AuthenticationUtils.logOut();

    expect(AuthenticationUtils.getToken()).toBeNull();
  });
});
