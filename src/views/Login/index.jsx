import { useState } from 'react';
import { Button, Checkbox, Form, Input, Message } from '@arco-design/web-react';
import {
  IconArrowRight,
  IconEmail,
  IconLock,
  IconSafe,
  IconThunderbolt,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import BrandMark from '../../components/common/BrandMark';
import StatusTag from '../../components/common/StatusTag';
import { DEMO_TOKEN, setToken } from '../../utils/auth';

const DEMO_ACCOUNT = {
  email: 'jasmine.lin@testing.platform',
  password: 'quality2026',
};

/**
 * 隐藏路由 /login 的示例登录页。
 * 注意：本演示没有登录门禁，根路径会在 boot.mp4 后直接进入后台；
 * 此页面仅用于展示登录界面与表单交互，也可从用户菜单“退出登录”访问。
 */
export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values) => {
    setSubmitting(true);
    window.setTimeout(() => {
      setToken(DEMO_TOKEN);
      setSubmitting(false);
      Message.success(`欢迎回来，${values.email.split('@')[0]}`);
      navigate('/profile', { replace: true });
    }, 650);
  };

  const fillDemoAccount = () => {
    form.setFieldsValue(DEMO_ACCOUNT);
    Message.info('已填入演示账号');
  };

  return (
    <div className="tp-login">
      <aside className="tp-login__brand">
        <div className="tp-login__brand-grid" aria-hidden="true" />
        <div className="tp-login__scan" aria-hidden="true" />

        <div className="relative z-10 flex h-full flex-col p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandMark className="h-10 w-10 text-acid" />
              <div>
                <p className="font-display text-sm font-semibold tracking-[0.12em] text-paper">
                  TESTING PLATFORM
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                  Quality engineering console
                </p>
              </div>
            </div>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-white/35 sm:block">
              ACCESS NODE / 02
            </span>
          </div>

          <div className="my-auto max-w-2xl py-16">
            <div className="mb-6 flex items-center gap-3">
              <StatusTag tone="active" pulse>
                SYSTEM READY
              </StatusTag>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                Shanghai / CST
              </span>
            </div>

            <h1 className="font-display text-[clamp(40px,5vw,76px)] font-semibold leading-[0.98] tracking-[-0.06em] text-paper">
              测试不是
              <br />
              <span className="text-acid">最后一步。</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-white/50">
              从资产、编排到信号回传，在一个可追踪的控制台里完成质量决策。
              <span className="text-white/80"> Test before you trust.</span>
            </p>

            <div className="tp-login__orbit" aria-hidden="true">
              <span className="tp-login__orbit-ring tp-login__orbit-ring--one" />
              <span className="tp-login__orbit-ring tp-login__orbit-ring--two" />
              <span className="tp-login__orbit-ring tp-login__orbit-ring--three" />
              <span className="tp-login__orbit-core" />
              <span className="tp-login__orbit-dot is-one" />
              <span className="tp-login__orbit-dot is-two" />
              <span className="absolute left-[58%] top-[8%] hidden xl:block">
                <span className="tp-login__orbit-label">PASS RATE · 98.6%</span>
              </span>
              <span className="absolute right-[2%] top-[62%] hidden xl:block">
                <span className="tp-login__orbit-label">1,284 ASSETS</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            {[
              { value: '1,284', label: '测试资产' },
              { value: '98.6%', label: '当前通过率' },
              { value: '24', label: '在线节点' },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-xl font-semibold text-paper">{item.value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="tp-login__panel">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <div>
                <p className="font-display text-[12px] font-semibold tracking-[0.09em] text-ink">
                  TESTING PLATFORM
                </p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                  Quality engineering console
                </p>
              </div>
            </div>
            <span className="tp-chip tp-chip--muted">DEMO</span>
          </div>

          <div className="mb-10 flex items-center justify-between gap-3">
            <span className="eyebrow">OPERATOR SIGN-IN</span>
            <span className="tp-chip tp-chip--muted">DEMO ACCESS</span>
          </div>

          <div className="tp-login-card">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-paper text-ink">
                <IconSafe className="text-[20px]" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                SESSION / 02
              </span>
            </div>

            <h2 className="mt-6 font-display text-[30px] font-semibold leading-tight tracking-[-0.045em] text-ink">
              重返质量控制台
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              使用你的工作邮箱登录。演示环境不会校验真实凭证。
            </p>

            <Form
              form={form}
              layout="vertical"
              className="mt-6"
              initialValues={{ remember: true }}
              onSubmit={handleSubmit}
            >
              <Form.Item
                label="工作邮箱"
                field="email"
                rules={[
                  { required: true, message: '请输入工作邮箱' },
                  { type: 'email', message: '邮箱格式不正确' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<IconEmail />}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                label="登录密码"
                field="password"
                rules={[{ required: true, message: '请输入登录密码' }]}
              >
                <Input.Password
                  size="large"
                  prefix={<IconLock />}
                  placeholder="输入登录密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div className="mb-5 flex items-center justify-between gap-3">
                <Form.Item field="remember" triggerPropName="checked" noStyle>
                  <Checkbox>记住此设备</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  className="text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
                  onClick={() => Message.info('请联系工作空间管理员重置密码')}
                >
                  忘记密码？
                </button>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                long
                size="large"
                loading={submitting}
                className="btn-acid !h-11"
                icon={<IconArrowRight />}
              >
                进入控制台
              </Button>
            </Form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button
              long
              size="large"
              className="tp-button-ghost !h-10"
              icon={<IconThunderbolt />}
              onClick={fillDemoAccount}
            >
              填入演示账号
            </Button>

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-ink"
              onClick={() => navigate('/profile')}
            >
              跳过登录，直接进入控制台
              <IconArrowRight />
            </button>
          </div>

          <p className="mt-6 text-center font-mono text-[8px] uppercase leading-4 tracking-[0.15em] text-muted">
            本项目无登录门禁 · boot.mp4 播放完成后直接载入后台
            <br />
            Testing Platform © 2026
          </p>
        </div>
      </main>
    </div>
  );
}
