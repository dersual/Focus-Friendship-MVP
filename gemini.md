# Focus Friendship

This project is for "Focus Friendship," a web application that gamifies focus sessions using a digital pet.

## Approved Technical Plan

### Phase 1: Core Focus MVP
This phase focuses on building the standalone Pomodoro and pet experience.

1.  **Project Setup:**
    *   Use the name "Focus Friendship" in the application.
    *   Copy the user-provided image to `client/src/assets/images/` for the pet component.
2.  **Backend Setup (Simple):** Create a minimal Express server with `POST /api/sessions` and `POST /api/user/sync` endpoints for basic data logging.
3.  **Frontend Service Layer:** Build `xpService` and `syncService` for local XP/level management and offline data queueing.
4.  **Core UI Components:** Build the `Timer`, `CutieBean` (using the provided image), and `ConfirmModal` components.
5.  **Styling, Testing, and Docs:** Complete the initial implementation as planned.

### Phase 2: Social & Scheduling Features
After the core application is working, build the social features on top of it.

1.  **User Authentication:** Implement a "Sign in with Google" system.
2.  **Database Integration:** Add a database to the backend to store users, friends, and session history.
3.  **Friends System:** Create APIs and UI for users to add and view friends.
4.  **Google Calendar Integration:** Connect to the Google Calendar API to schedule and view focus sessions.
5.  **Social Accountability:** Display friend activity and status.

## Color Palette

-   **Text:** `#060f0f`
-   **Background:** `#f2f9fa`
-   **Primary:** `#5ab6bd`
-   **Secondary:** `#a4bedb`
-   **Accent:** `#7990c9`

## User-Defined Rules
- also explain and show everything step by step, after showing the plan, allow me a chance to approve or not approve it, and then do this step by step
