import struct
import operator
from tqdm import tqdm
from pathlib import Path
from datetime import date

from src.database_helpers import get_all_songs, get_all_venues, get_all_weather,\
    get_all_hour_weather, get_all_shows, get_all_sets, get_all_songs_in_set, get_show_from_weather

BINARY_FOLDER = Path('./database/binary_data')
SONGS_FILE = BINARY_FOLDER / 'songs.bin'
SHOWS_FILE = BINARY_FOLDER / 'shows.bin'
VENUES_FILE = BINARY_FOLDER / 'venues.bin'
WEATHER_FILE = BINARY_FOLDER / 'weather.bin'

# builds the binary files needed by the website
# there are 4 files:
#   songs.bin
#   shows.bin
#   venues.bin
#   weather.bin


def write_song_data():
    # the data format is unsigned 8-bit array
    # An array of strings, null terminated, with an extra 0 byte at the end
    # The array of strings must be arranged in the id order of the songs, from 0 upwards
    # take the easy way and just create the values required first
    print('Getting songs')
    all_songs = get_all_songs()
    # order by id value
    all_songs.sort(key=operator.attrgetter('id'))
    byte_data = []
    for i in tqdm(all_songs):
        for j in i.name:
            if ord(j) > 255:
                print(f'Error: {j}: {ord(j)}')
                return
            byte_data.append(ord(j))
        byte_data.append(0)
    # write to file
    binary_file = open(SONGS_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}B', *byte_data))
    binary_file.close()
    print(f'Saved songs to {SONGS_FILE}, {len(byte_data)} bytes')


def get_day_offset(show_date):
    # number of days since 1st Jan 1950
    start = date(1950, 1, 1)
    delta = show_date - start
    return delta.days


def write_show_data():
    #   For each show:
    #       the data format is unsigned 16-bit array
    #       First 2 bytes are the date, represented as number of days since 1st Jan 1950
    #       3rd and 4th bytes are the venue id
    #       5th and 6th bytes are the show id
    #       Then we have a set, constructed as a list of [song_index, length]
    #       Since we can't store a zero, the song_index is the real index + 1
    #           If a song seques, then add 32768 to the index
    #       Each set ends with a zero
    #       If a set STARTS with a zero, that means we are at the end of the show
    #       (i.e. put a zero at the end so we get a double zero)
    print('Getting all shows')
    all_shows = get_all_shows()
    byte_data = []
    for i in tqdm(all_shows):
        # days offset
        offset = get_day_offset(i.date)
        if offset > 65535:
            print(f'Error: Day offset is {song_index}')
            return
        byte_data.append(offset)
        # venue id
        if i.venue > 65535:
            print(f'Error: Venue id is {song_index}')
            return
        # add venue and show id's
        byte_data.append(i.venue)
        byte_data.append(i.id)
        # get all the sets from the show
        show_sets = get_all_sets(i.id)
        # sort by index
        show_sets.sort(key=operator.attrgetter('index'))
        for single_set in show_sets:
            all_songs = get_all_songs_in_set(single_set.id)
            all_songs.sort(key=operator.attrgetter('index'))
            for single_song in all_songs:
                song_index = single_song.song
                # song id 0 does not exist
                assert song_index != 0
                if single_song.segued is True:
                    song_index += 32768
                if song_index > 65535:
                    print(f'Error: Index is {song_index}')
                    return
                byte_data.append(song_index)
                if single_song.computed_time is None:
                    # can't append 0 since that is how we look for the end
                    byte_data.append(65535)
                else:
                    if single_song.computed_time > 65535:
                        print(f'Error: Time is {single_song.computed_time}')
                    byte_data.append(single_song.computed_time)
            byte_data.append(0)
        # end of sets
        byte_data.append(0)
    # end of all shows
    byte_data.append(0)

    binary_file = open(SHOWS_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}H', *byte_data))
    binary_file.close()
    print(f'Saved shows to {SHOWS_FILE}, {len(byte_data) * 2} bytes')


def write_venue_data():
    #   the data format is unsigned 8-bit array
    #   An array of strings. Each venue has 8 strings:
    #       1: Venue ID as string
    #       2: Venue name
    #       3: College name
    #       4: City name
    #       5: State name (or regional name) - this will be a code like CA if a US state
    #       6: Country name
    #       7: Latitude
    #       8: Longitude
    #   Since every venue has 8 strings, we just traverse in order
    print('Getting all venues')
    venues = get_all_venues()
    byte_data = []
    for i in tqdm(venues):
        for vstring in [str(i.id), i.name, i.college, i.city, i.state, i.country, str(i.latitude), str(i.longitude)]:
            if vstring is not None:
                for char in vstring:
                    if ord(char) > 255:
                        print(f'Error: {char}: {ord(char)}')
                    byte_data.append(ord(char))
            byte_data.append(0)
    # we need a zero byte to signify the end
    byte_data.append(0)
    # write to file
    binary_file = open(VENUES_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}B', *byte_data))
    binary_file.close()
    print(f'Saved venues to {VENUES_FILE}, {len(byte_data)} bytes')


