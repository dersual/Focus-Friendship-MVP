# Focus Friendship

---

## For Our Users

Welcome to Focus Friendship! This application is designed to help you stay focused and productive by turning your focus sessions into a fun and rewarding game.

### What is Focus Friendship?

Focus Friendship is a web application that uses a Pomodoro-style timer to help you manage your work and break times. As you complete focus sessions, you'll earn XP, level up, and watch your digital companion grow.

### Key Features

-   **Pomodoro Timer:** A customizable timer to help you stay on track.
-   **Digital Companion:** Your personal focus pet that evolves as you do.
-   **XP and Leveling System:** Earn experience points for every completed focus session.
-   **Focus Streaks:** Build up a streak of consecutive focus sessions to earn bonus XP. Be careful—breaking your focus will reset your streak!
-   **Goal Setting:** Define your personal goals and set a target number of Pomodoro sessions to complete them.
-   **Social Integration (Coming Soon):** Connect with friends, schedule focus sessions on Google Calendar, and stay motivated together.

---

## For Developers

This section contains information for developers who want to contribute to or run the project locally.

### Technology Stack

-   **Frontend:** React (with JavaScript)
-   **Styling:** Bootstrap and Custom CSS
-   **Backend:** Node.js with Express.js
-   **Package Manager:** npm

### Getting Started

Follow these instructions to set up and run the project locally.

#### Prerequisites

-   Node.js (LTS version recommended)
-   npm (comes with Node.js)

#### Installation & Running

1.  **Clone the repository and navigate into it.**

2.  **Client (Frontend):**
    ```bash
    cd client
    npm install
    npm start
    ```
    The client will be available at `http://localhost:8080`.

3.  **Server (Backend):**
    ```bash
    cd server
    npm install
    npm start
    ```
    The server will run on `http://localhost:3001`.

### Testing

#### Unit Tests (Client)

To run unit tests for the client-side services (e.g., `xpService`):
```bash
cd client
npm test
```

#### End-to-End Tests (Client)

To run end-to-end tests (e.g., for penalty behavior):
```bash
cd client
npm run test:e2e
```
**Note:** Ensure both the client (`npm start` in `client/`) and the server (`npm start` in `server/`) are running before executing E2E tests.

### Penalty Policy

The application includes a penalty system for intentionally stopping a timer or leaving the page during an active focus session.
*   **Manual Stop:** Stopping an active timer will incur a 10 XP penalty and reset your focus streak after confirmation.
*   **Page Leave:** Leaving the application tab/window (visibilityState becomes 'hidden') during an active session will trigger an 8-second grace period. If the user does not return within this period, a 10 XP penalty will be applied, and your focus streak will be reset.

#### Disabling Penalties

You can disable penalties via a settings toggle within the application's UI. (This feature will be implemented in a future update.)