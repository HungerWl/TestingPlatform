import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  Message,
  Space,
  Spin,
  Tag,
  Typography,
} from '@arco-design/web-react';
import {
  IconCheckCircle,
  IconRefresh,
  IconSend,
} from '@arco-design/web-react/icon';
import {
  chatWithAi,
  fetchAiIndexStatus,
  rebuildAiIndex,
} from '../../api/aiAssistant';
import { updateTestCase } from '../../api/testCases';
import './index.scss';

/**
 * AI 质量助手
 * ------------------------------------------------------------------
 * 左右布局：
 * - 左侧：提问输入 + 已提交问题条目（点击可跳转到右侧对应轮次）；
 * - 右侧：接口返回的分析结论、相关用例与修复方案。
 * 进入页面先以全屏动画完成初始化，播放结束后再显示菜单页面。
 */

const EMPTY_TEXT = '描述一个 bug 或问题，我会从历史用例中找出相似记录并给出修复方案。';
const BOOT_KEY = 'ai-quality-assistant-booted';
const AVATAR_SRC = '/dkxp.png';

function BootIntro({ onFinish }) {
  const [leaving, setLeaving] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    window.setTimeout(onFinish, 320);
  }, [onFinish]);

  useEffect(() => {
    // 视频异常或长时间无响应时的兜底
    const timer = window.setTimeout(finish, 30000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <div
      className={`ai-boot${leaving ? ' ai-boot--leaving' : ''}`}
      role="presentation"
      onClick={finish}
    >
      <video
        className="ai-boot__video"
        src="/deepseek-ai.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <span className="ai-boot__hint">AI 质量助手正在初始化…</span>
      <button type="button" className="ai-boot__skip" onClick={finish}>
        跳过
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ai-empty">
      <img className="ai-empty__image" src={AVATAR_SRC} alt="AI 质量助手" />
      <p className="ai-empty__text">{EMPTY_TEXT}</p>
    </div>
  );
}

function AnswerCases({ cases, onAdopt }) {
  if (!Array.isArray(cases) || cases.length === 0) return null;
  return (
    <div className="ai-cases">
      {cases.map((record) => (
        <div className="ai-case" key={record.case_id}>
          <div className="ai-case__head">
            <span className="ai-case__no">{record.case_no}</span>
            <Tag>{record.system_name}</Tag>
            {typeof record.score === 'number' && (
              <span className="ai-case__score">相似度 {Math.round(record.score * 100)}%</span>
            )}
          </div>
          {record.name && <div className="ai-case__name">{record.name}</div>}
          {record.issue_description && (
            <div className="ai-case__field">
              <span className="ai-case__label">问题描述</span>
              <span className="ai-case__value">{record.issue_description}</span>
            </div>
          )}
          {record.similarity_reason && (
            <div className="ai-case__field">
              <span className="ai-case__label">相似点</span>
              <span className="ai-case__value">{record.similarity_reason}</span>
            </div>
          )}
          <div className="ai-case__field">
            <span className="ai-case__label">修复方案</span>
            <span className="ai-case__value">
              {record.fix_plan || (
                <Typography.Text type="secondary">暂无修复方案</Typography.Text>
              )}
            </span>
          </div>
          {record.suggested_fix_plan && (
            <div className="ai-case__suggest">
              <div className="ai-case__suggest-label">AI 修复建议</div>
              <div className="ai-case__suggest-text">{record.suggested_fix_plan}</div>
              <Button size="mini" icon={<IconCheckCircle />} onClick={() => onAdopt(record)}>
                采纳建议并写回
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AiAssistant() {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [status, setStatus] = useState(null);
  const [booting, setBooting] = useState(() => {
    try {
      return sessionStorage.getItem(BOOT_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const bodyRef = useRef(null);
  const threadRefs = useRef({});

  const loadStatus = useCallback(() => {
    fetchAiIndexStatus()
      .then(setStatus)
      .catch(() => {
        /* request.js 已统一提示 */
      });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleBootFinish = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* 隐私模式下忽略 */
    }
    setBooting(false);
  }, []);

  const scrollToThread = useCallback((id) => {
    const el = threadRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('is-jump');
    window.setTimeout(() => el.classList.remove('is-jump'), 1600);
  }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    setInput('');
    setThreads((prev) => [...prev, { id, question, status: 'loading', answer: null }]);
    setActiveId(id);

    // 新提问自动滚到底部
    window.setTimeout(() => {
      const body = bodyRef.current;
      if (body) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    }, 60);

    try {
      const answer = await chatWithAi(question);
      setThreads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'done', answer } : item)),
      );
    } catch (error) {
      setThreads((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'error',
                errorText: error?.friendlyMessage || '分析失败，请稍后重试',
              }
            : item,
        ),
      );
    }
  };

  const handleRebuild = async () => {
    setIndexing(true);
    try {
      await rebuildAiIndex();
      Message.success('向量索引重建完成');
      loadStatus();
    } catch {
      // request.js 已统一提示
    } finally {
      setIndexing(false);
    }
  };

  const handleAdopt = async (threadId, record) => {
    try {
      await updateTestCase(record.case_id, { fix_plan: record.suggested_fix_plan });
      setThreads((prev) =>
        prev.map((item) =>
          item.id === threadId && item.answer
            ? {
                ...item,
                answer: {
                  ...item.answer,
                  cases: (item.answer.cases || []).map((one) =>
                    one.case_id === record.case_id
                      ? { ...one, fix_plan: record.suggested_fix_plan }
                      : one,
                  ),
                },
              }
            : item,
        ),
      );
      Message.success('修复方案已写回用例');
    } catch {
      // request.js 已统一提示
    }
  };

  return (
    <div className="tp-page ai-assistant">
      {booting && <BootIntro onFinish={handleBootFinish} />}

      {!booting && (
        <div className="ai-workspace">
          <aside className="ai-side">
            <div className="ai-side__composer">
              <span className="ai-side__label">描述你的问题</span>
              <Input.TextArea
                value={input}
                onChange={setInput}
                placeholder={EMPTY_TEXT}
                autoSize={{ minRows: 3, maxRows: 6 }}
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="primary"
                long
                icon={<IconSend />}
                loading={threads.some((item) => item.status === 'loading')}
                disabled={!input.trim()}
                onClick={handleSend}
              >
                发送分析
              </Button>
            </div>

            <div className="ai-side__history">
              <div className="ai-side__history-head">
                <span>提问记录</span>
                <span className="ai-side__count">{threads.length}</span>
              </div>
              <div className="ai-side__list">
                {threads.length === 0 ? (
                  <p className="ai-side__hint">暂无提问记录</p>
                ) : (
                  threads.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`ai-side__item${activeId === item.id ? ' is-active' : ''}`}
                      onClick={() => {
                        setActiveId(item.id);
                        scrollToThread(item.id);
                      }}
                    >
                      <span className="ai-side__index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="ai-side__question">{item.question}</span>
                      <span className="ai-side__meta">
                        {item.status === 'loading'
                          ? '分析中…'
                          : item.status === 'error'
                            ? '分析失败'
                            : `${item.answer?.cases?.length ?? 0} 条相关`}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="ai-main">
            <div className="ai-main__bar">
              <div className="ai-assistant__title">
                <img className="ai-assistant__logo" src={AVATAR_SRC} alt="" />
                <span>AI 质量助手</span>
              </div>
              <Space size={6}>
                <span className="ai-assistant__status">
                  已索引 {status?.indexed ?? '—'} / {status?.total ?? '—'} 条
                  <span className="ai-assistant__status-meta">
                    · {status?.embedding ?? ''} · {status?.backend ?? ''}
                  </span>
                </span>
                <Button
                  size="small"
                  icon={<IconRefresh />}
                  loading={indexing}
                  onClick={handleRebuild}
                >
                  重建索引
                </Button>
              </Space>
            </div>

            <div
              className={`ai-main__body${threads.length === 0 ? ' ai-main__body--empty' : ''}`}
              ref={bodyRef}
            >
              {threads.length === 0 ? (
                <EmptyState />
              ) : (
                threads.map((item) => (
                  <div
                    className="ai-thread"
                    key={item.id}
                    ref={(el) => {
                      threadRefs.current[item.id] = el;
                    }}
                  >
                    <div className="ai-message ai-message--user">
                      <div className="ai-message__bubble">{item.question}</div>
                    </div>

                    <div className="ai-message ai-message--ai">
                      <div className="ai-message__avatar">
                        <img
                          className="ai-message__avatar-img"
                          src={AVATAR_SRC}
                          alt="AI 质量助手"
                        />
                      </div>
                      <div className="ai-message__content">
                        {item.status === 'loading' && (
                          <div className="ai-loading">
                            <Spin dot /> <span>正在检索并分析…</span>
                          </div>
                        )}
                        {item.status === 'error' && (
                          <Typography.Text type="danger">{item.errorText}</Typography.Text>
                        )}
                        {item.status === 'done' && item.answer && (
                          <>
                            <Typography.Paragraph className="ai-message__summary">
                              {item.answer.summary}
                            </Typography.Paragraph>
                            <AnswerCases
                              cases={item.answer.cases}
                              onAdopt={(record) => handleAdopt(item.id, record)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
