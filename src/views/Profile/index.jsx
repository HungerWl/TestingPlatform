import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Form,
  Input,
  Message,
  Modal,
  Switch,
  Tabs,
} from "@arco-design/web-react";
import {
  IconCalendar,
  IconEdit,
  IconEmail,
  IconIdcard,
  IconLocation,
  IconLock,
  IconNotification,
  IconPhone,
  IconSafe,
  IconUser,
} from "@arco-design/web-react/icon";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import StatusTag from "../../components/common/StatusTag";
import { getCurrentUser } from "../../utils/auth";
import { formatDateTime } from "../../utils/format";

const PROFILE_STATS = [
  { label: "参与项目", value: "12", suffix: "个" },
  { label: "维护用例", value: "860", suffix: "条" },
  { label: "发现缺陷", value: "47", suffix: "个" },
  { label: "自动化覆盖", value: "92", suffix: "%" },
];

const NOTIFICATION_ITEMS = [
  {
    key: "testResult",
    title: "测试结果通知",
    desc: "当任务执行结束、通过率低于阈值或出现阻塞缺陷时通知我。",
    defaultValue: true,
  },
  {
    key: "mention",
    title: "提及与评论",
    desc: "当有人在用例、任务或缺陷中 @我 时通知我。",
    defaultValue: true,
  },
  {
    key: "weekly",
    title: "每周质量简报",
    desc: "每周一 09:00 推送质量趋势、资产变化和重点风险。",
    defaultValue: false,
  },
  {
    key: "environment",
    title: "环境告警",
    desc: "Production / Staging 探针异常或延迟超过阈值时通知我。",
    defaultValue: true,
  },
];

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === "preferences" ? "notice" : "basic",
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [twoFactor, setTwoFactor] = useState(true);
  const [notificationState, setNotificationState] = useState(() =>
    Object.fromEntries(
      NOTIFICATION_ITEMS.map((item) => [item.key, item.defaultValue]),
    ),
  );

  useEffect(() => {
    if (location.state?.tab === "preferences") setActiveTab("notice");
  }, [location.state]);

  return (
    <div className="tp-page space-y-5">
      <PageHeader
        eyebrow="OPERATOR PROFILE / 01"
        meta={`ID ${user.id} · ${user.location}`}
        title="个人中心"
        description="管理你的质量工作身份、安全策略与通知偏好。你的个人数据仅对当前工作空间可见。"
      />
    </div>
  );
}
