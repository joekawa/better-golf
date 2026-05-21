# Overview
Golfers tend to play either 9 or 18 holes per round.  Sometimes golfers can play the front 9 or the back 9 only.  The app should support the following use cases.

1. A golfer plays 18 holes, and enters a score for each hole starting from hole 1.
2. A golfer plays 9 holes, and enters a score for each hole starting from hole 1.
3. A golfer plays 9 holes, and enters a score for each hole starting from hole 10.

In each of these use cases, we should calculate the same stats for the round.  The statistical engine is already built into the app NO CHANGES NEEEDED for stat entry.

We do need to make a change to the UI to support this.  The UI should allow the user to select whether they are playing 9 or 18 holes.

We also need to update the handicap calculation to support 9 hole rounds.  The instructions to calculate a nine hole handicap are below

### 9-Hole Course Handicap
To calculate a 9-hole Course Handicap, the first step is to divide the player’s Handicap Index by two, and round this value to the nearest tenth using traditional rounding methods. It is necessary to round the value to the nearest tenth to convert to a 9-hole Course Handicap. The formula for calculating the Course Handicap is then used, using the 9-hole Course Rating, Slope Rating, and par for the tees being played.

9-Hole Course Handicap Example

Handicap Index – 8.7; Course Rating – 35.3; Slope Rating – 121; Par – 36

8.7 ÷ 2 = 4.35; rounded to 4.4

9-Hole CH = 4.4 x (121 ÷ 113) + (35.3 – 36)

9-Hole CH = 4.011…

9-Hole CH = 4
