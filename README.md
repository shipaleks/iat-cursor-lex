# Detailed README

Welcome to the **Lexical Decision Web App** repository! This project is created for conducting experiments where participants classify words as “real” or “non-real” (or “made-up”), often accompanied by images displayed briefly to provide context or primes. Below you will find a comprehensive guide to the project structure, how to set it up, and an overview of the IAT (Implicit Association Test) concept that helped inspire some aspects of this application.

## Table of Contents

1. [Project Description](#project-description)  
2. [What is IAT?](#what-is-iat)  
    - [Origins of the IAT](#origins-of-the-iat)  
    - [How the IAT Works](#how-the-iat-works)  
    - [Why We Reference the IAT in This Project](#why-we-reference-the-iat-in-this-project)  
    - [Further Reading](#further-reading)  
3. [Technology Stack](#technology-stack)  
4. [File and Directory Structure](#file-and-directory-structure)  
5. [Installation and Setup](#installation-and-setup)  
6. [Usage Example](#usage-example)  
7. [Scripts and Commands](#scripts-and-commands)  
8. [Firebase Configuration](#firebase-configuration)  
9. [Environment Variables](#environment-variables)  
10. [Testing](#testing)  
11. [Deployment](#deployment)  
12. [Potential Issues & Solutions](#potential-issues--solutions)  
13. [Contacts](#contacts)

---

## Project Description

**Lexical Decision Web App** is a browser-based experiment platform that primarily allows participants to:

- **Classify words (real vs. made-up)** with or without accompanying images.  
- Log **reaction time** and **accuracy** to help researchers study linguistic or psychological responses.  
- **Upload CSV** files with word lists (e.g., synonyms, antonyms, novel words) and track them through **Firebase**.  
- Collect and export data in format-friendly ways (CSV or real-time visualization).

This app is easy to maintain, utilizing React for the frontend and Firebase for backend storage and real-time updates.

---

## What is IAT?

The **Implicit Association Test (IAT)** is a psychological test designed to measure unconscious or automatic associations that individuals may hold. Although this particular web app focuses on lexical decision tasks, the IAT concept often serves as an inspiring framework for measuring reaction times and accuracy in various classification tasks.

### Origins of the IAT

The IAT was introduced by Anthony G. Greenwald, Debbie E. McGhee, and Jordan L. K. Schwartz in 1998. Its original purpose was to detect implicit biases (such as attitudes toward different social groups) by analyzing how quickly and accurately people categorize words or images into certain categories.

### How the IAT Works

1. **Pairing Categories**: Participants see stimuli (words or images) and must categorize them, typically using keyboard keys.  
2. **Measurement of Reaction Times**: The faster a participant classifies, the more it can suggest a stronger automatic or “implicit” association.  
3. **Critical Contrasts**: By switching or reversing category pairings (e.g., Good + Group A vs. Good + Group B), the IAT reveals differences in reaction times.  
4. **Scoring**: The participant’s measure of implicit bias or association is often derived from the difference in average reaction times before and after category reversals.

### Why We Reference the IAT in This Project

- **Similar Reaction Time Mechanisms**: Just as in the IAT, lexical decision tasks measure how quickly participants can respond — capturing the relationship between stimulus and cognitive load.  
- **Ease of Extension**: Researchers familiar with IAT’s timeframe-based approach might extend or adapt this lexical decision experiment design to measure implicit attitudes toward specific words or images.  
- **Generalizable Infrastructure**: By analyzing reaction times and accuracy data, you can adapt these fundamentals to a variety of implicit testing scenarios.

### Further Reading

- Greenwald, A.G., McGhee, D.E., & Schwartz, J.L.K. (1998). *Measuring individual differences in implicit cognition: the implicit association test.* *Journal of Personality and Social Psychology, 85(2)*, 197–216.  
- [Project Implicit](https://implicit.harvard.edu/implicit/) – An online platform offering various IAT tests and documentation.  
- [Wikipedia: Implicit Association Test](https://en.wikipedia.org/wiki/Implicit_Association_Test) – Overview of IAT methodology and controversies.

---

## Technology Stack

The major pieces and libraries used in this project:

- **Frontend**:  
  - [React](https://react.dev/) (with TypeScript) for building user interfaces.  
  - [Vite](https://vitejs.dev/) for rapid development and build processes.  
  - [Material UI (MUI)](https://mui.com/) for quicker component styling (optional but recommended).

- **Backend**:  
  - [Firebase Firestore](https://firebase.google.com/products/firestore) or Realtime Database for storing words/results.  
  - [Firebase Storage](https://firebase.google.com/products/storage) for images.  
  - [Firebase Hosting](https://firebase.google.com/products/hosting) for easy deployment.  

- **Other Tools**:  
  - **ESLint** for code quality checks.  
  - **TypeScript** for type safety.  
  - Possible test suites like **Jest** or **Cypress** for unit/end-to-end testing.

---

## File and Directory Structure

A typical file layout might look like this:

```plaintext
my-lexical-app/
├─ src/
│  ├─ components/         # Reusable React components (Login, Instructions, Trial, Leaderboard, etc.)
│  ├─ services/           # Firebase services (CRUD operations, custom hooks, etc.)
│  ├─ utils/              # Helper or utility functions (e.g. randomization, partial data processing)
│  ├─ main.tsx            # Entry point for React
│  └─ App.tsx             # Main React component that orchestrates routing and layout
├─ public/
│  └─ index.html          # HTML template loaded by Vite
├─ tests/                 # Automated tests (e.g. unit, integration, e2e)
├─ docs/                  # Additional documentation
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ .gitignore
└─ README.md
```

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/username/my-lexical-app.git
   cd my-lexical-app
   ```

2. **Install dependencies** (requires Node.js 18+):
   ```bash
   npm install
   ```

3. **Configure Firebase** by adding your project settings (see [Firebase Configuration](#firebase-configuration)).

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app should be accessible via [http://localhost:3000](http://localhost:3000) (or a different port if already in use).

---

## Usage Example

1. **Researcher Prep**: Prepare a CSV file with words (including synonyms, antonyms, real words, non-real words).  
2. **Image Upload**: Upload images to Firebase Storage (with allowed read access or protected by rules, depending on your experiment).  
3. **Experiment Flow**: The participant sees a prompt or an image, then a word. They decide if it’s a valid (real) word or not, typically pressing left or right arrow keys.  
4. **Data Logging**: Reaction times and correctness are stored in Firestore.  
5. **Download/Analyze Data**: Export CSV for analysis—each row might contain the participant nickname, word, answer time, correctness, and so on.

---

## Scripts and Commands

**Defined in `package.json`**:

- **Development Mode**:
  ```bash
  npm run dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```
- **Lint the Code**:
  ```bash
  npm run lint
  ```
- **Start** (for a simple local server with `serve`):
  ```bash
  npm start
  ```

---

## Firebase Configuration

If you are using Firebase for data storage and hosting:
1. [Create a Firebase project](https://console.firebase.google.com/).  
2. Enable **Firestore** and/or **Realtime Database** and **Storage**.  
3. Grab your **Firebase config** from the console.  
4. Initialize Firebase in your code—commonly in `src/services/config.js` (or `.ts`):

```typescript:path/to/file
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_APP_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_BUCKET.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Environment Variables

If you’re using .env files for environment-specific settings:

```bash
VITE_FIREBASE_API_KEY=yourKey
VITE_FIREBASE_AUTH_DOMAIN=yourAuthDomain
VITE_FIREBASE_PROJECT_ID=yourProjectId
VITE_FIREBASE_STORAGE_BUCKET=yourStorageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=yourSenderId
VITE_FIREBASE_APP_ID=yourAppId
```

Make sure to keep these `.env*` files out of source control by specifying them in `.gitignore`.

---

## Testing

- **Unit tests**: Possible with Jest + React Testing Library.  
- **End-to-end (E2E) tests**: Cypress or Playwright can be used.  
- Store test files in a `tests/` directory or co-locate them next to components.

```bash
npm test
```
*(Adjust this command if using Jest or your chosen testing framework.)*

---

## Deployment

### Firebase Hosting
1. **Install Firebase Tools**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```  
2. **Initialize** (if not already done):
   ```bash
   firebase init
   ```
3. **Build**:
   ```bash
   npm run build
   ```
4. **Deploy**:
   ```bash
   firebase deploy
   ```

### Other Services
If you prefer other hosting platforms (e.g., Vercel, Netlify, Railway), configure your build output (the default `dist` folder) as the site root.

---

## Potential Issues & Solutions

1. **File Path Errors**: Check that image URLs in your Firebase Storage match the stored references in Firestore.  
2. **Invalid CSV Format**: Make sure your CSV columns match what the parser expects; otherwise, words might not appear or get processed.  
3. **Firebase Quota Limits**: Heavy usage might exceed free quotas. For large-scale studies, consider upgrading your Firebase plan.  
4. **TypeScript Definition Errors**: Keep dependencies (TypeScript, React types) updated, and ensure your `tsconfig.json` is aligned with your library versions.

---

## Contacts

If you have any questions, feedback, or suggestions, feel free to:

- Create an [issue on GitHub](https://github.com/username/my-lexical-app/issues).  
- Reach out to our development team (see `package.json` for contact info).

Thank you for using **Lexical Decision Web App**! We hope it streamlines your experimental workflow. Contributions, pull requests, and feature ideas are always welcome. Enjoy exploring lexical decisions, reaction times, and maybe even adapt it for IAT-inspired tasks!
