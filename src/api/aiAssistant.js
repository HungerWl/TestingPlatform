import request from './request';

/**
 * AI 用例分析助手 API。
 * 后端：POST /api/v1/ai/chat（对话）、POST /ai/index（重建索引）、GET /ai/index/status（状态）。
 */

const BASE = '/ai';

/** 对话分析：入参 { question }，返回 { summary, cases[], backend }。 */
export function chatWithAi(question) {
  return request.post(`${BASE}/chat`, { question });
}

/**
 * 启动全量重建（异步），立即返回 { task_id, status, reused, total }。
 * 已有未结束任务时 reused=true，前端应直接接入进度而不是重复触发。
 */
export function rebuildAiIndex() {
  return request.post(`${BASE}/index`);
}

/** 查询索引状态，返回 { backend, embedding, indexed, total, task }。 */
export function fetchAiIndexStatus() {
  return request.get(`${BASE}/index/status`);
}

/** 请求取消正在执行的索引重建任务。 */
export function cancelAiIndex() {
  return request.post(`${BASE}/index/cancel`);
}
