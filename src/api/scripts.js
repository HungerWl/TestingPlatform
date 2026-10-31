import request from './request';

/**
 * 测试用例（测试脚本）API
 * ------------------------------------------------------------------
 * 后端统一前缀：/api/v1
 * 所有请求由 request.js 注入 Content-Type、token 与统一错误处理。
 */

const BASE = '/scripts';

/**
 * 分页查询脚本列表。
 * @param {{ page?: number, page_size?: number, keyword?: string, script_type?: string, case_id?: number }} params
 */
export function fetchScripts(params = {}) {
  return request.get(BASE, { params });
}

/** 根据 ID 查询脚本详情。 */
export function fetchScriptDetail(scriptId) {
  return request.get(`${BASE}/${scriptId}`);
}

/** 新增测试脚本，后端初始版本号为 1。 */
export function createScript(payload) {
  return request.post(BASE, payload);
}

/** 修改测试脚本，后端版本号自动 +1。 */
export function updateScript(scriptId, payload) {
  return request.put(`${BASE}/${scriptId}`, payload);
}

/** 删除测试脚本。 */
export function deleteScript(scriptId) {
  return request.delete(`${BASE}/${scriptId}`);
}
