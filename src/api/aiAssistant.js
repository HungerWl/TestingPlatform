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

/** 全量重建向量索引，返回 { indexed }。 */
export function rebuildAiIndex() {
  return request.post(`${BASE}/index`);
}

/** 查询索引状态，返回 { backend, embedding, indexed, total }。 */
export function fetchAiIndexStatus() {
  return request.get(`${BASE}/index/status`);
}
