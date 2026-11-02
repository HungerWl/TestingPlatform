import request from './request';

/**
 * 测试脚本文件资产 API。
 *
 * 一个脚本可以通过 test_case_scripts 关联多个测试用例；
 * 文件采用 multipart/form-data 上传，响应中不再包含 content / revision。
 */

const BASE = '/test-scripts';

const ALLOWED_EXTENSIONS = [
  '.py',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.txt',
  '.md',
  '.feature',
];

export const SCRIPT_FILE_ACCEPT = ALLOWED_EXTENSIONS.join(',');
export const SCRIPT_FILE_MAX_SIZE = 10 * 1024 * 1024;
export const SCRIPT_FILE_EXTENSIONS = ALLOWED_EXTENSIONS;
export const SCRIPT_FILE_TIP =
  '支持 .py / .ts / .js / .mjs / .cjs / .json / .yaml / .yml / .txt / .md / .feature，最大 10 MB';

export function fetchTestScripts(params = {}) {
  return request.get(BASE, { params });
}

export function fetchTestScriptDetail(scriptId) {
  return request.get(`${BASE}/${scriptId}`);
}

/**
 * 创建脚本必须上传文件，可同时绑定多个用例。
 *
 * @param {Object} options
 * @param {File} options.file
 * @param {string[]} options.testCaseIds
 * @param {string} options.name
 * @param {string|undefined} options.scriptType
 * @param {string} options.version
 * @param {string|null} options.remark
 */
export function uploadTestScript({
  file,
  testCaseIds,
  name,
  scriptType,
  version,
  remark,
}) {
  const formData = new FormData();
  formData.append('file', file);
  (testCaseIds || []).forEach((caseId) => formData.append('test_case_ids', caseId));
  formData.append('name', name);
  if (scriptType) formData.append('script_type', scriptType);
  formData.append('version', version);
  if (remark) formData.append('remark', remark);
  return request.post(`${BASE}/upload`, formData);
}

export function updateTestScript(scriptId, payload) {
  return request.put(`${BASE}/${scriptId}`, payload);
}

export function updateTestScriptTestCases(scriptId, testCaseIds) {
  return request.put(`${BASE}/${scriptId}/test-cases`, {
    test_case_ids: testCaseIds,
  });
}

export function replaceTestScriptFile(scriptId, { file, version }) {
  const formData = new FormData();
  formData.append('file', file);
  if (version) formData.append('version', version);
  return request.put(`${BASE}/${scriptId}/file`, formData);
}

export function deleteTestScript(scriptId) {
  return request.delete(`${BASE}/${scriptId}`);
}

/**
 * 预览 UTF-8 文本。
 */
export function previewTestScript(scriptId) {
  return request.get(`${BASE}/${scriptId}/preview`, {
    responseType: 'text',
    transformResponse: [(data) => data],
  });
}

function getDownloadFileName(disposition, fallbackName) {
  if (!disposition) return fallbackName || 'script-file';

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, ''));
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallbackName || 'script-file';
}

/**
 * 下载当前文件，返回 Blob 和服务端原始文件名。
 */
export async function downloadTestScript(scriptId, fallbackName) {
  const response = await request.get(`${BASE}/${scriptId}/download`, {
    responseType: 'blob',
    returnFullResponse: true,
  });

  return {
    blob: response.data,
    fileName: getDownloadFileName(
      response.headers?.['content-disposition'],
      fallbackName,
    ),
  };
}
