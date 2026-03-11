## Handicap Calculation Requirements

* The app should calculate the user's handicap based on their recent rounds
* Handicap index is calculated using score differentials
* The app should only begin calculating handicap after the user has completed at least 5 rounds
* Once the user has entered 20 rounds or more, the app should calculate handicap based on the most recent 20 rounds
* If a user has entered between 5 and 10 rounds, the app should calculate based on the 4 best score differentials of those rounds
* If a user has entered between 11 and 19 rounds, the app should calculate based on the 6 best score differentials of those rounds
* If a user has entered less than 5 rounds, the app should not calculate a handicap
* If a users has entered 20 rounds or more, the app should calculate handicap on the best 8 score differentials of the last 20 rounds
* The app should track a users handicap index over time.  Once a new handicap index is calculated, the app should store the new handicap index and display it in the app, while preserving the previous handicap index
* The score differentials is calculated as (gross score - course rating) * 113 / slope rating
* Anything not included in these requirements is considered out of scope for this feature