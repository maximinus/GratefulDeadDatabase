import struct
import datetime
import sys

from sqlalchemy.orm import Session

from gddb import get_engine, Show, PlayedSong, GDSet, Song

ROOT_DIR = '../../Website/'
SONGS_FILES = f'{ROOT_DIR}songs.bin'
SHOWS_FILES = f'{ROOT_DIR}shows.bin'


REPLACE_SONGS = {"I Know It's A Sin": "It's A Sin",
                 "Midnight Hour": "In The Midnight Hour",
                 "It's All Over Now Baby Blue": "It's All Over Now, Baby Blue",
                 "Hog For You Baby": "I'm A Hog For You Baby",
                 "Caution": "Caution (Do Not Stop On Tracks)",
                 "Hurts Me Too": "It Hurts Me Too",
                 "Sitting On Top Of The World": "Sittin' On Top Of The World",
                 "Minglewood Blues": "New Minglewood Blues",
                 "Silver Threads And Golden Needles": "Silver Threads And Golden Needle",
                 "Dancin' In The Streets": "Dancing In The Street",
                 "Hi-Heel Sneakers": "Hi-Heeled Sneakers",
                 "Smokestack Lightning": "Smokestack Lightnin'",
                 "Unknown Blues Song": "Blues Jam",
                 "Born Cross-Eyed": "Born Cross Eyed",
                 "Caution Jam": "Caution (Do Not Stop On Tracks) Jam",
                 "Checkin' Up On My Baby": "Checkin’ Up On My Baby",
                 "Old Old House": "Old, Old House",
                 "Slewfoot": "Ol' Slewfoot",
                 "Walkin' The Dog": "Walking The Dog",
                 "Ballad Of Casey Jones": "The Ballad Of Casey Jones",
                 "Frozen Logger": "The Frozen Logger",
                 "Rosa Lee McFall": "Rosalie Mcfall",
                 "Goin' Down The Road Feelin' Bad": "Goin' Down The Road Feeling Bad",
                 "Ode To Billie Dean": "Ode For Billie Dean",
                 "Who Do You Love": "Who Do You Love?",
                 "Me And Bobby McGee": "Me And Bobby Mcgee",
                 "Riot In Cell Block #9": "Riot In Cell Block",
                 "Help Me Rhonda": "Help Me Ronda",
                 "Promised Land": "The Promised Land",
                 "Hideaway": "Hide Away",
                 "Muddy Water": "I Washed My Hands In Muddy Water",
                 "Are You Lonely For Me": "Are You Lonely For Me Baby?",
                 "Rockin' Pneumonia": "Rockin' Pneumonia & The Boogie Woogie Flu",
                 "Mississippi Half Step": "Mississippi Half Step Uptown Toodeloo",
                 "It Takes A Lot To Laugh, It Takes A Train To Cry": "It Takes A Lot To Laugh It Takes A Train To Cry",
                 "That's Alright Mama": "That's All Right, Mama",
                 "Let Me Sing": "Let Me Sing Your Blues Away",
                 "Peggy-O": "Peggy O",
                 "Stronger Than Dirt": "Stronger Than Dirt Or Milkin' The Turkey",
                 "Lazy Lightning": "Lazy Lightnin'",
                 "Alhambra": "L'alhambra",
                 "I Got My Mojo Workin'": "Got My Mojo Workin",
                 "Jack-A-Roe": "Jack A Roe",
                 "Oh Babe, It Ain't No Lie": "Oh Babe It Ain't No Lie",
                 "Satisfaction": "(I Can't Get No) Satisfaction",
                 "Women Are Smarter": "Man Smart (Woman Smarter)",
                 "Good Time Blues": "Good Times",
                 "Hully Gully": "(Baby) Hully Gully",
                 "Heroes Gone": "Where Have The Heroes Gone",
                 "Lady Di": "Lady Di And I",
                 "A Mind To Give Up Livin'": "I Got A Mind To Give Up Livin'",
                 "Day Job": "Keep Your Day Job",
                 "Baby What You Want Me To Do?": "Baby What You Want Me To Do",
                 "I Ain't Superstitious": "I Ain't Superstitous",
                 "The Mighty Quinn": "The Mighty Quinn (Quinn The Eskimo)",
                 "Willie And The Hand Jive": "Willie & The Hand Jive",
                 "Don't Think Twice It's Alright": "Don't Think Twice, It's Alright",
                 "Times They Are A Changin'": "The Times They Are A Changin'",
                 "Memphis Blues": "Stuck Inside A Mobile With The Memphis Blues Again",
                 "Slow Train Coming": "Slow Train",
                 "Day-O": "Banana Boat Song (Day O)",
                 "Judas Priest": "The Ballad Of Frankie Lee And Judas Priest",
                 "Dead Man": "Dead Man, Dead Man",
                 "Rainy Day Women #12 and 35": "Rainy Day Women #12 & #35",
                 "Devil With The Blue Dress": "Devil With The Blue Dress On",
                 "Do You Wanna Dance?": "Do You Wanna Dance",
                 "Neighborhood Girls": "Neighbourhood Girls",
                 "What's Going On": "What's Going On?",
                 "We Can Run But We Can't Hide": "We Can Run",
                 "California Earthquake": "California Earthquake (Whole Lotta Shakin' Goin' On)",
                 "The Days Between": "Days Between",
                 "Matilda": "Matilda, Matilda",
                 "Cocaine Blues": "Tell It To Me"}


