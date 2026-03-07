import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultThresholds, defaultOptions } from '../config.js';

export const options = {
  ...defaultOptions,
  thresholds: defaultThresholds,
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has status field': (r) => JSON.parse(r.body).status !== undefined,
  });

  sleep(1);
}
