import request from './request';

/**
 * 测试用例（纯业务定义）API。
 * 业务字段：用例名称、业务编号、前置条件、测试步骤、预期结果、优先级、所属系统、单位、任务执行人（数组）、备注。
 */

const BASE = '/test-cases';

export function fetchTestCases(params = {}) {
  return request.get(BASE, { params });
}

export function fetchTestCaseDetail(caseId) {
  return request.get(`${BASE}/${caseId}`);
}

export function createTestCase(payload) {
  return request.post(BASE, payload);
}

export function updateTestCase(caseId, payload) {
  return request.put(`${BASE}/${caseId}`, payload);
}

export function deleteTestCase(caseId) {
  return request.delete(`${BASE}/${caseId}`);
}
