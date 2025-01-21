# **Backend Structure Document**

## **1. Introduction**

The backend for this **lexical decision web app** is designed to manage:

1.  **Data Storage** – holding images, words (synonyms, antonyms, and predefined categories), and participant responses.
2.  **CSV & Image Uploads** – allowing researchers to import experiment data easily.
3.  **Session Management** – tracking user sessions, reaction times, and correctness of responses.
4.  **Scalability & Real-Time Updates** – automatically adjusting to the number of concurrent participants without requiring ongoing server maintenance.

By leveraging **Firebase** (Firestore, Storage, Hosting, and optional Cloud Functions), we create a **serverless**, highly available, and easily maintained backend. Researchers can focus on designing experiments rather than worrying about infrastructure.

## **2. Architecture Overview**

### **2.1 Serverless Design with Firebase**

*   **Firebase Firestore (or Realtime Database)** handles structured data (e.g., participant sessions, images metadata).
*   **Firebase Storage** stores the actual image files uploaded via CSV references.
*   **Firebase Hosting** (optionally) can host the frontend application files for a seamless, single-platform solution.
*   **Firebase Cloud Functions** (optional) can be used for more complex tasks—like automated CSV parsing or custom endpoints. However, for many tasks, the **frontend** can communicate **directly** with Firestore and Storage through the **Firebase SDK**.

This architecture provides **real-time capabilities** (e.g., immediate synchronization of data) and **automatic scaling** without maintaining traditional servers.

## **3. Database Management & Data Model**

### **3.1 Firestore Collections**

A typical approach involves at least two main collections:

1.  `images`: Stores data about each uploaded image (URL, synonym, antonym, predefined category words, non-words, etc.).
2.  `sessions`: Tracks participant sessions, containing start/end timestamps, participant nicknames, and sub-collections of trials.

For example:

`images └─ <docId> // e.g. "img001" ├─ imageUrl: "https://firebasestorage.googleapis.com/..." ├─ synonym: "красивый" ├─ antonym: "некрасивый" ├─ predefinedWords: { │ aesthetics: ["прекрасный", "уродливый"], │ ... │ } ├─ nonwords: ["глуз", "фрон", ...] └─ timestamp: <uploadDate> sessions └─ <sessionId> // e.g. "session-abc123" ├─ participant: "nickname123" ├─ startTime: <timestamp> ├─ endTime: <timestamp> └─ trials: └─ <trialId> ├─ imageId: "img001" ├─ word: "красивый" ├─ wordType: "synonym" (or "antonym"/"predefined"/"non-word") ├─ reactionTime: 350 ├─ isCorrect: true ├─ timestamp: <responseTime>`

This structure enables straightforward queries (e.g., fetching all trials for a participant, retrieving image metadata, etc.).

### **3.2 Document-Oriented Model**

Firestore’s **NoSQL** approach accommodates **variable fields** in documents. For instance, an image document might contain multiple categories (beauty, harmony, etc.), each with its own array of words. This flexibility ensures easy expansion if future experiments require additional attributes.

## **4. CSV & Image Handling**

### **4.1 CSV Upload Workflow**

1.  **CSV File**: The researcher provides a CSV with rows containing `[imageFileName, synonym, antonym]`.

2.  **Image Upload**:

    *   For each row, the corresponding image file (e.g., `img001.png`) is uploaded to **Firebase Storage** using either the **Firebase SDK** directly from the frontend or via **Cloud Functions**.
    *   A **storage URL** is obtained for referencing the image.

3.  **Data Parsing & Firestore Insertion**:

    *   The CSV is parsed (client-side or in a Cloud Function).

    *   A new document is created in `images` for each row, saving:

        *   `imageUrl` (from Storage),
        *   `synonym` and `antonym`,
        *   Predefined category words (added automatically),
        *   Generated non-words,
        *   `timestamp` (for record-keeping).

### **4.2 Predefined Categories & Non-Words**

*   **Predefined Categories** (e.g., “Красота,” “Гармоничность”) are stored in a config object or separate collection. When creating an `images` document, the system merges these categories into the doc.
*   **Non-words** are generated randomly (e.g., “глуз,” “кярт”) and appended to each image doc to ensure balanced lexical vs. non-lexical stimuli.

