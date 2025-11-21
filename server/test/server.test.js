// server/test/server.test.js
const request = require("supertest");
const app = require("../index");

describe("Focus Friends Server API", () => {
  describe("POST /api/sessions", () => {
    it("should accept and record a session", async () => {
      const sessionData = {
        sessionId: "test-session-123",
        userId: "test-user",
        startTime: Date.now() - 60000, // 1 minute ago
        endTime: Date.now(),
        durationMinutes: 1,
        isBreak: false,
        goalId: "test-goal",
        xpGained: 10,
      };

      const response = await request(app)
        .post("/api/sessions")
        .send(sessionData)
        .expect(200);

      expect(response.body.message).toBe("Session recorded successfully");
      expect(response.body.session).toMatchObject({
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        durationMinutes: sessionData.durationMinutes,
        isBreak: sessionData.isBreak,
        xpGained: sessionData.xpGained,
      });
    });

    it("should validate required session fields", async () => {
      const invalidSession = {
        sessionId: "test-session-456",
        // missing required fields
      };

      const response = await request(app)
        .post("/api/sessions")
        .send(invalidSession)
        .expect(400);

      expect(response.body.error).toContain("Missing required fields");
    });

    it("should handle break sessions correctly", async () => {
      const breakSession = {
        sessionId: "break-session-789",
        userId: "test-user",
        startTime: Date.now() - 300000, // 5 minutes ago
        endTime: Date.now(),
        durationMinutes: 5,
        isBreak: true,
        goalId: null,
        xpGained: 0,
      };

      const response = await request(app)
        .post("/api/sessions")
        .send(breakSession)
        .expect(200);

      expect(response.body.session.isBreak).toBe(true);
      expect(response.body.session.xpGained).toBe(0);
    });
  });

  describe("POST /api/user/sync", () => {
    it("should accept user state updates", async () => {
      const userState = {
        userId: "test-user",
        level: 2,
        xp: 150,
        totalSessions: 15,
        totalMinutes: 300,
        currentStreak: 3,
        selectedBean: "purple",
      };

      const response = await request(app)
        .post("/api/user/sync")
        .send(userState)
        .expect(200);

      expect(response.body.message).toBe("User state synced successfully");
      expect(response.body.user).toMatchObject({
        userId: userState.userId,
        level: userState.level,
        xp: userState.xp,
        totalSessions: userState.totalSessions,
      });
    });

    it("should validate user state fields", async () => {
      const invalidUserState = {
        userId: "test-user",
        level: -1, // invalid level
        xp: "not-a-number", // invalid xp
      };

      const response = await request(app)
        .post("/api/user/sync")
        .send(invalidUserState)
        .expect(400);

      expect(response.body.error).toContain("Invalid user state data");
    });
  });

  describe("GET /api/user/state/:userId", () => {
    it("should return user state (development endpoint)", async () => {
      const response = await request(app)
        .get("/api/user/state/test-user")
        .expect(200);

      expect(response.body).toHaveProperty("userId");
      expect(response.body).toHaveProperty("level");
      expect(response.body).toHaveProperty("xp");
    });
  });

  describe("GET /api/sessions/:userId", () => {
    it("should return user sessions (development endpoint)", async () => {
      const response = await request(app)
        .get("/api/sessions/test-user")
        .expect(200);

      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body).toHaveProperty("total");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/sessions/test-user?page=1&limit=5")
        .expect(200);

      expect(response.body.sessions.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty("page", 1);
      expect(response.body).toHaveProperty("limit", 5);
    });
  });

  describe("CORS and Middleware", () => {
    it("should include CORS headers", async () => {
      const response = await request(app).options("/api/sessions").expect(204);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST",
      );
    });

    it("should parse JSON bodies", async () => {
      const sessionData = {
        sessionId: "json-test-session",
        userId: "test-user",
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        durationMinutes: 1,
        isBreak: false,
        goalId: null,
        xpGained: 10,
      };

      const response = await request(app)
        .post("/api/sessions")
        .send(sessionData)
        .expect(200);

      expect(response.body.session.sessionId).toBe(sessionData.sessionId);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown routes", async () => {
      const response = await request(app)
        .get("/api/unknown-endpoint")
        .expect(404);

      expect(response.body.error).toBe("Endpoint not found");
    });

    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/sessions")
        .set("Content-Type", "application/json")
        .send("{ invalid json")
        .expect(500); // Express throws 500 for JSON parsing errors, which is correct
    });
  });
});
