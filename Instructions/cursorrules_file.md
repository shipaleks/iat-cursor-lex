# Cursor Rules for Project

## Project Overview

**Project Name:** Lexical Decision Web App

**Description:** This project implements a lexical decision web app where participants classify words (real words vs. non-words) after viewing a thematic image. The app uses Firebase as a backend for both image storage and data management, with no participant authentication required for simplicity.

**Tech Stack:**

*   **Frontend:** React, HTML/CSS/JavaScript (or TypeScript)
*   **Backend:** Firebase Firestore and Firebase Storage
*   **Hosting:** Firebase Hosting (optional)
*   **Build Tools:** Webpack/Vite

**Key Features:**

*   Data pre-upload to Firebase (images and textual data)
*   Configurable session parameters (image count and display time)
*   Automatic word list generation and data logging
*   CSV export for participant data

## Project Structure

### Root Directory:

*   Contains main configuration files and documentation.
*   Files: `README.md`, `.cursorrules`, `firebaseConfig.js`

### /frontend:

Contains all frontend-related code, including components, styles, and assets.

/components:

*   `LoginComponent`: Handles participant nickname collection.
*   `TrialComponent`: Manages the image display and word classification flow.
*   `ResultsComponent`: Displays session completion message and optional data export.

/assets:

*   `images/`: Placeholder for development images (if needed locally).

/styles:

*   `main.css`: Application-wide styles.
*   `components.css`: Component-specific styles.

### /backend:

Contains code related to backend interactions with Firebase.

/functions:

*   `uploadCSV` function to process CSV and update Firebase with images and textual data.
*   `generateNonWords` utility function for creating balanced trials.

/services:

*   `firebaseService.js`: Manages Firebase operations such as uploads and data fetches.

### /tests:

Contains unit tests and integration tests for frontend and backend functionalities.

## Development Guidelines

**Coding Standards:** Use ESLint with Airbnb style guide for consistent code style. Follow best practices for React components and functional programming principles.

**Component Organization:** Separate presentational and container components. Ensure components are reusable and modular. Styles should be encapsulated within their respective components unless shared globally.

## Cursor IDE Integration

**Setup Instructions:**

1.  Clone the repository from version control.
2.  Run `npm install` in the root directory to install dependencies.
3.  Initiate Firebase (`firebase init`) if not setup. Configure the Firebase project.
4.  Use Cursor IDE autosuggestions to enhance coding efficiency and adherence to standards.

**Key Commands:**

*   `npm start`: Start the development server.
*   `npm run build`: Build the frontend for production.
*   `firebase deploy`: Deploy using Firebase Hosting (if configured).

## Additional Context

**User Roles:** No defined user roles; all users are participants and need minimal interaction.

**Accessibility Considerations:** Ensure text is readable and UI elements are intuitively accessible by keyboard. Keep the interface simple and focus on clear instructions to participants.
