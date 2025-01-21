# **File Structure Document**

## **1. Introduction**

A **well-organized file structure** is essential for efficient development and seamless collaboration. By clearly delineating directories and files, developers can easily **navigate the codebase**, understand the application’s architecture, and quickly locate where they need to implement updates or fixes. For our **lexical decision web app**, the **goal is simplicity**—both in user experience and in the codebase—facilitating easy maintenance and rapid feature development. This is especially valuable as the app is primarily for **internal research** use and does not require complexities like user authentication.

## **2. Overview of the Tech Stack**

Our **frontend** can be developed using **React**, **Vue**, or **Angular**—all robust frameworks built on **HTML, CSS, and JavaScript/TypeScript**. For the **backend**, we rely on **Firebase**, which provides:

*   **Firestore (or Realtime Database)** for participant session data,
*   **Firebase Storage** for image assets,
*   **Firebase Hosting** for convenient deployment,
*   **Build tools** (Webpack or Vite) to streamline bundling, particularly useful if we choose React or Vue.

This combination influences our **file structure**, dividing responsibilities into logical directories that reflect the flow from **frontend** to **Firebase** services.

## **3. Root Directory Structure**

A **typical** project root might look like this:

`my-lexical-app/ ├─ src/ │ ├─ components/ │ ├─ services/ │ ├─ utils/ │ ├─ assets/ │ └─ main.js (or main.ts, App.js, etc.) ├─ public/ │ └─ index.html ├─ tests/ │ └─ (test files) ├─ docs/ │ └─ (additional documentation) ├─ .env (optional) ├─ firebaseConfig.js ├─ package.json ├─ README.md ├─ .gitignore └─ (build/ or dist/ after compilation)`

### **3.1 **`src/`** (Source Code)**

*   `components/`: Reusable UI components (e.g., buttons, modals, word display panels).
*   `services/`: Logic for **data access** (Firebase queries, storage interactions) or other backend communication.
*   `utils/`: Helper functions for date/time formatting, random non-word generation, or CSV parsing.
*   `assets/`: Optionally stores local images, icons, or style files if not served from Firebase Storage.
*   **Main entry file** (`main.js`, `App.js`, etc.): Bootstraps the app and integrates the chosen framework.

### **3.2 **`public/`

*   Contains **static files** served directly to the browser.
*   `index.html` is the **entry point** for single-page apps (SPA) in React/Vue/Angular.

### **3.3 **`tests/`

*   Holds **test files** for both unit and integration tests.
*   Organized by component or module, ensuring systematic coverage of the app’s functionality.

### **3.4 **`docs/`

*   Stores **project documentation**, including user guides, architectural decisions, and developer references.
*   Useful for future contributors or researchers needing deeper technical insights.

### **3.5 **`.env`** (Optional)**

*   Stores **environment variables** (like Firebase API keys) separate from code.
*   Helps **avoid** committing sensitive credentials to version control.

### **3.6 **`firebaseConfig.js`

*   **Initializes** Firebase services (Firestore, Storage, etc.).
*   References environment variables if `.env` is used, or stores credentials directly if that’s acceptable within your project’s security scope.

### **3.7 **`package.json`

*   Defines **project dependencies** and scripts (e.g., `build`, `start`, `test`).
*   Helps manage consistent versions across all developers’ environments.

### **3.8 README and Other Root Files**

*   `README.md`: Overview of project setup steps, usage instructions, and developer notes.
*   `.gitignore`: Ensures unwanted or sensitive files (like `node_modules/`, `.env`) are excluded from version control.

### **3.9 Build Output (**`build/`** or **`dist/`**)**

*   **Auto-generated** by bundlers (Webpack, Vite, or Angular CLI) when you run a production build.
*   Typically **not** committed to the repository (excluded via `.gitignore`).

## **4. Configuration and Environment Files**

*   `firebaseConfig.js` (or `.ts`): Contains **Firebase** initialization code (API keys, project ID, etc.).
*   `.env`: Can store environment variables like `REACT_APP_API_KEY`, particularly if you’re using frameworks that support environment variable injection in the build process (e.g., Create React App).

Keeping these **configurations separate** ensures the core app logic doesn’t mix with sensitive or environment-specific details.

## **5. Testing and Documentation Structure**

### **5.1 Testing Approach**

*   **Unit Tests**: Validate individual functions or components (e.g., verifying correct classification of words as synonyms, antonyms, or non-words).
*   **Integration/End-to-End Tests**: Ensure the entire **upload → session → data logging** flow works correctly. Tools like **Jest**, **Mocha**, **Cypress**, or **Playwright** can be used, depending on preference.

### **5.2 Documentation**

*   `docs/`:

    *   May include extended setup guides, contributor guidelines, or a running changelog.
    *   Provides a **single source** for developers or researchers seeking in-depth knowledge about the app’s architecture, usage, and deployment processes.

## **6. Conclusion and Overall Summary**

A **clear, logical file structure** is vital for maintaining simplicity and codebase readability. Aligning directories with **frontend**, **backend**, **testing**, and **documentation** responsibilities enables team members to quickly find what they need, whether they’re implementing new features or debugging existing ones.

By leveraging **modern frameworks** (React, Vue, or Angular) in the `src/` folder, **Firebase** for data storage (managed in `firebaseConfig.js`), and a **dedicated testing** directory, the **lexical decision web app** remains **scalable**, **flexible**, and **easy to maintain**. This organization supports a smooth development workflow and provides a solid foundation for future enhancements—be it for additional research features, expanded datasets, or refinements to improve user experience.
