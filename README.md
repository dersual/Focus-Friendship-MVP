# Focus Friendship

---

## For Our Users

Welcome to Focus Friendship! This application is designed to help you stay focused and productive by turning your focus sessions into a fun and rewarding game.

### What is Focus Friendship?

Focus Friendship is a web application that uses a Pomodoro-style timer to help you manage your work. As you complete focus sessions, you'll earn XP to level up your collection of digital companions.

### Core Features (Phase 1 & 2)

-   **Pomodoro Timer:** A customizable timer to help you stay on track.
-   **Goal Setting:** Define your personal goals and track your progress by completing focus sessions.
-   **Evolving Digital Companions:** Unlock a variety of unique pets. Watch them visibly evolve into new forms as you stick to your goals.
-   **Pet Collection:** Switch between your unlocked companions to choose the one that best motivates you for the day.
-   **XP & Leveling System:** Earn experience points for every completed focus session to level up your pets.

### Future Features (Phase 3)

-   **Social Integration:** In a future update, you'll be able to connect with friends, schedule focus sessions together, and keep each other accountable.

---

## For Developers

This section contains information for developers who want to contribute to or run the project locally.

### Technology Stack

-   **Frontend:** React (with JavaScript)
-   **Backend:** Firebase (Authentication, Firestore, Cloud Functions)
-   **Package Manager:** npm

### Getting Started

#### Prerequisites
-   Node.js (v24.x recommended, to match the deployment environment)
-   npm (comes with Node.js)
-   Firebase CLI: `npm install -g firebase-tools`
-   A Firebase Project: Set up a new project in the Firebase Console (console.firebase.google.com).

#### Running the App Locally with Emulators (Recommended)

This is the recommended way to develop locally, as it completely isolates your local work from your live Firebase project, prevents accidental data corruption, and speeds up iteration for Cloud Functions.

1.  **Firebase Project Setup (Initial Configuration):**
    *   *You still need your Firebase project's web configuration (`apiKey`, `projectId`, etc.) in your `client/.env` file.* This is because the Firebase SDK needs these details to initialize, even if it then redirects to the emulators.
    *   If you haven't already, follow step 1 from "Running the App Locally (Using Live Firebase - Alternative)" below to create your `client/.env` file.

2.  **Functions Setup:**
    *   The Firebase CLI will automatically download the necessary emulator binaries the first time you run the emulators.
    *   Navigate to the `functions` directory and install its dependencies:
    ```bash
    cd functions
    npm install
    ```

3.  **Start Firebase Emulators:**
    *   Open a **new terminal** window/tab.
    *   Navigate to your project root (e.g., `cd Focus-Friends-MVP-1`).
    *   Start the emulators using the `serve` script defined in `functions/package.json`. This will simulate Firebase Authentication, Firestore, and Cloud Functions locally.
    ```bash
    npm run serve
    ```
    *   Keep this terminal window open; the emulators must be running for your app to connect to them.

4.  **Client Setup (if not already done):**
    *   Navigate to the `client` directory and install its dependencies:
    ```bash
    cd client
    npm install
    ```

5.  **Run the Client:**
    *   Open another **new terminal** window/tab.
    *   Navigate to the `client` directory: `cd client`.
    *   Run the React development server:
    ```bash
    npm start
    ```
    Your browser should open to `http://localhost:3000`. Your React app will now connect to the local emulators, and any data created or functions triggered will only exist within this local environment.

---

#### Running the App Locally (Using Live Firebase - Alternative)

This method connects your local app directly to your deployed Firebase project. Use this if you specifically want to test against live data, but be aware that local actions *will* affect your cloud project.

1.  **Configure Firebase Keys:**
    *   In your Firebase project, go to `Project Settings` > `Your apps`.
    *   Select your web app and find the `firebaseConfig` object.
    *   Create a file named `.env` inside the `client` directory.
    *   Copy your config values into `.env`, adding `REACT_APP_` to the start of each key name. For example:
        ```
        REACT_APP_FIREBASE_API_KEY="your-api-key"
        REACT_APP_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
        # ...and so on for all keys
        ```

2.  **Install Client Dependencies:**
    ```bash
    cd client
    npm install
    ```

3.  **Run the Client:**
    ```bash
    npm start
    ```
    Your browser should open to `http://localhost:3000`. The React app will now communicate directly with your live Firebase services (Authentication, Firestore). When you complete a session, the app writes to Firestore, which will automatically trigger your deployed Cloud Function.