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

function getDownloadFileName(disposition, fallbackName) {
  if (!disposition) return fallbackName;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ''));
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallbackName;
}

/**
 * 下载测试用例导入模板（CSV），返回 Blob 与文件名。
 */
export async function downloadTestCaseTemplate(fallbackName = 'test-case-import-template.csv') {
  const response = await request.get(`${BASE}/import-template`, {
    responseType: 'blob',
    returnFullResponse: true,
  });

  return {
    blob: response.data,
    fileName: getDownloadFileName(response.headers?.['content-disposition'], fallbackName),
  };
}

/**
 * 上传 CSV 批量导入测试用例。
 *
 * 后端逐行校验，返回 { total, success, failed, errors }。
 */
export function importTestCases(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`${BASE}/import`, formData, { timeout: 120000 });
}
