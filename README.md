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

This section provides instructions for setting up, running, and deploying the project.

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

### 2. Development Workflow

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
This starts the frontend development server at `http://localhost:3000`.

### 3. Testing The Production Build Locally

Before deploying, you can build and test the production version of your app on your local machine.

1.  **Build the App:** From the project root, run:
    ```bash
    npm run build --prefix client
    ```
2.  **Serve the Build:** After the build is complete, from the `client` directory, run:
    ```bash
    npm run serve
    ```
    This will serve your production code on `http://localhost:3000`. When you visit this URL, the app will be using your **live** Firebase services (not the emulators).

### 4. Deploying to Production

Once you have tested your production build, you can deploy it.

#### Option 1: Manual Deployment
This is the simplest way to deploy your changes. From the project root, run:
```bash
firebase deploy --only hosting
```

#### Option 2: Automated Deployment (via GitHub Actions)
This method automatically builds and deploys your app every time you push code to the `main` branch.

**To set this up:**
1.  **Generate a Firebase CI Token:** In your terminal, run `firebase login:ci`. Copy the generated token.
2.  **Add Secrets to GitHub:** In your GitHub repository, go to `Settings` > `Secrets and variables` > `Actions` and click `New repository secret` to add the following:
    *   `FIREBASE_TOKEN`: Paste the token you just generated.
    *   You must also add secrets for all the variables in your `.env` file (e.g., `REACT_APP_FIREBASE_API_KEY`).
3.  **Workflow File:** A workflow file at `.github/workflows/deploy.yml` is required. I will create this file for you in the next step.