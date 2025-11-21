const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Import XP configuration and helper functions
const {
  XP_CONFIG,
  expToNext,
  calculatePetLevel,
  computeAward,
  // validateSessionTiming, // Decide if needed here
} = require("./src/config/xpConfig");

/**
 * Cloud Function triggered when a new session document is created.
 * This function calculates and awards XP and updates user/pet state.
 */
exports.processSessionCompletion = onDocumentCreated(
    "users/{userId}/sessions/{sessionId}",
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) {
        logger.error("No data associated with the event");
        return;
      }

      const sessionData = snapshot.data();
      const {userId, sessionId} = event.params;

      logger.info(
          `Processing session ${sessionId} for user ${userId}`,
          sessionData,
      );

      const {
        durationMinutes,
        completed,
        // goalId,
        isBreak,
        taskCompleted = false,
        // clientStartAt, //For potential future validation
        // clientEndAt, //For potential future validation
      } = sessionData;

      if (isBreak || !completed || durationMinutes <= 0) {
        logger.info(
            `Session ${sessionId} is a break, incomplete,` +
          ` or too short. No XP awarded.`,
        );
        await snapshot.ref.update({
          processed: true,
          xpAwarded: 0,
          petXPAwarded: 0,
        });
        return null;
      }

      const userRef = db.collection("users").doc(userId);
      const petsCollectionRef = userRef.collection("pets");

      return db
          .runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
              logger.error(`User ${userId} not found.`);
              throw new HttpsError("not-found", `User ${userId} not found.`);
            }

            const userState = userDoc.data();
            userState.uid = userDoc.id; // Ensure UID is part of state

            // Fetch active pet data
            const activePetId = userState.selectedPet || "bean-0";
            const activePetDocRef = petsCollectionRef.doc(activePetId);
            const activePetDoc = await transaction.get(activePetDocRef);

            const activePetState = activePetDoc.exists ?
          activePetDoc.data() :
          {
            id: activePetId,
            type: activePetId,
            xp: 0,
            level: 1,
            totalSessions: 0,
          };
            // Ensure pet exists in subcollection if it was just initialised
            if (!activePetDoc.exists) {
              transaction.set(activePetDocRef, activePetState);
            }

            // Ensure initial xpService state is present for XP calculation
            if (!userState.xp) userState.xp = 0;
            if (!userState.level) userState.level = 1;
            if (!userState.currentStreak) userState.currentStreak = 0;
            if (!userState.totalSessions) userState.totalSessions = 0;

            // TODO: Add validateSessionTiming here
            // (requires client to send
            // clientStartAt/clientEndAt and the server
            // to capture its own start time if doing full server-side
            // validation)

            // Compute authoritative XP award
            const award = computeAward({
              minutes: durationMinutes,
              isBreak: false,
              taskCompleted,
              currentStreak: userState.currentStreak,
              // For more advanced anti-farming, we'd need to fetch
              // recent session history
              // recentShortSessionsCount: countRecentShortSessions
              // (userState.sessionsHistory),
              user: userState, // Pass full user state
              // for potential future logic
            });

            // Update user state
            const oldLevel = userState.level;
            userState.xp += award.awardedXP;
            userState.totalSessions += 1;

            // Recalculate level based on new XP
            userState.level = 1; // Reset to 1 for recalculation
            let tempXp = userState.xp;
            while (tempXp >= expToNext(userState.level)) {
              tempXp -= expToNext(userState.level);
              userState.level += 1;
            }
            const levelUp = userState.level > oldLevel;

            // Update current streak
            if (completed && durationMinutes >= XP_CONFIG.minEffectiveMinutes) {
              userState.currentStreak += 1;
            } else {
              userState.currentStreak = 0; // Reset streak on incomplete
              // or short sessions
            }

            // Update active pet XP and level
            const oldPetLevel = activePetState.level;
            activePetState.xp += award.petXP;
            activePetState.level = calculatePetLevel(activePetState.xp);
            activePetState.totalSessions =
            (activePetState.totalSessions || 0) + 1;
            const petLevelUp = activePetState.level > oldPetLevel;

            // Update Firestore documents
            transaction.update(userRef, {
              xp: userState.xp,
              level: userState.level,
              totalSessions: userState.totalSessions,
              currentStreak: userState.currentStreak,
              // Add other user fields as needed
            });

            transaction.update(activePetDocRef, {
              xp: activePetState.xp,
              level: activePetState.level,
              totalSessions: activePetState.totalSessions,
            });

            // Update the session document to mark as
            // processed and record awards
            transaction.update(snapshot.ref, {
              processed: true,
              xpAwarded: award.awardedXP,
              petXPAwarded: award.petXP,
              levelUp,
              petLevelUp,
              awardedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(
                `Session ${sessionId} processed. 
                Awarded User XP: ${award.awardedXP}, 
                Pet XP: ${award.petXP}. 
                User Level: ${userState.level}, 
                Pet Level: ${activePetState.level}`,
            );

            return {
              awardedXP: award.awardedXP,
              petXP: award.petXP,
              levelUp,
              petLevelUp,
              newUserLevel: userState.level,
              newPetLevel: activePetState.level,
            };
          })
          .catch((error) => {
            logger.error(`Transaction failed for session ${sessionId}:`, error);
            // Optionally update session document to indicate processing failure
            // Ensure this update doesn't trigger infinite loops
            // if the function is retried on failures
            snapshot.ref.update({
              processed: false,
              error: error.message,
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return null;
          });
    },
);
