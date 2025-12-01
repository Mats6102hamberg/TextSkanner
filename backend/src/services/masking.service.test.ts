import { maskText, containsSensitiveInfo, getMaskingStats } from './masking.service';

describe('maskText', () => {
  describe('Personnummer', () => {
    it('should mask 10-digit personnummer with dash', () => {
      const text = 'Mitt personnummer är 750312-1234.';
      const result = maskText(text, { maskPersonnummer: true });

      expect(result.maskedText).toBe('Mitt personnummer är 750312-XXXX.');
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('personnummer');
      expect(result.changes[0].original).toBe('750312-1234');
    });

    it('should mask 12-digit personnummer', () => {
      const text = 'Född 19850312-5678';
      const result = maskText(text, { maskPersonnummer: true });

      expect(result.maskedText).toBe('Född 19850312-XXXX');
      expect(result.changes[0].masked).toBe('19850312-XXXX');
    });

    it('should handle plus sign in personnummer', () => {
      const text = 'Gammal person: 350312+1234';
      const result = maskText(text, { maskPersonnummer: true });

      expect(result.maskedText).toContain('350312-XXXX');
    });
  });

  describe('Email', () => {
    it('should mask email addresses', () => {
      const text = 'Kontakta mig på test@example.com för mer info.';
      const result = maskText(text, { maskEmail: true });

      expect(result.maskedText).toBe('Kontakta mig på [MASKERAD E-POST] för mer info.');
      expect(result.changes[0].type).toBe('email');
    });

    it('should mask multiple emails', () => {
      const text = 'Email: john.doe@company.se och jane@test.org';
      const result = maskText(text, { maskEmail: true });

      expect(result.changes).toHaveLength(2);
      expect(result.maskedText).not.toContain('@');
    });
  });

  describe('Phone numbers', () => {
    it('should mask Swedish mobile number', () => {
      const text = 'Ring mig på 070-123 45 67';
      const result = maskText(text, { maskPhone: true });

      expect(result.maskedText).toContain('07X-XXX-XX-XX');
      expect(result.changes[0].type).toBe('phone');
    });

    it('should mask international format', () => {
      const text = 'Tel: +46701234567';
      const result = maskText(text, { maskPhone: true });

      expect(result.maskedText).toContain('+46-XXX-XXX-XX');
    });

    it('should mask Stockholm landline', () => {
      const text = 'Kontor: 08-123 456 78';
      const result = maskText(text, { maskPhone: true });

      expect(result.maskedText).toContain('08-XXX-XX-XX');
    });
  });

  describe('Long numbers', () => {
    it('should mask organisationsnummer', () => {
      const text = 'Org.nr: 556677-8899';
      const result = maskText(text, { maskLongNumbers: true });

      expect(result.maskedText).toBe('Org.nr: 556677-XXXX');
      expect(result.changes[0].type).toBe('number');
    });

    it('should mask bank account numbers', () => {
      const text = 'Bankgiro: 1234 5678 9012';
      const result = maskText(text, { maskLongNumbers: true });

      expect(result.maskedText).toContain('XXXX-XXXX-XXXX');
    });
  });

  describe('Combined masking', () => {
    it('should mask multiple types of sensitive data', () => {
      const text = `
        Namn: Anna Andersson
        Personnummer: 850312-1234
        Email: anna@example.com
        Tel: 070-123 45 67
        Org.nr: 556677-8899
      `;

      const result = maskText(text);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.maskedText).not.toContain('850312-1234');
      expect(result.maskedText).not.toContain('anna@example.com');
      expect(result.maskedText).not.toContain('070-123 45 67');
    });

    it('should respect disabled options', () => {
      const text = 'Email: test@test.com, Tel: 070-1234567';
      const result = maskText(text, {
        maskEmail: false,
        maskPhone: true
      });

      expect(result.maskedText).toContain('test@test.com');
      expect(result.maskedText).not.toContain('070-1234567');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', () => {
      const result = maskText('');
      expect(result.maskedText).toBe('');
      expect(result.changes).toHaveLength(0);
    });

    it('should handle text with no sensitive data', () => {
      const text = 'Detta är en vanlig text utan känslig information.';
      const result = maskText(text);

      expect(result.maskedText).toBe(text);
      expect(result.changes).toHaveLength(0);
    });

    it('should preserve original text in result', () => {
      const text = 'Original: 850312-1234';
      const result = maskText(text);

      expect(result.originalText).toBe(text);
      expect(result.originalText).not.toBe(result.maskedText);
    });
  });
});

describe('containsSensitiveInfo', () => {
  it('should return true when sensitive info is present', () => {
    expect(containsSensitiveInfo('Personnummer: 850312-1234')).toBe(true);
    expect(containsSensitiveInfo('Email: test@test.com')).toBe(true);
    expect(containsSensitiveInfo('Tel: 070-1234567')).toBe(true);
  });

  it('should return false when no sensitive info is present', () => {
    expect(containsSensitiveInfo('Detta är en vanlig text.')).toBe(false);
    expect(containsSensitiveInfo('Namn: Anna, Ålder: 30')).toBe(false);
  });
});

describe('getMaskingStats', () => {
  it('should count masked items by type', () => {
    const text = 'Personnummer: 850312-1234, Email: test@test.com, Email: another@test.se, Tel: 070-1234567';

    const result = maskText(text);
    const stats = getMaskingStats(result);

    expect(stats.personnummer).toBe(1);
    expect(stats.email).toBe(2);
    expect(stats.phone).toBe(1);
    expect(stats.totalMasked).toBeGreaterThanOrEqual(4);
  });

  it('should return zero counts for no sensitive data', () => {
    const result = maskText('Vanlig text');
    const stats = getMaskingStats(result);

    expect(stats.totalMasked).toBe(0);
    expect(stats.personnummer).toBe(0);
    expect(stats.email).toBe(0);
    expect(stats.phone).toBe(0);
    expect(stats.number).toBe(0);
  });
});
