import { describe, it, expect } from 'vitest';
import { formatUrl } from './utils';

describe('formatUrl', () => {
    it('should return empty string for undefined or empty input', () => {
        expect(formatUrl(undefined)).toBe('');
        expect(formatUrl('')).toBe('');
        expect(formatUrl('   ')).toBe('');
    });

    it('should not modify URLs that already have http or https', () => {
        expect(formatUrl('http://facebook.com')).toBe('http://facebook.com');
        expect(formatUrl('https://facebook.com')).toBe('https://facebook.com');
    });

    it('should prepend https:// to URLs without a protocol', () => {
        expect(formatUrl('facebook.com/church')).toBe('https://facebook.com/church');
        expect(formatUrl('www.instagram.com/user')).toBe('https://www.instagram.com/user');
        expect(formatUrl('google.com')).toBe('https://google.com');
    });

    it('should handle protocol-relative URLs by prepending https:', () => {
        expect(formatUrl('//cdn.example.com/file')).toBe('https://cdn.example.com/file');
    });

    it('should not modify mailto, tel, or sms links', () => {
        expect(formatUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
        expect(formatUrl('tel:+1234567890')).toBe('tel:+1234567890');
        expect(formatUrl('sms:+1234567890')).toBe('sms:+1234567890');
    });

    it('should trim whitespace from the input', () => {
        expect(formatUrl('  facebook.com  ')).toBe('https://facebook.com');
    });
});