def load_from_file(filename):
    with open(filename, mode='rb') as file:
        return file.read()


def load_songs():
    data = load_from_file(SONGS_FILES)
    loaded_songs = []
    current = []
    # can't easily split a bytes object, so must do the hard work
    for i in [x[0] for x in struct.iter_unpack('=B', data)]:
        # scan along looking for zero
        if i == 0:
            loaded_songs.append(current)
            current = []
        else:
            current.append(i)
    # a bit too clever really
    return [''.join([chr(x) for x in song]) for song in loaded_songs]


def get_single_set(data, index):
    set_songs = []
    while True:
        if data[index] == 0:
            # end of this set
            index += 1
            return [set_songs, index]
        # we store song indexes with +1 so as not to hit the set marker
        # here we reset so that the index is correct
        song_index = int(data[index]) - 1
        length = data[index + 1]
        index += 2
        set_songs.append([song_index, length])


def get_sets(data, index):
    new_sets = []
    while True:
        if data[index] == 0:
            # end of these sets
            index += 1
            return [new_sets, index]
        new_set_data, index = get_single_set(data, index)
        new_sets.append(new_set_data)


def build_shows(data):
    new_shows = []
    index = 0
    while True:
        if data[index] == 0:
            return new_shows
        date = int(data[index])
        index += 1
        new_sets_data, index = get_sets(data, index)
        new_shows.append([date, new_sets_data])


def load_shows():
    data = load_from_file(SHOWS_FILES)
    # < = little endian
    # H = short, 16 bits
    data = [int(x[0]) for x in struct.iter_unpack('<H', data)]
    # we need do this manually
    return build_shows(data)


class GDShow:
    def __init__(self, show_date, all_sets):
        self.show_date = show_date
        self.all_sets = all_sets

    def __repr__(self):
        txt = [str(self.show_date)]
        for i in self.all_sets:
            txt.append('\n  ')
            for song in i:
                txt.append(f'{song[0]} / ')
        return ''.join(txt)


def get_show(show, all_songs):
    show_date = datetime.date(1950, 1, 1)
    show_date += datetime.timedelta(days=show[0])
    # arrays of sets
    all_sets = []
    for i in show[1]:
        new_set = []
        for song in i:
            song_index = song[0]
            length = song[1]
            # 65535 means "Don't have this information", we store at -1
            if length == 65536:
                length = -1
            new_set.append([all_songs[song_index], song[1]])
        all_sets.append(new_set)
    return GDShow(show_date, all_sets)


def filter_unmatched_shows(shows):
    # go through the list of shows from the binary, and filter out those we don't have
    sql_engine = get_engine()
    filtered_shows = []
    with Session(sql_engine) as session:
        for bin_show in shows:
            # find this show in the DB
            result = session.query(Show).filter(Show.date == bin_show.show_date).all()
            if len(result) == 0:
                print(f'Missing: {bin_show.show_date}')
            else:
                filtered_shows.append(bin_show)
    return filtered_shows


def get_song_id(binary_name):
    if binary_name in REPLACE_SONGS:
        binary_name = REPLACE_SONGS[binary_name]
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        match = session.query(Song).filter(Song.name == binary_name).all()
        if len(match) == 1:
            return match[0]
        else:
            # no match
            return None


