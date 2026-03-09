import { ApiClient } from './client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({ baseUrl: 'https://api.test.com/v1' });
    mockFetch.mockReset();
  });

  describe('get() query parameter serialization', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });

    it('should omit undefined values from query string', async () => {
      await client.get('/items', {
        page: 1,
        search: undefined,
        categoryId: undefined,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.test.com/v1/items?page=1');
      expect(calledUrl).not.toContain('undefined');
    });

    it('should omit null values from query string', async () => {
      await client.get('/items', {
        page: 1,
        accountId: null,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.test.com/v1/items?page=1');
      expect(calledUrl).not.toContain('null');
    });

    it('should include valid string and number values', async () => {
      await client.get('/items', {
        page: 1,
        limit: 25,
        search: 'coffee',
        sortBy: 'date',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=25');
      expect(calledUrl).toContain('search=coffee');
      expect(calledUrl).toContain('sortBy=date');
    });

    it('should handle empty string values (include them)', async () => {
      await client.get('/items', {
        page: 1,
        search: '',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('search=');
    });

    it('should not append query string when all params are undefined', async () => {
      await client.get('/items', {
        search: undefined,
        categoryId: undefined,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.test.com/v1/items');
    });

    it('should not append query string when no params provided', async () => {
      await client.get('/items');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.test.com/v1/items');
    });

    it('should convert boolean and number values to strings', async () => {
      await client.get('/items', {
        active: true,
        count: 0,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('active=true');
      expect(calledUrl).toContain('count=0');
    });

    it('should handle Date values via String()', async () => {
      const date = new Date('2026-01-15T00:00:00.000Z');
      await client.get('/items', {
        startDate: date,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('startDate=');
      expect(calledUrl).not.toContain('undefined');
    });
  });
});
