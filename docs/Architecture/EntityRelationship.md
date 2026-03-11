```mermaid
---
title: Entity Relationship Diagram
---
erDiagram
User ||--|| Profile : has
User ||--|{ Round: plays
Round ||--|| Course: is_played_on
Round ||--|| CourseTee: is_played_from
Round ||--|| RoundScore: has
Round ||--|| ScoreType: has
Round ||--|{ Stats: has
HoleScore ||--|{ Hole: has
Course ||--|{ CourseTee: has
Hole ||--|| HoleScore: has
Hole ||--|{ Shot: has
```