def compare_song_names(all_songs):
    # confirm all the names are the same as the DB
    sql_engine = get_engine()
    missing_count = 0
    with Session(sql_engine) as session:
        for song_name in all_songs:
            results = session.query(Song).filter(Song.name == song_name).all()
            if len(results) == 0:
                # look for a replacement
                if song_name not in REPLACE_SONGS:
                    print(f'Missing {song_name}')
                    missing_count += 1
    if missing_count != 0:
        print(f'*  {missing_count} songs missing (almost all jams or raps)')
        return False
    else:
        print('* All songs found')
        return True


def get_show_from_db(matched_show):
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        show_match = session.query(Show).filter(Show.date == matched_show.show_date).all()[0]
        # get the sets from that show
        all_sets = session.query(GDSet).filter(GDSet.show == show_match.id).all()
        result_sets = []
        for i in all_sets:
            all_songs = session.query(PlayedSong).filter(PlayedSong.gdset == i.id).all()
            result_sets.append(all_songs)
    return result_sets


def compare_show(matched_show):
    # returns None, or a list of [PlayedSong, computed_time]
    db_show = get_show_from_db(matched_show)
    # this gives us an array of arrays
    # we don't actually care that they are sets, so let's join the items
    binary_songs = []
    for set_songs in matched_show.all_sets:
        for i in set_songs:
            actual_song = get_song_id(i[0])
            if actual_song is None:
                binary_songs.append([-1, i[1], i[0]])
            else:
                # these are song objects, so they have an id
                binary_songs.append([actual_song.id, i[1], i[0]])

    database_songs = []
    for i in db_show:
        database_songs.extend(i)

    # go through all the database songs
    # this is a list of played song elements that have a "song" attribute
    add_data = 0
    new_database_details = []
    for i in database_songs:
        # now we start from the beginning of the binary songs
        matched = False
        index = 0
        while index < len(binary_songs):
            # are we looking at the same song?
            if binary_songs[index][0] == i.song:
                # yes, a match. Do we have a time?
                if binary_songs[index][1] > 0:
                    # yes, we do have a time!

                    # we can add some extra detail
                    # if the song following is NOT in the database, AND has timing,
                    # it is likely that it should be added to the current song.
                    # We can check and ask the user
                    # is there a song after this one?
                    if (index + 1) < len(binary_songs):
                        # yes, so check if it's an "unknown" song
                        if binary_songs[index + 1][0] < 0:
                            # yes, it's an unknown song. Does it have a time?
                            if binary_songs[index + 1][1] > 0:
                                # yes, it does! Print details and ask
                                print(f'After {binary_songs[index][2]}, we have {binary_songs[index + 1][2]}')
                                answer = input('Merge both times to the database? ')
                                if answer.lower() == 'y':
                                    # do the merge
                                    print('Merged!!!n')
                                    binary_songs[index][1] += binary_songs[index + 1][1]
                                else:
                                    print('Not merged')
                    new_database_details.append([i, binary_songs[index][1]])
                    add_data += 1
                    matched = True
                    break
            index += 1
        # did we find the song?
        if matched:
            # yes, then remove this song from the binary songs list
            binary_songs.pop(index)
        else:
            # need to add the song anyway
            new_database_details.append([i, 65535])
    print(f'{matched_show.show_date}: Updated {add_data}/{len(new_database_details)}')

    # finally, write these to the database
    sql_engine = get_engine()
    new_db_objects = []
    with Session(sql_engine) as session:
        for index in new_database_details:
            if index[1] != 65535:
                # i.e., the data is real
                # get the object
                db_object = session.query(PlayedSong).get(index[0].id)
                db_object.computed_time = index[1]
                new_db_objects.append(db_object)
        session.commit()
    return new_database_details


def get_db_songs():
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        all_songs = [x.name for x in session.query(Song).all()]
    for i in all_songs:
        print(i)


if __name__ == '__main__':
    songs = load_songs()
    compare_song_names(songs)

    binary_shows = load_shows()
    # these are binary though, we need to convert to a better format
    # the format we need is [song_name, length] for every set
    all_shows = [get_show(x, songs) for x in load_shows()]

    matched_shows = filter_unmatched_shows(all_shows)
    # for all the matched shows, iterate over and grab the songs that match
    # these are all GDShows, as defined in this file
    for i in matched_shows:
        compare_show(i)