## **5. Frontend-Backend Interaction**

### **5.1 Direct Firebase SDK Usage**

Most commonly, the **frontend** communicates with Firestore and Storage via the **Firebase SDK**:

*   **Upload**:

`// Pseudocode example: const fileRef = ref(storage, 'images/img001.png'); await uploadBytes(fileRef, localFileBlob); const imageUrl = await getDownloadURL(fileRef); await setDoc(doc(db, "images", "img001"), { imageUrl, synonym: csvRow.synonym, antonym: csvRow.antonym, predefinedWords: {...}, nonwords: [...], timestamp: new Date() });`

*   **Data Retrieval**:

`const imagesSnapshot = await getDocs(collection(db, "images")); // Then map through docs to build a list of images + associated words`

### **5.2 Cloud Functions as REST Endpoints (Optional)**

For **more complex** or **server-validated** flows (e.g., advanced CSV parsing, data transformations, or secure logic), **Firebase Cloud Functions** can expose an HTTP endpoint, letting the front end upload CSV files to the function, which then processes the data and writes to Firestore.

This approach can be beneficial if:

*   You want **centralized** logic for data validation or conversion.
*   You need to **guard** certain database operations behind server-side logic (beyond Security Rules).

## **6. Hosting & Infrastructure**

### **6.1 Firebase Hosting**

*   **One-Click Deployment**: The app’s static assets (HTML, CSS, JS) can be deployed to Firebase Hosting with a single command (`firebase deploy`), simplifying updates.
*   **CDN-Backed**: Firebase automatically serves your content via a global CDN, reducing latency for participants in different regions.

### **6.2 Serverless Scalability**

*   **Automatic Scaling**: Firestore and Cloud Functions scale automatically in response to increased read/write or function calls.
*   **Cost Efficiency**: Pay-as-you-go model ensures minimal costs when participant usage is low; no fixed servers to maintain.

## **7. Security & Access Control**

### **7.1 Firestore Security Rules**

*   **Rules Enforcement**:

    *   Researchers can have elevated privileges (e.g., read/write on the `images` collection).
    *   Participants (public) can only create or update their session documents but **not** read other participants’ data.

*   **Anonymous Access**:

    *   Since participants only enter a nickname, you can either allow writes without authentication (with strict rules limiting what can be written) or use **Firebase Anonymous Auth** as a minimal layer if needed.

### **7.2 Storage Security Rules**

*   **Read/Write Restrictions**:

    *   Researchers can upload images.
    *   Participants typically only need read access to images.

*   **Automatic URL Access**:

    *   Usually, an **imageUrl** can be served publicly if that’s acceptable for your study, or locked down behind rules if needed.

## **8. Monitoring & Maintenance**

### **8.1 Usage Monitoring**

*   **Firebase Console**: Real-time view of database reads/writes, function executions, and storage usage.
*   **Alerts & Logs**: Set up budget alerts or usage thresholds to avoid surprises.

### **8.2 Error Handling**

*   **Client-Side Checks**: Validate CSV structure before upload (e.g., correct columns).

*   **Logging**:

    *   Cloud Functions logs (if used) help diagnose server-side errors.
    *   Frontend errors can be tracked with Firebase Crashlytics or similar services.

### **8.3 Maintenance**

*   **Serverless Updates**: Automatic scaling, no manual server patching.
*   **Security Rules Updates**: Periodically review and update to match evolving requirements.
*   **Schema Modifications**: Firestore’s flexibility allows you to add fields without heavy migrations.

## **9. Conclusion**

This **Firebase-based backend** offers a robust, scalable, and low-maintenance foundation for the **lexical decision web app**. Key benefits include:

*   **Seamless Image & CSV Uploads**: Allowing researchers to easily populate and modify the stimulus set.
*   **Real-Time Data Collection**: Capturing participant responses (reaction time, correctness) without cumbersome server logic.
*   **Flexible Security Model**: Protecting data with Firestore and Storage rules while accommodating anonymous participants.
*   **Effortless Scaling**: Eliminating the need for manual server management.

By leveraging the **Firebase SDK** directly or through **Cloud Functions** for specialized workflows, this backend architecture remains **streamlined** and **adaptable**—ideal for research-focused applications where usability and data integrity are paramount.
