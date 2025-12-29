import { BackendAPIClient } from './backend-client';

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('request throws error with status and message on 404', async () => {
  const client = new BackendAPIClient('http://localhost:8000');

  (global as any).fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => JSON.stringify({ message: 'Not found' }),
    headers: { get: (name: string) => 'application/json' },
  });

  await expect(client['request']('/api/v1/crawler/download', { method: 'POST', body: {} })).rejects.toMatchObject({
    message: 'Not found',
    status: 404
  });
});
