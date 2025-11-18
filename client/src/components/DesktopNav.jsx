// client/src/components/DesktopNav.jsx
import React from "react";
import { Button } from "./ui";
import useAppStore from "../stores/appStore";

const DesktopNav = () => {
  const { ui, shop, user, setCurrentPage, toggleShop } = useAppStore();

  const handleNavClick = (page) => {
    if (page === "shop") {
      toggleShop();
    } else {
      // Close shop if open when navigating to other pages
      if (shop.isOpen) {
        toggleShop();
      }
      setCurrentPage(page);
    }
  };

  return (
    <div className="desktop-nav d-none d-md-flex mb-4">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between">
          <div className="nav-brand">
            <h1 className="h4 fw-bold mb-0 text-primary">
              🌱 Focus Friendship
            </h1>
          </div>

          <div className="user-info d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="small text-muted">Level {user.level}</div>
              <div className="fw-bold">{user.xp} XP</div>
            </div>

            <Button
              variant={shop.isOpen ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleNavClick("shop")}
              className="d-flex align-items-center gap-1"
            >
              🏪 Shop
            </Button>

            <div className="user-avatar">👤</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopNav;
