## Convert Score Entry to Stats

*OVERVIEW*
We need to create a stats object from a score entry that is ScoreType = HOLE_BY_HOLE.

* *If strokes - hole_par = 1 then birdie
* *If strokes - hole_par = 2 then eagle
* *If strokes - hole_par = 3 then albatross
* *If strokes - hole_par = -1 then bogey
* *If strokes - hole_par = -2 then double bogey
* *If strokes - hole_par <= -3 then other

* The stats should be aggregated across all holes with the aggregation method of count
* This should be stored as a stats object in a database
* The app should count the number of FIR and GIR boxes that are checked in the front end.  The count of each should be stored in the stats object
* The front-end should let users add total putts for each hole in the hole-by-hole view
* The total putts should be aggregated across all holes with the aggregation method of sum
* Total putts should be stored in the stats object
