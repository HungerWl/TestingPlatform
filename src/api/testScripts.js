import request from './request';

/**
 * 测试脚本资产 API。
 * 脚本通过 test_case_id 关联 test_cases，业务用例字段不再存在于此资源中。
 */

const BASE = '/test-scripts';

export function fetchTestScripts(params = {}) {
  return request.get(BASE, { params });
}

export function fetchTestScriptDetail(scriptId) {
  return request.get(`${BASE}/${scriptId}`);
}

export function createTestScript(payload) {
  return request.post(BASE, payload);
}

export function updateTestScript(scriptId, payload) {
  return request.put(`${BASE}/${scriptId}`, payload);
}

export function deleteTestScript(scriptId) {
  return request.delete(`${BASE}/${scriptId}`);
}
