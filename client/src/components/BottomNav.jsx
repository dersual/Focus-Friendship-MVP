// client/src/components/BottomNav.jsx
import React from "react";
import useAppStore from "../stores/appStore";

const BottomNav = () => {
  const { ui, setCurrentPage } = useAppStore();

  const navItems = [
    { id: "timer", label: "Timer", icon: "⏲️" },
    { id: "goals", label: "Goals", icon: "🎯" },
    { id: "shop", label: "Shop", icon: "🏪" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const handleNavClick = (id) => {
    if (id === "shop") {
      // Mobile: treat shop as a regular page
      setCurrentPage("shop");
    } else {
      setCurrentPage(id);
    }
  };

  // Only show on mobile devices
  return (
    <div className="bottom-nav d-md-none">
      <div className="container-fluid">
        <div className="row g-0 justify-content-center">
          {navItems.map((item) => (
            <div key={item.id} className="col d-flex justify-content-center">
              <button
                className={`bottom-nav-item ${
                  ui.currentPage === item.id ? "active" : ""
                }`}
                onClick={() => handleNavClick(item.id)}
                aria-label={item.label}
              >
                <div className="nav-icon">{item.icon}</div>
                <div className="nav-label">{item.label}</div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
