import { test, expect } from '@playwright/test';

test.describe('API health checks', () => {
  test('POST /api/analyze rejects missing body', async ({ request }) => {
    const res = await request.post('/api/analyze', {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('POST /api/analyze rejects invalid userId', async ({ request }) => {
    const res = await request.post('/api/analyze', {
      data: {
        userId: 'bad',
        resumeText: 'a'.repeat(200),
        jobText: 'b'.repeat(100),
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/usuário/i);
  });

  test('POST /api/analyze rejects short resumeText', async ({ request }) => {
    const res = await request.post('/api/analyze', {
      data: {
        userId: 'valid-user-id-00000',
        resumeText: 'short',
        jobText: 'b'.repeat(100),
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/currículo/i);
  });

  test('POST /api/analyze rejects short jobText', async ({ request }) => {
    const res = await request.post('/api/analyze', {
      data: {
        userId: 'valid-user-id-00000',
        resumeText: 'a'.repeat(200),
        jobText: 'short',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/vaga/i);
  });

  test('POST /api/upload-resume rejects non-multipart', async ({ request }) => {
    const res = await request.post('/api/upload-resume', {
      data: { foo: 'bar' },
    });
    // Should be 400 or 500, never a crash with HTML
    expect([400, 500]).toContain(res.status());
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /api/history requires userId param', async ({ request }) => {
    const res = await request.get('/api/history');
    expect([400, 401]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
