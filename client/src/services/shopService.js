// client/src/services/shopService.js

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

// Initial shop state structure for a new user
const initialShopState = {
  ownedBeans: ["bean-0"], // Default starting bean
  selectedBean: "bean-0",
  ownedTraits: [],
  beanTraits: {}, // { "bean-id": ["trait-id"] }
};

/**
 * Fetches the user's shop data from Firestore. If it doesn't exist, initializes it.
 * @param {string} uid The user ID.
 * @returns {Promise<object>} The user's shop data.
 */
export const getShopData = async (uid) => {
  if (!uid) {
    console.error("getShopData called without a UID.");
    return initialShopState;
  }

  const shopRef = doc(db, "users", uid, "shop", "data"); // Store shop data in a subcollection under user
  const shopSnap = await getDoc(shopRef);

  if (shopSnap.exists()) {
    return { ...initialShopState, ...shopSnap.data() };
  } else {
    // If shop data doesn't exist, create it
    await setDoc(shopRef, initialShopState);
    return initialShopState;
  }
};

/**
 * Updates a portion of the user's shop data in Firestore.
 * @param {string} uid The user ID.
 * @param {object} data The data to update.
 * @returns {Promise<void>}
 */
const updateShopData = async (uid, data) => {
  if (!uid) {
    console.error("updateShopData called without a UID.");
    return;
  }
  const shopRef = doc(db, "users", uid, "shop", "data");
  await updateDoc(shopRef, data);
};

/**
 * Adds a bean to the user's owned beans.
 * @param {string} uid The user ID.
 * @param {string} beanId The ID of the bean to buy.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const buyBean = async (uid, beanId) => {
  if (!uid) return false;

  const shopData = await getShopData(uid);
  if (shopData.ownedBeans.includes(beanId)) {
    console.warn(`Bean ${beanId} already owned.`);
    return false;
  }

  await updateShopData(uid, { ownedBeans: arrayUnion(beanId) });
  return true;
};

/**
 * Sets the currently selected bean.
 * @param {string} uid The user ID.
 * @param {string} beanId The ID of the bean to select.
 * @returns {Promise<void>}
 */
export const selectBean = async (uid, beanId) => {
  if (!uid) return;
  await updateShopData(uid, { selectedBean: beanId });
};

/**
 * Adds a trait to the user's owned traits.
 * @param {string} uid The user ID.
 * @param {string} traitId The ID of the trait to buy.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const buyTrait = async (uid, traitId) => {
  if (!uid) return false;

  const shopData = await getShopData(uid);
  if (shopData.ownedTraits.includes(traitId)) {
    console.warn(`Trait ${traitId} already owned.`);
    return false;
  }

  await updateShopData(uid, { ownedTraits: arrayUnion(traitId) });
  return true;
};

/**
 * Equips a trait to a specific bean.
 * @param {string} uid The user ID.
 * @param {string} beanId The ID of the bean.
 * @param {string} traitId The ID of the trait to equip.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const equipTrait = async (uid, beanId, traitId) => {
  if (!uid) return false;

  const shopData = await getShopData(uid);
  if (!shopData.ownedTraits.includes(traitId)) {
    console.warn(`Trait ${traitId} not owned.`);
    return false;
  }

  const updatedBeanTraits = {
    ...shopData.beanTraits,
    [beanId]: [traitId], // Simple: one trait per bean for now
  };
  await updateShopData(uid, { beanTraits: updatedBeanTraits });
  return true;
};

/**
 * Unequips a trait from a specific bean.
 * @param {string} uid The user ID.
 * @param {string} beanId The ID of the bean.
 * @returns {Promise<void>}
 */
export const unequipTrait = async (uid, beanId) => {
  if (!uid) return;

  const shopData = await getShopData(uid);
  const updatedBeanTraits = {
    ...shopData.beanTraits,
    [beanId]: [], // Remove all traits from bean
  };
  await updateShopData(uid, { beanTraits: updatedBeanTraits });
};
