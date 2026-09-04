import { describe, expect, it } from 'vitest';
import { createRecoveryCodes, decryptMfaSecret, encryptMfaSecret, hashRecoveryCode } from '../src/common/security/mfa-crypto.js';

describe('MFA secret protection', () => {
  it('encrypts and decrypts a TOTP secret', () => {
    const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    const encrypted = encryptMfaSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptMfaSecret(encrypted)).toBe(secret);
  });

  it('creates unique recovery codes and stable hashes', () => {
    const codes = createRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(hashRecoveryCode(codes[0])).toBe(hashRecoveryCode(codes[0].toLowerCase()));
  });
});
