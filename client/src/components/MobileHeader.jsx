// client/src/components/MobileHeader.jsx
import React from "react";
import useAppStore from "../stores/appStore";

const MobileHeader = () => {
  const { user } = useAppStore();

  return (
    <div className="mobile-header d-md-none">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between">
          {/* Brand */}
          <div className="mobile-nav-brand">
            <h1 className="h5 fw-bold mb-0 text-primary">
              🌱 Focus Friendship
            </h1>
          </div>

          {/* User Info */}
          <div className="mobile-user-info text-end">
            <div className="small text-muted">Level {user.level}</div>
            <div className="small fw-bold">{user.xp} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
