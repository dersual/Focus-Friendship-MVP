# Focus Friendship

---

## For Our Users

Welcome to Focus Friendship! This application is designed to help you stay focused and productive by turning your focus sessions into a fun and rewarding game.

### Core Features
-   **Pomodoro Timer:** A customizable timer to help you stay on track.
-   **Goal Setting:** Define your personal goals and track your progress.
-   **Evolving Digital Companions:** Unlock and evolve unique pets by completing focus sessions.
-   **Pet Collection:** Switch between your unlocked companions.
-   **XP & Leveling System:** Earn experience points for every completed focus session.

---

## For Developers

This section provides instructions for setting up and running the project locally.

### 1. One-Time Setup

First, complete these steps to get the project ready.

#### Prerequisites
-   Node.js (v24.x or higher is recommended)
-   npm (included with Node.js)
-   Firebase CLI: `npm install -g firebase-tools`

#### Installation
1.  **Clone the repository** to your local machine.
2.  **Install dependencies** for both the client and functions. From the project root, run:
    ```bash
    npm install --prefix client
    npm install --prefix functions
    ```
3.  **Configure Environment Variables:**
    *   In the `client` directory, create a copy of `.env.example` and name it `.env`.
    *   Go to your Firebase project's settings in the Firebase Console.
    *   Under "Your apps", select your web app and find the `firebaseConfig` object.
    *   Copy your project's keys into `client/.env`.

### 2. Running the Development Server

For daily development, you will need two terminals running simultaneously.

#### Terminal 1: Start Firebase Emulators
From the **root** of the project, run:
```bash
npx firebase emulators:start
```
This starts the local Firebase backend services. Keep this terminal running.

#### Terminal 2: Start the React App
In a second terminal, from the `client` directory, run:
```bash
npm start
```
This starts the frontend development server and will open `http://localhost:3000` in your browser. The app will connect to the emulators you started in the other terminal.

### 3. Building and Testing for Production

To test the application as it would behave in a live environment, you can create and serve a production build locally.

1.  **Build the Production App:**
    *   From the `client` directory, run:
    ```bash
    npm run build
    ```
    This bundles the app for production and places the output in the `client/dist` directory.

2.  **Serve the Production Build:**
    *   After the build is complete, run the following from the `client` directory:
    ```bash
    npm run serve
    ```
    This will serve the contents of `client/dist` on `http://localhost:3000`. When you visit this URL, the app will be using your live Firebase services, not the local emulators.

### Available Scripts

Here is a summary of the most important scripts, based on the `package.json` files.

#### `client` Scripts
-   `npm start`: Starts the development server with hot-reloading.
-   `npm run build`: Creates a production-ready build of the app.
-   `npm run serve`: Serves the production build locally for testing.
-   `npm test`: Runs unit tests.

#### `functions` Scripts
-   `npm run lint --prefix functions`: Lints the backend Cloud Functions code.
-   `npm run deploy --prefix functions`: Deploys only the Cloud Functions to Firebase.
-   `npm run logs --prefix functions`: Displays logs from the deployed Cloud Functions.
