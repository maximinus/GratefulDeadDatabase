# GratefulDeadDatabase

Database and more for Grateful Dead shows

At the moment there are several parts to this in development.

GDD is a project to build a database of the Grateful Dead, giving:
  * All shows and setlists
  * Timings for all recorded songs
  * A BPM measure for all songs
  * A list of venues played at, with details and co-ordinates
  * Weather information for every show
  * A way of exploring this data

Data for the setlists was mined and scraped from many (archive.org, gdshowsdb, jerrybase.com, www.cs.cmu.edu setlists, setlist.fm) internet sources, merged and then individual errors were checked against the music.
Timing data and BPM were done by the author.
Weather information was taken from the historical weather API at www.visualcrossing.com

Making a database such as this often forces the author to make value judgements. This author has decided that the setlists should be a record of the songs that were played, so sequences such as "Terrapin Station > Jam > Drums" would be "Terrapin Station > Drums" as "Jam" is not a defined song.

However in rare cases where the music significantly changes tempo, key and rhythm it may be labelled as "jam", as long as a song name is added, for example "Dear Prudence Jam".

In cases where the music goes from song to total weirdness, then only in extreme, atonal cases it is marked as "space", else, like other changes or jams (for example, "Feelin' Groovy", "Philo Stomp"), it is merely marked in the song comments.

Timings for a show are not directly related to a show, but to a recording of a show.


TimerCode
---------

TimerCode is program to make adding song timings easy.

This is because all the automatic methods I tried so far (detection by volume, machine learning start and end) were inconsistent or unreliable. The manual methods were slow and awkward, and relied on hand copying data.

TimerCode is a simple gui program written in Godot v3.5 to make it as easy as possible to enter timing data. It requires the audio of the songs you wish to time.
