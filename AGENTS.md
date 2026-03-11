# AGENTS.md - AI Agent Development Rules

## System Context
You are an expert AI agent assisting with the development of a full-stack application. The project uses a Python/Django backend and a React frontend. Your primary goal is to ensure consistent, secure, and maintainable software development practices across the entire project.

## Core Principles
*   **Code Style & Conventions**: Adhere strictly to the established linting and formatting rules for both Python and React components.
*   **Testing**: Ensure all changes are covered by tests and pass all quality gates before committing.
*   **Simple Front End**: The core business logic will be handled by the backend. The frontend should be simple and minimalistic.
+  **Consitent Experience between devices**: The expectation is
users will have a consistent experience between desktop and mobile devices.
+ **Console and terminal**:  Use console and terminal for debugging and testing.  The frontend and backend should log as much information to the console and terminal as possible to support testing and debugging.
+ **Mobile First**: The expectation is that the mobile app will be the primary interface for users.
+ **DRY**: Do not repeat yourself.  If you find yourself repeating yourself, ask for clarification.

## Project Structure
*   `better-golf/backend/`: Python source code (FastAPI/Django).
*   `better-golf/frontend/`: Web UI (React 18, TypeScript, Vite, Tailwind CSS).
*   `better-golf/tests/`: Unit and integration tests.
*   `better-golf/docs/`: Project documentation.
*   `better-golf/mobile/`: Expo mobile app (React Native).

## Boundaries and Guidelines
*   ✅ **Always do**: Follow the file structure, use the specified package managers, and run all tests.
*   ⚠️ **Ask first**: Before introducing new libraries, changing the established code style, or modifying core architecture.
*   🚫 **Never do**: Modify files outside of your current task scope, commit secrets, or use non-standard package managers.
* **Always check for clarification**: Use files in 'better-golf/docs' for additional context and clarification.

## UI/UX Guidelines
*   **Design System**: Use [Tailwind CSS](tailwindcss.com) for all styling.
*   **Component Library**: Use the established shared components located in `better-golf/frontend/components/shared/`.
*   **User Interface**:  Do not use any emojis or icons in the UI.
*   **DO NOT HARD CODE COLORS**: Use the established color palette.
*   **DO NOT HARD CODE SIZES**: Use the established size palette.
*   **DO NOT HARD CODE FONTS**: Use the established font palette.
*   **Use Poppins font**: Use the established font palette.


## BACKEND GUIDELINES
* Use Django REST Framework for API endpoints
* Development server runs on port 8000
* The database used for development is SQLite
* The production database is PostgreSQL
* Use environment variables for sensitive information
* All Django models should extend 'apps.utils.models.BaseModel'
* The project's user model is 'apps.users.models.CustomUser' and should be imported directly
* All API responses must include error handling and proper status codes
* Follow rest naming conventions for API endpoints

## GENERAL GUIDELINES
* Use the latest stable versions of all dependencies
* Use the established linting and formatting rules for both Python and React components
* Use the established testing framework for both Python and React components
* Do not commit any secrets or sensitive information
* Do not commit any files that are not part of the project
* Before introducing new libraries, ask for permission
* Before adding new features, produce a detailed plan and ask for approval
* IF CONFUSED OR UNCERTAIN ASK CLARIFYING QUESTIONS