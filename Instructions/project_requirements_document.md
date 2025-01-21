# Project Requirements Document (PRD) – Revised

## 1. **Project Overview**

This project is a **lexical decision web app** designed for linguistic or psychological research. In each trial:

1.  An **image** appears briefly.
2.  The user sees **words** (synonyms, antonyms, and predefined category words) **plus** randomly generated **non-words** related to that image.
3.  The user classifies each displayed item as a **real word** or a **non-word** by pressing different keys.

Researchers need a **straightforward platform** to:

*   Upload images and words via a **CSV file** (synonyms/antonyms),
*   **Automatically incorporate** additional words from predefined categories (e.g., aesthetic descriptors),
*   **Generate** non-words for balanced real vs. non-word trials,
*   Track and export participant reaction times and accuracy.

**Firebase** will serve as the backend for file storage and data management.

## 2. **In-Scope vs. Out-of-Scope**

### 2.1 In-Scope

*   **Image & Data Upload**:

    *   Upload images (PNG/JPG) and a CSV containing image references, synonyms, and antonyms.
    *   Store images in **Firebase Storage**; store word data in **Firestore** or **Realtime Database**.

*   **Predefined Categories**:

    *   The system merges the uploaded synonyms/antonyms with words from predefined categories (e.g., "Красота," "Гармоничность") for each image.

*   **Non-Word Generation**:

    *   Random non-words are created automatically and appended to each image’s word set.

*   **Trial Execution**:

    *   Show each image for a configurable time (default 500 ms),
    *   Randomize and display relevant words (real and non-words),
    *   Collect participant responses (correctness, reaction time).

*   **Data Logging & Export**:

    *   Store participant responses in Firebase,
    *   Export all data in **CSV format** (including reaction times, correctness, and user ID/nickname).

*   **Simple, Clean UI**:

    *   Basic instructions (how to respond with left/right arrow keys),
    *   Minimal friction for participants.

### 2.2 Out-of-Scope

*   **User Authentication**:

    *   No user sign-up or login system; only a nickname or ID is requested at session start.

*   **Multilingual Support**:

    *   Only Russian is required in the initial release, though easily extensible later.

*   **Advanced Analytics**:

    *   Any additional statistical analysis beyond CSV export remains outside this project’s scope.

## 3. **User Flow**

1.  **Start Screen**:

    *   Participant enters a **nickname** (no password or account required).
    *   Reads brief **instructions** (how to classify words, time constraints, etc.).

2.  **Session**:

    1.  **Image Display**: Show each image for a set duration (e.g., 500 ms).

    2.  **Word Presentation**:

        *   Display words (synonym, antonym, additional category words, and non-words) **one at a time**.
        *   The participant presses **left arrow** for **non-word**, **right arrow** for **real word**.
        *   The app logs **reaction time** and **correctness**.

    3.  **Repeat** for the configured number of images (default 10).

3.  **Finish**:

    *   Display a “thank you” message.
    *   Data is automatically saved in Firebase.

## 4. **Core Features**

1.  **CSV-Based Image + Synonym/Antonym Upload**

    *   A researcher can upload a CSV with columns `[imageFileName, synonym, antonym]`.
    *   The system uploads images to **Firebase Storage** and stores references plus synonyms/antonyms in the database.

2.  **Automatic Word Inclusion**

    *   Each image’s final word list is formed by **merging** the CSV’s synonym/antonym with any **predefined words** (categorized, e.g., “Красота,” “Гармоничность,” etc.) plus **generated non-words**.

3.  **Session Configuration**

    *   Adjustable session length (e.g., 10 images by default).
    *   Configurable image display time (e.g., 500 ms default, adjustable).

4.  **Randomization**

    *   The order of displayed words per image is **random**, ensuring a balanced mix of real words and non-words.

5.  **Real-Time Data Logging**

    *   On each key press, store `reactionTime` and `correctness` in Firebase.

6.  **Data Export**

    *   Researchers can **export** all trial data (participant nickname, image reference, word type, reaction time, correctness) as **CSV**.

## 5. **Tech Stack & Tools**

*   **Frontend**: Any modern framework (React, Vue, or Angular) with HTML/CSS/JavaScript or TypeScript.
*   **Backend**: **Firebase** (Firestore or Realtime Database, plus Storage).
*   **Hosting**: Firebase Hosting or another static hosting service.
*   **Build Tools**: Webpack or Vite (if using React/Vue).
*   **IDE**: Cursor or similar for AI-powered coding assistance.
*   **AI Tools**: ChatGPT for advanced code generation and iteration.

## 6. **Non-Functional Requirements**

1.  **Performance**:

    *   The app must handle concurrent user sessions without lag.
    *   Reaction time collection must be precise using `performance.now()` or equivalent.

2.  **Usability**:

    *   Simple and intuitive participant UI (minimal instructions, large buttons if needed, clear text).
    *   Straightforward researcher upload tools (CSV import, single-step or multi-step wizard).

3.  **Reliability**:

    *   Data must be accurately recorded in case of browser refreshes or partial sessions.
    *   Firebase must be configured to handle potential concurrency.

4.  **Security**:

    *   Although user authentication is out of scope, ensure basic security rules for Firebase Storage and Firestore so that only authorized researchers can upload or download data.

## 7. **Constraints & Assumptions**

*   **Reliable Firebase Connectivity**: The app relies on stable internet access to communicate with Firebase services.
*   **Browser Support**: Requires modern browsers capable of precise timing (Chrome, Firefox, Edge, Safari).
*   **Structured CSV**: Researchers must prepare CSV files with correct columns and references so data can be parsed seamlessly.

## 8. **Known Issues & Potential Pitfalls**

*   **Rate Limits**: Under very high usage, Firebase read/write limits might be approached. Unlikely for most research scales.
*   **Data Accuracy**: Reaction-time logging depends on **client-side** performance; older devices or slow connections could impact timing precision.
*   **CSV Format Errors**: If CSVs are malformed (missing columns, incorrect file references), uploading could fail or produce incomplete data.

## 9. **Success Criteria**

1.  **Data Integrity**:

    *   All trials must correctly capture user responses (reaction time, correctness, etc.).
    *   No duplication or omission of data in the CSV export.

2.  **Researcher Usability**:

    *   Researchers can upload images/CSV without technical difficulties.
    *   They can download results in CSV with minimal steps.

3.  **Participant Experience**:

    *   Straightforward instructions and quick response times.
    *   No complicated login or overhead that discourages participation.

### Summary

This PRD outlines a **lexical decision web application** that researchers can use to **upload images**, **manage words** (synonyms, antonyms, predefined categories, and non-words), and **collect** lexical decision data from participants. By adhering to these requirements, the final product will be:

*   **User-friendly** for both participants and researchers,
*   **Accurate** in data logging and exports, and
*   **Scalable** with Firebase’s backend services.

The scope, user flow, and technical guidelines presented here ensure a robust foundation for development and eventual deployment.
