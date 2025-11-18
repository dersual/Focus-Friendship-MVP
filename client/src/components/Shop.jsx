// client/src/components/Shop.jsx
import React from "react";
import { Button, Card } from "./ui";
import useAppStore from "../stores/appStore";

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

const Shop = () => {
  const { user, shop, buyBean, selectBean, toggleShop } = useAppStore();

  const handleBuyBean = (bean) => {
    const success = buyBean(bean.id, bean.cost);
    if (success) {
      selectBean(bean.id);
    }
  };

  const canAffordBean = (cost) => user.xp >= cost;
  const meetsLevelRequirement = (level) => user.level >= level;
  const alreadyOwned = (beanId) => shop.ownedBeans.includes(beanId);

  return (
    <div className="shop-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold mb-0">🏪 Bean Shop</h2>
        <div className="text-muted">💰 {user.xp} XP</div>
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
    </div>
  );
};

export default Shop;
