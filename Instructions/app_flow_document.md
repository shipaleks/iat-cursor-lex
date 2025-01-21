# App Flow Document

## Introduction

This document outlines the app flow for a lexical decision web application. The primary goal is to facilitate linguistic or psychological research by allowing participants to classify words based on briefly displayed images and log their response times and accuracy. The application is simple and clean, optimized for internal use without authentication, and is integrated with Firebase for backend services. This app enables participants to view images, classify words as real or non-words, and logs their responses for data analysis.

## Onboarding and Sign-In/Sign-Up

Participants access the app through a direct link, leading them to the login screen where they enter a nickname to start their session. As authentication isn't required, this bypasses complex sign-up steps, simplifying the onboarding process. If a participant loses connection or their session is interrupted, they can easily re-enter by providing their nickname again, maintaining continuity without traditional sign-in or password recovery methods.

## Main Dashboard or Home Page

Upon entering a nickname, participants arrive at the main dashboard, which serves as the starting point for the experiment. This page features a clean interface with clear instructions on how to proceed. It includes a brief tutorial about the task, instructing participants on how images and words will be presented and the expected responses using keyboard inputs. This interface is designed for ease of understanding, ensuring participants are prepared before starting.

## Detailed Feature Flows and Page Transitions

The experiment session begins with the display of an image for a configurable duration, by default set at 500 milliseconds. After the image disappears, a sequence of words appears one at a time. Participants must classify each word as a real or non-word by pressing designated keys. The system logs each key press, capturing the reaction time and the correctness of the response.

Data logging occurs seamlessly in the background using Firebase services, ensuring accuracy and reliability. This process continues until all words associated with the session images are presented, providing participants with immediate visual feedback when appropriate.

On completion of each word set, a short pause or message may be displayed to allow participants to reset before proceeding with the next image. This feature ensures the participant is ready and complements the flow by reducing fatigue.

After all images and associated words have been processed, the application presents a completion message, confirming that the participant's responses were logged correctly and their session is concluded. This final page reiterates participation appreciation and concludes the user interaction smoothly.

## Settings and Account Management

The application foregoes traditional account settings due to its simplicity and lack of authentication requirements. Participant information is managed through the initial nickname entry, and any necessary settings, such as session length or display durations, are pre-configured by researchers at the backend level. There’s no direct interface for participants to adjust these settings, maintaining focus on the task at hand.

## Error States and Alternate Paths

In cases where participants enter invalid data, such as an incorrect session nickname or experience connectivity issues, the app responds with a simple error message prompting the correct input or suggesting to try reconnecting. All error messages appear clearly, offering guidance to regain the normal flow quickly. For non-critical errors where data remains unsaved, the system ensures data integrity by re-logging the session without needing participant re-entry.

## Conclusion and Overall App Journey

The entire journey begins with participants entering a nickname, moving to the experiment dashboard, and engaging in the lexical decision task by classifying words following each image display. Participants progress through organized trials, with their responses logged accurately for posterior analysis. The application’s flow provides a streamlined, user-friendly experience from start to completion, emphasizing participant ease and precise data collection necessary for research purposes.
