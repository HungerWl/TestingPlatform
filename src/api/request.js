import axios from 'axios';
import { Message } from '@arco-design/web-react';
import { clearToken, getToken } from '../utils/auth';

/**
 * Axios 统一封装
 * ------------------------------------------------------------------
 * 1. 请求拦截：自动注入 Authorization token、X-Request-Id。
 * 2. 响应拦截：统一解包后端 { code, msg, data } 结构，并统一错误提示。
 *
 * 本地开发默认通过 Vite 代理访问 http://127.0.0.1:8000/api/v1。
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 便于前后端联合排查问题；不支持 randomUUID 的浏览器降级为时间戳。
    config.headers['X-Request-Id'] =
      globalThis.crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    const { data, config } = response;

    // 文件下载等二进制响应直接返回，不做业务解包。
    if (data instanceof Blob) return data;

    if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'code')) {
      if (data.code === 0 || data.code === 200) {
        return data.data;
      }

      const errorMessage = data.msg || data.message || '请求失败，请稍后重试';
      const businessError = new Error(errorMessage);
      businessError.code = data.code;
      businessError.config = config;
      businessError.data = data.data;

      if (data.code === 401) {
        clearToken();
        if (!config?.silent) {
          Message.warning('登录状态已失效，请重新登录');
        }
      } else if (!config?.silent) {
        Message.error(errorMessage);
      }

      return Promise.reject(businessError);
    }

    return data;
  },
  (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const payload = error.response?.data;
    const serverMessage = payload?.msg || payload?.message;
    const validationDetails = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.detail)
        ? payload.detail
        : [];
    const validationText = validationDetails
      .map((item) => item?.message || item?.msg)
      .filter(Boolean)
      .slice(0, 3)
      .join('；');

    const statusMessageMap = {
      400: '请求参数有误',
      401: '登录状态已失效，请重新登录',
      403: '没有权限访问该资源',
      404: '请求的资源不存在',
      408: '请求超时，请稍后重试',
      429: '操作太频繁，请稍后再试',
      500: '服务器开小差了，请稍后重试',
      502: '网关异常，请稍后重试',
      503: '服务暂不可用，请稍后重试',
    };

    let message = serverMessage || statusMessageMap[status];

    if (validationText) {
      message = serverMessage ? `${serverMessage}：${validationText}` : validationText;
    }

    if (!message && error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络后重试';
    }
    if (!message) {
      message = navigator.onLine ? '网络异常，请稍后重试' : '当前网络不可用，请检查网络连接';
    }

    if (status === 401) clearToken();

    if (!config.silent) {
      Message.error(message);
    }

    error.friendlyMessage = message;
    return Promise.reject(error);
  },
);

export default request;
