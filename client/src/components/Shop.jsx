// client/src/components/Shop.jsx
import React from "react";
import { Button, Card } from "./ui";
import useAppStore from "../stores/appStore";
import * as petService from "../services/petService";

// Bean shop data
const BEAN_SHOP = [
  {
    id: "bean-1",
    name: "Happy Bean",
    description: "A cheerful companion for your focus sessions",
    cost: 500,
    level: 3,
    emoji: "😊",
  },
  {
    id: "bean-2",
    name: "Zen Bean",
    description: "Find inner peace while you work",
    cost: 1000,
    level: 8,
    emoji: "🧘",
  },
  {
    id: "bean-3",
    name: "Rocket Bean",
    description: "Blast off to productivity!",
    cost: 2000,
    level: 15,
    emoji: "🚀",
  },
  {
    id: "bean-4",
    name: "Galaxy Bean",
    description: "Reach for the stars with this cosmic companion",
    cost: 5000,
    level: 25,
    emoji: "🌌",
  },
];

const Shop = ({ showCloseButton = true }) => {
  const { user, shop, pets, buyBean, selectBean, unlockPet, toggleShop } =
    useAppStore();

  const handleBuyBean = (bean) => {
    const success = buyBean(bean.id, bean.cost);
    if (success) {
      selectBean(bean.id);
    }
  };

  const handleUnlockCompanion = (companionType) => {
    const success = unlockPet(companionType);
    if (success) {
      // Auto-select the newly unlocked companion
      const updatedPets = petService.getAllPets();
      const companionKeys = Object.keys(updatedPets).filter((key) =>
        key.includes(companionType),
      );
      if (companionKeys.length > 0) {
        petService.setSelectedPetId(companionKeys[0]);
      }
    }
  };

  const canAffordBean = (cost) => user.xp >= cost;
  const meetsLevelRequirement = (level) => user.level >= level;
  const alreadyOwned = (beanId) => shop.ownedBeans.includes(beanId);

  // Get unlockable companions
  const unlockableCompanions = petService.getUnlockablePets(user.xp);
  const affordableCompanions = unlockableCompanions.filter(
    (pet) => pet.canAfford,
  );
  const expensiveCompanions = unlockableCompanions.filter(
    (pet) => !pet.canAfford,
  );

  return (
    <div className="shop-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold mb-0">🏪 Bean Shop</h2>
        <div className="d-flex align-items-center gap-3">
          <div className="text-muted">💰 {user.xp} XP</div>
          {showCloseButton && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleShop}
              className="p-1"
              aria-label="Close shop"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      <div className="row g-3">
        {BEAN_SHOP.map((bean) => {
          const owned = alreadyOwned(bean.id);
          const affordable = canAffordBean(bean.cost);
          const levelOk = meetsLevelRequirement(bean.level);
          const canPurchase = affordable && levelOk && !owned;

          return (
            <div key={bean.id} className="col-12 col-sm-6">
              <Card
                padding="sm"
                className={`shop-item ${owned ? "border-success" : ""} ${!levelOk ? "opacity-50" : ""}`}
              >
                <div className="text-center">
                  <div
                    className="bean-preview mb-2"
                    style={{ fontSize: "3rem" }}
                  >
                    {bean.emoji}
                  </div>

                  <h5 className="fw-bold mb-1">{bean.name}</h5>
                  <p className="small text-muted mb-2">{bean.description}</p>

                  <div className="requirements mb-3">
                    <div className="d-flex gap-1 justify-content-center">
                      <span
                        className={`badge ${levelOk ? "bg-success" : "bg-secondary"}`}
                      >
                        Level {bean.level}
                      </span>
                      <span
                        className={`badge ${affordable || owned ? "bg-primary" : "bg-warning"}`}
                      >
                        {bean.cost} XP
                      </span>
                    </div>
                  </div>

                  {owned ? (
                    <div className="d-flex flex-column gap-2">
                      <span className="badge bg-success">✅ Owned</span>
                      <Button
                        size="sm"
                        variant={
                          shop.selectedBean === bean.id
                            ? "primary"
                            : "secondary"
                        }
                        onClick={() => selectBean(bean.id)}
                        className="px-3"
                      >
                        {shop.selectedBean === bean.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  ) : !levelOk ? (
                    <span className="badge bg-secondary">
                      🔒 Level {bean.level} Required
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!canPurchase}
                      onClick={() => handleBuyBean(bean)}
                      className="px-3"
                    >
                      {affordable ? "💰 Buy" : "💸 Too Expensive"}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-4">
        <p className="small text-muted">
          Complete focus sessions to earn XP and level up to unlock new beans!
        </p>
      </div>

      {/* Companions Section */}
      {(affordableCompanions.length > 0 || expensiveCompanions.length > 0) && (
        <>
          <hr className="my-4" />
          <h3 className="h5 fw-bold mb-3">🐾 Companions</h3>

          {/* Affordable Companions */}
          {affordableCompanions.length > 0 && (
            <div className="mb-4">
              <h6 className="text-success mb-3">
                <i className="fas fa-coins me-1"></i>
                Ready to Unlock ({affordableCompanions.length})
              </h6>

              <div className="row g-3">
                {affordableCompanions.map((companion) => (
                  <div key={companion.id} className="col-12 col-sm-6">
                    <Card padding="sm" className="shop-item border-success">
                      <div className="text-center">
                        <div
                          className="companion-preview mb-2"
                          style={{ fontSize: "3rem" }}
                        >
                          {companion.emoji}
                        </div>

                        <h5 className="fw-bold mb-1 text-success">
                          {companion.name}
                        </h5>
                        <p className="small text-muted mb-2">
                          {companion.description}
                        </p>

                        <div className="specialty mb-2">
                          <span className="badge bg-primary">
                            {companion.specialty}
                            {companion.xpBonus &&
                              companion.specialty !== "general" && (
                                <span className="ms-1">
                                  +{Math.round((companion.xpBonus - 1) * 100)}%
                                  XP
                                </span>
                              )}
                          </span>
                        </div>

                        <div className="price mb-3">
                          <span className="badge bg-success">
                            {companion.unlockCost} XP
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleUnlockCompanion(companion.id)}
                          className="px-3"
                        >
                          🔓 Unlock Companion
                        </Button>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon Companions */}
          {expensiveCompanions.length > 0 && (
            <div className="mb-4">
              <h6 className="text-warning mb-3">
                <i className="fas fa-star me-1"></i>
                Coming Soon ({expensiveCompanions.length})
              </h6>

              <div className="row g-3">
                {expensiveCompanions.map((companion) => {
                  const xpNeeded = companion.unlockCost - user.xp;
                  return (
                    <div key={companion.id} className="col-12 col-sm-6">
                      <Card
                        padding="sm"
                        className="shop-item border-warning opacity-75"
                      >
                        <div className="text-center">
                          <div
                            className="companion-preview mb-2"
                            style={{
                              fontSize: "3rem",
                              filter: "grayscale(100%)",
                            }}
                          >
                            {companion.emoji}
                          </div>

                          <h5 className="fw-bold mb-1 text-muted">
                            {companion.name}
                          </h5>
                          <p className="small text-muted mb-2">
                            {companion.description}
                          </p>

                          <div className="specialty mb-2">
                            <span className="badge bg-secondary">
                              {companion.specialty}
                              {companion.xpBonus &&
                                companion.specialty !== "general" && (
                                  <span className="ms-1">
                                    +{Math.round((companion.xpBonus - 1) * 100)}
                                    % XP
                                  </span>
                                )}
                            </span>
                          </div>

                          <div className="price mb-2">
                            <span className="badge bg-warning">
                              {companion.unlockCost} XP
                            </span>
                          </div>

                          <div className="small text-danger mb-2">
                            Need {xpNeeded} more XP
                          </div>

                          <Button
                            size="sm"
                            variant="outline-warning"
                            disabled
                            className="px-3"
                          >
                            🔒 Locked
                          </Button>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;
