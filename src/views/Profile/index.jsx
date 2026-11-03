import { getCurrentUser } from "../../utils/auth";
import PageHeader from "../../components/common/PageHeader";
import "./index.scss";

export default function Profile() {
  const user = getCurrentUser();

  return (
    <div className="tp-page space-y-5">
      <PageHeader
        eyebrow="OPERATOR PROFILE / 01"
        meta={`ID ${user.id} · ${user.location}`}
        title="个人中心"
        description="管理你的质量工作身份、安全策略与通知偏好。你的个人数据仅对当前工作空间可见。"
      />
      <div className="overflow-hidden rounded-panel border border-line bg-paper-card shadow-panel">
        <video
          className="profile-page__video"
          src="/deepseek.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}