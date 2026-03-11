```mermaid

---
title: Class Diagram
---
classDiagram

class User{
  +id
  +email
  +password
  +isActive
  +email_verified
  +last_login
  +created_at
  +updated_at
  +deleted_at
}

User "1" -- "1" Profile : has
User "1" -- "*" Round : has


class Profile{
  +id
  +userId
  +display_name
  +phone_number
  +date_of_birth
  +profile_picture
  +Address
  +City
  +State
  +Zip
  +Country
  +HandicapIndex
  +GHINID
  +created_at
  +updated_at
  +deleted_at
}

class Round{
  +id
  +scoreTypeId
  +userId
  +courseId
  +date
  +created_at
  +updated_at
  +deleted_at
}

Round "1" -- "1" Course : is_played_on
Round "1" -- "1" CourseTee : is_played_from
Round "1" -- "1" RoundScore : has
Round "1" -- "1" ScoreType : has
Round "1" -- "*" Stats : has

class Course{
  +id
  +name
  +city
  +state
  +address
  +country
  +created_at
  +updated_at
  +deleted_at
}

Course "1" -- "*" Round : is_played_on
Course "1" -- "*" CourseTee : has

class CourseTee{
  +id
  +courseId
  +name
  +slope
  +rating
  +par
  +handicap
  +created_at
  +updated_at
  +deleted_at
}

CourseTee "1" -- "1" Course : belongs_to
CourseTee "1" -- "*" Round : is_played_from

class RoundScore{
  +id
  +roundId
  +net_score
  note for net_score: depends on score type (total or hole-by-hole).
  note for net_score: if type = 0 (total), user enters score; if type = 1 (hole-by-hole), calculated from hole scores.
  +gross_score
  +created_at
  +updated_at
  +deleted_at
}

RoundScore "1" -- "1" Round : belongs_to

class ScoreType{
  +id
  +boolean type
  note for type: 0 = total, 1 = hole_by_hole
  +created_at
  +updated_at
  +deleted_at
}

ScoreType "1" -- "1" Round : has

class Hole{
  +id
  +courseId
  +courseTeeId
  +holeNumber
  +par
  +distance
  +created_at
  +updated_at
  +deleted_at
}

Hole "1" -- "1" Course : belongs_to
Hole "1" -- "*" CourseTee : belongs_to

class HoleScore{
  +id
  +holeId
  +roundId
  +score
  +created_at
  +updated_at
  +deleted_at
}

HoleScore "1" -- "1" Hole : belongs_to
HoleScore "1" -- "1" Round : belongs_to

class Shot{
  +id
  +holeId
  +roundId
  +shotTypeID
  note for shotTypeID: 1 = drive, 2 = approach, 3 = putt, 4 = other
  +club
  +notes
  +direction
  +result
  note for result: 0 = no_result, 1 = made_putt, 2 = penalty
  note for direction: 1 = left, 2 = right, 3 = straight
  +created_at
  +updated_at
  +deleted_at
}

Shot "*" -- "1" Hole : belongs_to
Shot "*" -- "1" Round : belongs_to
