## Questions
* Question: Current Project State: I see the better-golf directory only contains AGENTS.md and docs/. Should I assume this is a greenfield project where I need to set up the entire backend (Django), frontend (React), and mobile (Expo) infrastructure from scratch?
*Answer:  Yes, this is a greenfield project.*
* Question: Stats Entity: The Class Diagram shows Round "1" -- "*" Stats : has but there's no Stats class definition. What statistics should be tracked? (e.g., fairways hit, greens in regulation, putts per hole, etc.)
*Answer:    Let's start with basic stats like total score,fairways hit, greens in regulation, putts per hole, eagles, birdies, pars, bogies, double bogies.*
* Question: Shot Tracking Priority: The architecture includes detailed shot tracking with club, direction, and result. Is this part of the MVP, or should we focus first on basic score tracking (rounds, holes, scores) and add shot tracking later?
*Answer:  Let's focus on basic score tracking first and add shot tracking later.*
* Question: Authentication & User Management: Should the MVP include:
  * Email verification flow?
  * Password reset functionality?
  * Social login (Google, Apple)?
  * Or just basic email/password registration and login?
*Answer:  Let's start with basic email/password registration and login.*
* Question: Course Data: How will course information be populated?
  * Manual entry by users?
  * Pre-populated database of courses?
  * Integration with a third-party API?
*Answer: Course data will be populated with a third-party API.  We will be using https://api.golfcourseapi.com/docs/api/#operation/getCoursesBySearch*
* Question: Handicap Calculation: The Profile includes HandicapIndex and GHINID. Should the app:
  * Calculate handicaps automatically based on rounds?
  * Allow manual entry only?
  * Integrate with GHIN API?
  * Integration with a third -party API?
  *Answer: Users will manually enter in their handicap index and GHIN ID.  If the user does not have a handicap index the app should default to a handicap index of 20.  The GHIN ID is optional*

  * Question: MVP Feature Priority: Based on the architecture, which features are essential for MVP vs. post-MVP?
  * User registration/login ✓
  * Profile management ✓
  * Course management (?)
  * Round tracking - total score only (?)
  * Round tracking - hole-by-hole (?)
  * Shot tracking (?)
  * Statistics dashboard (?)
  *Answer: User registration/login, Profile management, Course management, Round tracking - total score and hole-by-hole score, and Statistics dashboard are all essential for MVP.*