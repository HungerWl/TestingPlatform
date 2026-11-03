import request from './request';

/**
 * 字典管理 API。
 *
 * 两级模型：
 * - 字典类型：如 gender / 性别
 * - 字典项：如 male / 男、female / 女（类型内 item_code 唯一）
 */

const BASE = '/dictionaries';

export function fetchDictionaryTypes(params = {}) {
  return request.get(`${BASE}/types`, { params });
}

export function fetchDictionaryTypeDetail(typeId) {
  return request.get(`${BASE}/types/${typeId}`);
}

export function createDictionaryType(payload) {
  return request.post(`${BASE}/types`, payload);
}

export function updateDictionaryType(typeId, payload) {
  return request.put(`${BASE}/types/${typeId}`, payload);
}

export function deleteDictionaryType(typeId) {
  return request.delete(`${BASE}/types/${typeId}`);
}

export function fetchDictionaryItems(typeId, params = {}) {
  return request.get(`${BASE}/types/${typeId}/items`, { params });
}

export function fetchDictionaryItemDetail(typeId, itemId) {
  return request.get(`${BASE}/types/${typeId}/items/${itemId}`);
}

export function createDictionaryItem(typeId, payload) {
  return request.post(`${BASE}/types/${typeId}/items`, payload);
}

export function updateDictionaryItem(typeId, itemId, payload) {
  return request.put(`${BASE}/types/${typeId}/items/${itemId}`, payload);
}

export function deleteDictionaryItem(typeId, itemId) {
  return request.delete(`${BASE}/types/${typeId}/items/${itemId}`);
}

/** 按类型编码获取已启用的字典项，供下拉框使用。 */
export function fetchDictionaryOptions(typeCode) {
  return request.get(`${BASE}/by-code/${encodeURIComponent(typeCode)}`);
}
