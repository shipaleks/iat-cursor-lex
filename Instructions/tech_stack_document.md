# **Tech Stack Document**

## **1. Introduction**

This project is a **lexical decision web app** that enables researchers to study word classification tasks with participants. By displaying images and presenting real and non-real words (synonyms, antonyms, and randomly generated non-words), the application captures participants’ responses—particularly **reaction times and accuracy**—for subsequent linguistic or psychological analyses.

The **primary objectives** of our technology choices are to:

1.  **Provide a user-friendly interface** with minimal technical overhead for researchers,
2.  **Ensure reliable, scalable data collection** through a cloud-based backend,
3.  **Facilitate easy updates** and future feature expansions without major architectural changes.

## **2. Frontend Technologies**

### **2.1 Framework: React, Vue, or Angular**

We choose from among **React**, **Vue**, or **Angular**—all of which are **widely used, well-documented** JavaScript frameworks. Each offers:

*   **Component-based architecture**: Simplifies development and maintenance by encapsulating UI logic.
*   **Virtual DOM / Reactive binding**: Ensures high performance and a smooth user experience, critical for capturing **precise reaction times**.
*   **Large ecosystem**: Abundant libraries, tooling, and community support to handle specialized tasks (e.g., state management, routing).

Although the exact framework can be finalized based on team preference, each option helps us **build a responsive, interactive UI** that participants find intuitive.

### **2.2 Core Web Technologies**

*   **HTML/CSS**: For structuring and styling the interface, ensuring clarity and minimal distractions during tasks.
*   **JavaScript or TypeScript**: TypeScript can improve code readability and reduce runtime errors with static type checking, which is especially helpful in larger or long-term projects.

### **2.3 Styling & UI Libraries**

*   **CSS frameworks or libraries** (e.g., Tailwind, Bootstrap, or Material Design components) can be used for quick, consistent UI styling.
*   Minimal design ensures participants can **focus on the core task** without unnecessary visual clutter.

## **3. Backend Technologies**

### **3.1 Firebase for Database & Storage**

*   **Firestore or Realtime Database**:

    *   Stores the **core data**: session records, participant responses, synonyms, antonyms, and other word sets.
    *   Offers **real-time synchronization** capabilities—useful if researchers or administrators need live updates, though many tasks can be done asynchronously.
    *   **Document-based structure** suits the flexible nature of experimental data (varying numbers of words per image, multiple session types, etc.).

*   **Firebase Storage**:

    *   Manages **image uploads** referenced in each experiment.
    *   Provides **secure download URLs** for participants to view the images briefly in the front end.

### **3.2 Scalability & Integration**

Firebase seamlessly integrates with the chosen frontend framework via the **Firebase SDK**, eliminating the need for a complex custom API. This approach:

*   **Reduces development overhead** (fewer servers, no manual scaling).
*   **Streamlines data flow** (direct read/write from the app to Firestore/Storage).
*   **Supports Cloud Functions** (if advanced server-side logic or validations are needed).

## **4. Infrastructure & Deployment**

### **4.1 Firebase Hosting**

*   **One-click deploy**: Hosting the entire frontend directly on Firebase simplifies versioning and makes continuous updates quick.
*   **CDN-backed**: Firebase Hosting uses a global content delivery network to provide low-latency asset delivery, improving performance across different regions.

### **4.2 Continuous Integration & Version Control**

*   **Git** (GitHub, GitLab, or Bitbucket) is used for version control, enabling:

    *   **Team collaboration** with pull requests and code reviews,
    *   **Stable release pipelines** (e.g., integration tests before deploying),
    *   **Traceability** of changes to ensure code integrity and ease of rollback if needed.

## **5. Third-Party Integrations**

### **5.1 CSV Parsing & Data Export**

Libraries like **Papa Parse** or built-in functionalities within the chosen framework handle:

*   **CSV file imports**: Researchers can upload images + word pairs (synonym/antonym) in bulk.
*   **CSV data export**: Researchers can download participants’ reaction times and accuracy for offline analysis in statistical tools.

### **5.2 Additional Utility Libraries**

*   **Date/time** libraries (e.g., `date-fns` or `moment.js`) if advanced date manipulation is needed.
*   **Random generation** utilities for creating non-words or randomizing test sequences.

## **6. Security & Performance**

### **6.1 Security**

*   **Firestore Security Rules** & **Storage Rules**: Restrict read/write access so that only authorized researchers can upload or modify data. Participants can only create session documents or add responses, not view or alter others’.
*   **HTTPS**: All data transfer occurs over secure HTTPS, ensuring participant responses are not exposed in transit.

### **6.2 Performance Considerations**

*   **Responsive UI**: Minimizing overhead in the front end to ensure **immediate feedback** to participants for reaction-time tasks.
*   **Efficient Queries**: Structuring Firestore data to allow quick lookups of images and words, essential for real-time tasks.
*   **Serverless Scalability**: Firebase auto-scales read/write capacity to handle multiple concurrent participants without service degradation.

## **7. Conclusion and Overall Tech Stack Summary**

The **combined use** of:

*   A **modern JavaScript framework** (React/Vue/Angular) for the **front end**,
*   **Firebase** (Firestore, Storage, Hosting) for the **back end** and **deployment**,
*   **Supplementary libraries** for CSV handling, data exports, and potential Cloud Functions for advanced workflows,

…ensures this lexical decision web app is **simple, robust, and user-friendly**. This stack enables:

1.  **Easy onboarding for researchers** (straightforward CSV upload, real-time data display, minimal server config).
2.  **Accurate, real-time data capture** (Firestore’s low latency and direct SDK integration).
3.  **Scalability** (serverless architecture that adapts to fluctuating participant counts).
4.  **Security & maintainability** (built-in rules, easy deployment, version control).

By choosing this tech stack, the project remains **flexible** enough for future enhancements—such as introducing additional languages, advanced analytics modules, or more sophisticated user workflows—without incurring substantial technical debt or requiring a complete overhaul of the core infrastructure.