def fix_hour_data(hour_data):
    # we are sent a list of HourWeather classes sorted by time
    # the element "time" is represented as a string, which SHOULD always have the format "00:00:00",
    # or "HH:MM:SS". So first let's assert that true for all cases
    for i in hour_data:
        t = i.time
        assert len(t) == 8
        assert len(t.split(':')) == 3
    # with that done, let's start work
    time = 0
    index = 0
    hdata = []
    # don't forget we are sorted by time
    while time < 24:
        this_time = int(hour_data[index].time.split(':')[0])
        if this_time != time:
            # we need insert this time
            hdata.append([None, None, None])
        else:
            hdata.append([hour_data[index].temp, hour_data[index].feelslike, hour_data[index].precip])
            index += 1
        time += 1
    return hdata


def write_weather_data():
    # grabs hour data for temp, feels like temp and boolean "is raining"
    # array of: [show_id, [temp, feels_like] * 24] for all weather data
    # we need all weather objects
    # for all of them, we obtain the hour data
    # for the hour data, we sort by times
    # finally, extract the following:
    # the temp per hour
    # the "feels like" temp
    # if it was raining (precip > 0.0 and not null)
    # then we can start to output
    print('Getting all weather')
    weather_data = []
    all_temps = []
    all_feels = []
    none_count = 0
    none_feels = 0
    for weather in tqdm(get_all_weather()):
        # we need to extract out the date of the show we are against
        # doesn't matter if we have 2 shows, as that is so very rare, and they'll be the same anyway
        exact_show = get_show_from_weather(weather.id)
        if len(exact_show) != 1:
            raise ValueError('> 1 match')
        show_id = exact_show[0].id
        # extract and sort
        hour_data = get_all_hour_weather(weather.id)
        hour_data.sort(key=operator.attrgetter('time'))
        # it is possible for 1 or more time values to be missing, so fix this here
        hdata = fix_hour_data(hour_data)
        weather_data.append([hdata, show_id])
        all_temps.extend([x[0] for x in hdata])
        all_feels.extend([x[1] for x in hdata])

    # remove those Nones
    all_temps = list(filter(lambda item: item is not None, all_temps))
    all_feels = list(filter(lambda item: item is not None, all_feels))
    print(f'  Temps range: {min(all_temps)} -> {max(all_temps)}')
    print(f'  Feels range: {min(all_feels)} -> {max(all_feels)}')
    # Finally we can build the data
    # Temp is done as:
    #   Take the temp and add 50.0              73.4  -> 113.4
    #   Multiply by 10 and drop the fraction:   113.4 -> 1134
    #   Add 1                                   1134  -> 1135
    # Same for feels
    calculated_data = []
    for tdata in weather_data:
        calculated_hour = []
        for thour in tdata[0]:
            temp_final = 0
            if thour[0] is not None:
                temp_final = int((thour[0] + 50.0) * 10.0) + 1
            feel_final = 0
            if thour[1] is not None:
                feel_final = int((thour[1] + 50.0) * 10.0) + 1
            if thour[2] is True:
                feel_final += 32768
            calculated_hour.append([temp_final, feel_final])
        calculated_data.append([calculated_hour, tdata[1]])

    #   array of: [weather_date, [temp, feels_like] * 24] for all weather data
    byte_data = []
    for i in calculated_data:
        byte_data.append(i[1])
        if len(i[0]) != 24:
            raise ValueError('Not 24 hours')
        for w_hour in i[0]:
            byte_data.append(w_hour[0])
            byte_data.append(w_hour[1])
        # end 0 marker
        byte_data.append(0)
    # end all data
    byte_data.append(0)

    # save the data
    binary_file = open(WEATHER_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}H', *byte_data))
    binary_file.close()
    # *2 as we save words not bytes
    print(f'Saved weather to {WEATHER_FILE}, {len(byte_data) * 2} bytes')


if __name__ == '__main__':
    write_song_data()
    #write_venue_data()
    write_show_data()
    #write_weather_data()
    print(f'All binary files complete and save to {BINARY_FOLDER}')
