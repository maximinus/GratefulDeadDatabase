import struct
import operator
from pathlib import Path

from src.database_helpers import get_all_songs, get_all_venues, get_all_weather, get_all_hour_weather

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

# weather.bin
#   grabs hour data for temp, feels like temp and boolean "is raining"
#   array of: [weather_id, [temp, feels_like] * 24] for all weather data


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
    binary_file.close()
    print(f'Saved songs to {SONGS_FILE}, {len(byte_data)} bytes')


def write_show_data():
    pass


def write_venue_data():
    venues = get_all_venues()
    byte_data = []
    for i in venues:
        for vstring in [str(i.id), i.name, i.college, i.city, i.state, i.country, str(i.latitude), str(i.longitude)]:
            if vstring is not None:
                for char in vstring:
                    if ord(char) > 255:
                        print(f'Error: {char}: {ord(char)}')
                    byte_data.append(ord(char))
            byte_data.append(0)
    # write to file
    binary_file = open(VENUES_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}B', *byte_data))
    binary_file.close()
    print(f'Saved songs to {VENUES_FILE}, {len(byte_data)} bytes')


def write_weather_data():
    # we need all weather objects
    # for all of them, we obtain the hour data
    # for the hour data, we sort by times
    # finally, extract the following:
    # the temp per hour
    # the "feels like" temp
    # if it was raining (precip > 0.0 and not null)
    # then we can start to output
    print('Gathering data')
    weather_data = []
    all_temps = []
    all_feels = []
    none_count = 0
    none_feels = 0
    for weather in get_all_weather():
        # extract and sort
        hour_data = get_all_hour_weather(weather.id)
        hour_data.sort(key=operator.attrgetter('time'))
        hdata = []
        for hour in hour_data:
            if hour.temp is None:
                none_count += 1
            if hour.feelslike is None:
                none_feels += 1
            precip = 0.0
            if hour.precip is not None:
                if hour.precip > 0:
                    precip = hour.precip
            hdata.append([hour.temp, hour.feelslike, precip])
        weather_data.append([hdata, weather.id])
        all_temps.extend([x[0] for x in hdata])
        all_feels.extend([x[1] for x in hdata])

    # remove those Nones
    all_temps = list(filter(lambda item: item is not None, all_temps))
    all_feels = list(filter(lambda item: item is not None, all_feels))
    print(f'  Temps range: {min(all_temps)} -> {max(all_temps)}')
    print(f'  Feels range: {min(all_feels)} -> {max(all_feels)}')
    print(f'  Missing temps: {none_count}/{len(all_temps)}')
    print(f'  Missing feels: {none_feels}/{len(all_feels)}')
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

    #   array of: [weather_id, [temp, feels_like] * 24] for all weather data
    byte_data = []
    for i in calculated_data:
        byte_data.append(i[1])
        for w_hour in i[0]:
            byte_data.append(w_hour[0])
            byte_data.append(w_hour[1])

    # save the data
    binary_file = open(VENUES_FILE, 'wb')
    binary_file.write(struct.pack(f'<{len(byte_data)}H', *byte_data))
    binary_file.close()
    print(f'Saved songs to {WEATHER_FILE}, {len(byte_data)} bytes')


if __name__ == '__main__':
    # write_song_data()
    #write_venue_data()
    write_weather_data()
