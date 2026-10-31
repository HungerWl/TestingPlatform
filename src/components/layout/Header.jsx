import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Menu,
  Message,
} from "@arco-design/web-react";
import {
  IconDown,
  IconHome,
  IconMenuFold,
  IconMenuUnfold,
  IconNotification,
  IconPoweroff,
  IconSettings,
  IconUser,
} from "@arco-design/web-react/icon";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useClock from "../../hooks/useClock";
import { getCurrentUser, clearToken } from "../../utils/auth";
import { getRouteTrail } from "../../router/menu";

const SEED_NOTIFICATIONS = [
  {
    id: 1,
    title: "个人资料已同步",
    detail: "邮箱、电话和工作空间信息保持一致",
    time: "2 min",
    tone: "acid",
    read: false,
  },
  {
    id: 2,
    title: "账户安全提醒",
    detail: "建议定期更新登录密码并保持两步验证开启",
    time: "18 min",
    tone: "ember",
    read: false,
  },
  {
    id: 3,
    title: "欢迎使用 Testing Platform",
    detail: "测试脚本服务已接入，版本记录会自动递增",
    time: "1 h",
    tone: "frost",
    read: true,
  },
];

export default function Header({ collapsed, onToggleCollapse, onOpenMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { clock } = useClock();
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);

  const trail = useMemo(
    () => getRouteTrail(location.pathname),
    [location.pathname],
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllRead = () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    Message.success("通知已全部标为已读");
  };

  const handleUserMenu = (key) => {
    if (key === "profile") {
      navigate("/profile");
    }
    if (key === "logout") {
      clearToken();
      Message.success("已退出演示会话");
      navigate("/login");
    }
  };

  const notificationPanel = (
    <div className="tp-notification-panel">
      <div className="flex items-center justify-between border-b border-line/80 px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-ink">
            通知中心
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            {unreadCount} unread signals
          </p>
        </div>
        <Button type="text" size="mini" onClick={markAllRead}>
          全部已读
        </Button>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-2">
        {notifications.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`tp-notification ${item.read ? "is-read" : ""}`.trim()}
            onClick={() =>
              setNotifications((items) =>
                items.map((current) =>
                  current.id === item.id ? { ...current, read: true } : current,
                ),
              )
            }
          >
            <span className={`tp-notification__dot is-${item.tone}`} />
            <span className="min-w-0 flex-1 text-left">
              <span className="tp-notification__title">{item.title}</span>
              <span className="tp-notification__detail">{item.detail}</span>
            </span>
            <span className="tp-notification__time">{item.time}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-line/80 px-4 py-2.5">
        <button
          type="button"
          className="text-[11px] font-medium text-ink-muted transition-colors hover:text-ink"
          onClick={() => Message.info("演示项目未接入消息中心")}
        >
          查看全部通知 →
        </button>
      </div>
    </div>
  );

  const userMenu = (
    <Menu className="tp-user-menu" onClickMenuItem={handleUserMenu}>
      <Menu.Item key="profile">
        <span className="flex items-center gap-2">
          <IconUser /> 个人中心
        </span>
      </Menu.Item>
      <Menu.Item key="logout" className="tp-user-menu__logout">
        <span className="flex items-center gap-2 text-[#d84a31]">
          <IconPoweroff /> 退出登录
        </span>
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="tp-header">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          type="button"
          className="tp-icon-button tp-header__mobile-toggle"
          onClick={onOpenMobile}
          aria-label="打开导航"
        >
          <IconMenuUnfold />
        </button>
        <button
          type="button"
          className="tp-icon-button tp-header__desktop-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
        </button>

        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />

        <Breadcrumb className="tp-breadcrumb hidden min-w-0 sm:block">
          <Breadcrumb.Item>
            <Link
              to="/test-cases"
              className="tp-breadcrumb__home"
              aria-label="首页"
            >
              <IconHome />
            </Link>
          </Breadcrumb.Item>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            const canNavigate = !isLast && item.component && item.path;

            return (
              <Breadcrumb.Item key={`${item.path}-${index}`}>
                {canNavigate ? (
                  <Link to={item.path}>{item.meta?.title}</Link>
                ) : (
                  <span className={isLast ? "font-medium text-ink" : undefined}>
                    {item.meta?.title}
                  </span>
                )}
              </Breadcrumb.Item>
            );
          })}
        </Breadcrumb>

        <div className="min-w-0 sm:hidden">
          <p className="truncate font-display text-sm font-semibold text-ink">
            {trail.at(-1)?.meta?.title || "Testing Platform"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <div className="hidden items-center gap-2.5 pr-2 xl:flex">
          <span className="tp-header__clock">{clock}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            UTC+8
          </span>
          <span className="h-4 w-px bg-line" />
          <span className="tp-header__sla">
            <i />
            SLA 99.99%
          </span>
        </div>

        <Dropdown droplist={notificationPanel} trigger="click" position="br">
          <button
            type="button"
            className="tp-icon-button relative"
            aria-label="通知中心"
          >
            <Badge dot={unreadCount > 0} offset={[-2, 3]}>
              <IconNotification className="text-[17px]" />
            </Badge>
          </button>
        </Dropdown>

        <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />

        <Dropdown droplist={userMenu} trigger="click" position="br">
          <button
            type="button"
            className="tp-user-trigger"
            aria-label="用户菜单"
          >
            <Avatar size={32} className="tp-user-avatar">
              {user.name.slice(0, 1)}
            </Avatar>
            <span className="hidden min-w-0 text-left md:block">
              <span className="block truncate text-[12px] font-semibold leading-4 text-ink">
                {user.name}
              </span>
              <span className="block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                {user.role}
              </span>
            </span>
            <IconDown className="hidden text-[11px] text-muted md:block" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
