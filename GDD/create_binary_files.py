import struct
import operator
from pathlib import Path

from src.database_helpers import get_all_songs, get_all_venues

BINARY_FOLDER = Path('./database/binary_data')
SONGS_FILE = BINARY_FOLDER / 'songs.bin'
SHOWS_FILE = BINARY_FOLDER / 'shows.bin'
VENUES_FILE = BINARY_FOLDER / 'venues.bin'
WEATHER_FILE = BINARY_FOLDER / 'weather.bin'

# builds the binary files needed by the website

# there are 4 files

# songs.bin
#   the data format is unsigned 8-bit array
#   An array of strings, null terminated, with an extra 0 byte at the end
#   The array of strings must be arranged in the id order of the songs, from 0 upwards

# shows.bin
#   For each show:
#       the data format is unsigned 16-bit array
#       First 2 bytes are the date, represented as number of days since 1st Jan 1950
#       3rd and 4th bytes are the venue id
#       Then we have a set, constructed as a list of [song_index, length]
#       Since we can't store a zero, the song_index is the real index + 1
#       Each set ends with a zero
#       If a set STARTS with a zero, that means we are at the end of the show

# venues.bin
#   the data format is unsigned 8-bit array
#   An array of strings. Each venue has 6 strings:
#       1: Venue name
#       2: City name
#       3: State name (or regional name) - this will be a code like CA if a US state
#       4: Country name
#       5: Latitude
#       6: Longitude
#   Since every venue has 6 strings, we just traverse in order

# weather.bin
#   TBD


def write_song_data():
    # take the easy way and just create the values required first
    all_songs = get_all_songs()
    # order by id value
    all_songs.sort(key=operator.attrgetter('id'))
    byte_data = []
    for i in all_songs:
        for j in i.name:
            if ord(j) > 255:
                print(f'Error: {j}: {ord(j)}')
                return
            byte_data.append(ord(j))
        byte_data.append(0)
    # write to file
    binary_file = open(SONGS_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}B', *byte_data))
    print(f'Saved songs to {SONGS_FILE}, {len(byte_data)} bytes')


def write_show_data():
    pass


def write_venue_data():
    venues = get_all_venues()



def write_weather_data():
    pass


if __name__ == '__main__':
    write_song_data()
