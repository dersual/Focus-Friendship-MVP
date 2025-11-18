import React, { useEffect } from "react";
import Timer from "./components/Timer";
import CutieBean from "./components/CutieBean";
import Shop from "./components/Shop";
import Goals from "./components/Goals";
import BottomNav from "./components/BottomNav";
import DesktopNav from "./components/DesktopNav";
import MobileHeader from "./components/MobileHeader";
import { Card } from "./components/ui";
import useAppStore from "./stores/appStore";

function App() {
  const { ui, shop, initializeApp, toggleShop } = useAppStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Handle closing shop when clicking on overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      toggleShop();
    }
  };

  // Handle ESC key to close shop
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && shop.isOpen) {
        toggleShop();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [shop.isOpen, toggleShop]);

  const renderMainContent = () => {
    // Desktop: Show shop as modal when isOpen
    // Mobile: Show shop as full screen when currentPage is 'shop'
    const showShopAsModal = shop.isOpen;
    const showShopAsScreen = ui.currentPage === "shop";

    // Desktop modal takes precedence
    if (showShopAsModal) {
      return (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <Card>
              <Shop showCloseButton={true} />
            </Card>
          </div>
        </div>
      );
    }

    // Mobile shop screen
    if (showShopAsScreen) {
      return (
        <div className="row justify-content-center">
          <div className="col-12">
            <Card>
              <Shop showCloseButton={false} />
            </Card>
          </div>
        </div>
      );
    }

    // Mobile: Show based on current page, Desktop: Show all components
    return (
      <div className="row g-3 g-md-4">
        {/* CutieBean - Always visible on desktop, conditional on mobile */}
        <div
          className={`col-12 col-lg-4 order-1 order-lg-1 ${getMobileVisibility("timer", "profile")}`}
        >
          <Card hover>
            <CutieBean />
          </Card>
        </div>

        {/* Timer - Always visible on desktop, show when timer page on mobile */}
        <div
          className={`col-12 col-lg-4 order-2 order-lg-2 ${getMobileVisibility("timer")}`}
        >
          <Card>
            <Timer />
          </Card>
        </div>

        {/* Goals - Always visible on desktop, show when goals page on mobile */}
        <div
          className={`col-12 col-lg-4 order-3 order-lg-3 ${getMobileVisibility("goals")}`}
        >
          <Card hover>
            <Goals />
          </Card>
        </div>

        {/* Mobile-only: Profile view */}
        {ui.currentPage === "profile" && (
          <div className="col-12 d-lg-none">
            <Card>
              <div className="text-center">
                <CutieBean />
                <div className="mt-4">
                  <h5 className="fw-bold">Profile Settings</h5>
                  <p className="text-muted">
                    Coming soon! More profile features will be added here.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // Helper function to determine mobile visibility
  const getMobileVisibility = (...pages) => {
    const isVisible = pages.includes(ui.currentPage);
    return `d-lg-block ${isVisible ? "d-block" : "d-none d-lg-block"}`;
  };

  // Determine if we should show the modal (desktop only)
  const showModal = shop.isOpen;

  return (
    <div className="app-container bg-background text-text">
      {/* Desktop Navigation */}
      <DesktopNav />

      {/* Mobile Header */}
      <MobileHeader />

      <div className="main-content">
        <div className="container-fluid">{renderMainContent()}</div>
      </div>

      {/* Mobile Navigation */}
      <BottomNav />

      {/* Shop Modal - Show only on desktop when shop is open */}
      {showModal && (
        <div className="shop-modal-overlay" onClick={handleOverlayClick}>
          <div className="shop-modal">
            <Shop showCloseButton={true} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
