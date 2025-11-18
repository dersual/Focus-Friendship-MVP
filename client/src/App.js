import React, { useEffect } from "react";
import Timer from "./components/Timer";
import CutieBean from "./components/CutieBean";
import Shop from "./components/Shop";
import Goals from "./components/Goals";
import BottomNav from "./components/BottomNav";
import { Card } from "./components/ui";
import useAppStore from "./stores/appStore";

function App() {
  const { ui, shop, initializeApp } = useAppStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const renderMainContent = () => {
    if (shop.isOpen) {
      return (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <Card>
              <Shop />
            </Card>
          </div>
        </div>
      );
    }

    // Default layout for timer page
    return (
      <div className="row g-3 g-md-4">
        {/* Desktop: show all components, Mobile: show based on current page */}
        <div
          className={`col-12 col-lg-4 order-1 order-lg-1 ${ui.currentPage !== "profile" ? "d-block" : "d-none d-lg-block"}`}
        >
          <Card hover>
            <CutieBean />
          </Card>
        </div>

        <div
          className={`col-12 col-lg-4 order-2 order-lg-2 ${ui.currentPage === "timer" ? "d-block" : "d-none d-lg-block"}`}
        >
          <Card>
            <Timer />
          </Card>
        </div>

        <div
          className={`col-12 col-lg-4 order-3 order-lg-3 ${ui.currentPage === "goals" ? "d-block" : "d-none d-lg-block"}`}
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

  return (
    <div className="app-container bg-background text-text">
      <div className="main-content">
        <h1 className="app-title text-center fw-bold mb-4 mb-md-5">
          🌱 Focus Friendship
        </h1>

        {renderMainContent()}
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
