// client/src/components/Shop.jsx
import React from "react";
import { Button, Card } from "./ui";
import useAppStore from "../stores/appStore";
import * as petService from "../services/petService";
import { TRAITS } from "../config/traits";

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
  const {
    user,
    shop,
    buyBean,
    selectBean,
    buyTrait,
    equipTrait,
    unequipTrait,
    toggleShop,
  } = useAppStore();

  const handleBuyBean = (bean) => {
    const success = buyBean(bean.id, bean.cost);
    if (success) {
      selectBean(bean.id);
    }
  };

  const handleBuyTrait = (trait) => {
    const success = buyTrait(trait.id, trait.cost);
    if (success) {
      console.log(`Successfully purchased trait: ${trait.name}`);
    }
    return success;
  };

  const handleEquipTrait = (traitId, beanId = null) => {
    // If no specific bean provided, equip to currently selected bean
    const targetBean = beanId || shop.selectedBean;
    const success = equipTrait(targetBean, traitId);
    if (success) {
      console.log(`Equipped trait ${traitId} to bean ${targetBean}`);
    }
    return success;
  };

  const canAffordBean = (cost) => user.xp >= cost;
  const canAffordTrait = (cost) => user.xp >= cost;
  const meetsLevelRequirement = (level) => user.level >= level;
  const alreadyOwned = (beanId) => shop.ownedBeans.includes(beanId);
  const ownsTrait = (traitId) => shop.ownedTraits.includes(traitId);
  const getBeanEquippedTrait = (beanId) => shop.beanTraits[beanId]?.[0] || null;

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

      {/* Bean Section */}
      <h3 className="h5 fw-bold mb-3">🫘 Beans</h3>

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

      <div className="text-center mt-4 mb-4">
        <p className="small text-muted">
          Complete focus sessions to earn XP and level up to unlock new beans!
        </p>
      </div>

      {/* Bean Traits/Upgrades Section */}
      <hr className="my-4" />
      <h3 className="h5 fw-bold mb-3">✨ Bean Traits & Upgrades</h3>
      <p className="small text-muted mb-3">
        Enhance your beans with special traits to boost your XP earnings!
      </p>

      <div className="row g-3">
        {Object.values(TRAITS).map((trait) => {
          const affordable = canAffordTrait(trait.cost);
          const levelOk = meetsLevelRequirement(trait.unlockLevel);
          const owned = ownsTrait(trait.id);
          const canPurchase = affordable && levelOk && !owned;
          const currentBeanTrait = getBeanEquippedTrait(shop.selectedBean);
          const isEquipped = currentBeanTrait === trait.id;

          return (
            <div key={trait.id} className="col-12 col-sm-6">
              <Card
                padding="sm"
                className={`shop-item ${owned ? "border-info" : ""} ${!levelOk ? "opacity-50" : ""} ${isEquipped ? "border-success bg-success bg-opacity-10" : ""}`}
              >
                <div className="text-center">
                  <div
                    className="trait-preview mb-2"
                    style={{ fontSize: "2.5rem" }}
                  >
                    {trait.emoji}
                  </div>

                  <h5 className="fw-bold mb-1">{trait.name}</h5>
                  <p className="small text-muted mb-2">{trait.description}</p>

                  <div className="specialty mb-2">
                    <span className="badge bg-info">
                      {trait.type === "global" ? "All Tasks" : trait.type}
                    </span>
                    <span className="badge bg-success ms-1">
                      +{Math.round((trait.multiplier - 1) * 100)}% XP
                    </span>
                  </div>

                  <div className="requirements mb-3">
                    <div className="d-flex gap-1 justify-content-center">
                      <span
                        className={`badge ${levelOk ? "bg-success" : "bg-secondary"}`}
                      >
                        Level {trait.unlockLevel}
                      </span>
                      <span
                        className={`badge ${affordable || owned ? "bg-primary" : "bg-warning"}`}
                      >
                        {trait.cost} XP
                      </span>
                    </div>
                  </div>

                  {isEquipped ? (
                    <div className="d-flex flex-column gap-2">
                      <span className="badge bg-success">✅ Equipped</span>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => unequipTrait(shop.selectedBean)}
                        className="px-3"
                      >
                        Unequip
                      </Button>
                    </div>
                  ) : owned ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleEquipTrait(trait.id)}
                      className="px-3"
                      disabled={currentBeanTrait !== null} // One trait per bean
                    >
                      {currentBeanTrait ? "Bean Full" : "Equip"}
                    </Button>
                  ) : !levelOk ? (
                    <span className="badge bg-secondary">
                      🔒 Level {trait.unlockLevel} Required
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!canPurchase}
                      onClick={() => handleBuyTrait(trait)}
                      className="px-3"
                    >
                      {affordable ? "💫 Unlock Trait" : "💸 Too Expensive"}
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
          Traits can be applied to any of your beans to enhance their abilities!
        </p>
      </div>
    </div>
  );
};

export default Shop;
