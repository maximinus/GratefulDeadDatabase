import sys
import json
import requests

from datetime import time
from sqlalchemy import and_
from sqlalchemy.orm import Session

from gddb import get_engine, Show, Venue, Weather, HourWeather
from weather.secrets import API_KEY

# example: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.9697,-77.385?key=YOUR_API_KEY'
# as {URL}{location}{date as YYYY-MM-DD}?key={API_KEY}
URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/'


def get_weather(show_date, lat, long):
    location = f'{lat},{long}'
    full_url = f'{URL}{location}/{show_date}?key={API_KEY}'
    response = requests.get(url=full_url)
    data = response.json()
    if response.status_code != 200:
        print(f'Error: HTTP {response.status_code} for {full_url}')
        sys.exit()
    print(data)
    return(data)


def convert_weather_data(data):
    # there's only ever 1 day here
    data = data['days'][0]
    # need to make Weather and HourWeather objects
    neww = Weather(tempmax=data['tempmax'],
                   tempmin=data['tempmin'],
                   temp=data['temp'],
                   feelslikemax=data['feelslikemax'],
                   feelslikemin=data['feelslikemin'],
                   feelslike=data['feelslike'],
                   dew=data['dew'],
                   humidity=data['humidity'],
                   precip=data['precip'],
                   precipprob=data['precipprob'],
                   precipcover=data['precipcover'],
                   preciptype=data['preciptype'],
                   snow=data['snow'],
                   snowdepth=data['snowdepth'],
                   windgust=data['windgust'],
                   windspeed=data['windspeed'],
                   winddir=data['winddir'],
                   pressure=data['pressure'],
                   cloudcover=data['cloudcover'],
                   visibility=data['visibility'],
                   solarradiation=data['solarradiation'],
                   solarenergy=data['solarenergy'],
                   uvindex=data['uvindex'],
                   sunrise=data['sunrise'],
                   sunset=data['sunset'],
                   moonphase=data['moonphase'],
                   conditions=data['conditions'],
                   description=data['description'])
    # add to db
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        session.add(neww)
        session.flush()
    weather_id = neww.id
    for i in data['hours']:
        make_hour_weather(weather_id, i)


def make_hour_weather(weather_id, data):
    # it looks like 00:00:00, so convert to an int - minutes since 00:00
    time_data = [int(x) for x in data['datetime'].split(':')]
    minutes = (time_data[0]) * 60 + time_data[1]
    hw = HourWeather(weather=weather_id,
                     time=minutes,
                     temp=data['temp'],
                     feelslike=data['feelslike'],
                     humidity=data['humidity'],
                     dew=data['dew'],
                     precip=data['precip'],
                     precipprob=data['precipprob'],
                     snow=data['snow'],
                     snowdepth=data['snowdepth'],
                     preciptype=data['preciptype'],
                     windgust=data['windgust'],
                     windspeed=data['windspeed'],
                     winddir=data['winddir'],
                     pressure=data['pressure'],
                     visibility=data['visibility'],
                     cloudcover=data['cloudcover'],
                     solarradiation=data['solarradiation'],
                     solarenergy=data['solarenergy'],
                     uvindex=data['uvindex'],
                     conditions=data['conditions'])
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        session.add(hw)
        session.flush()


def get_viable_shows(year):
    start = f'{year}-01-01'
    end = f'{year}-12-31'
    sql_engine = get_engine()
    with Session(sql_engine) as session:
        # SELECT shows.id, shows.date, venue.long, venue.lat
        # FROM shows
        # INNER JOIN venues
        # ON show.venue = venue.id
        # WHERE shows.date >= start AND shows.date <= end AND shows.weather = NULL
        # ORDER BY shows.date
        query = session.query(Show.id, Show.date, Venue.latitude, Venue.longitude).join(Venue, Show.venue == Venue.id, isouter=True).filter(and_(
            Show.date >= start, Show.date <= end, Show.weather == None)).all()
        # this is a list of tuples with (Show.id, Show.date, Venue.longitude, Venue.latitude)
        return query


if __name__ == '__main__':
    for i in get_viable_shows(1977)[:1]:
        show_date = i[1].isoformat()
        latitude = i[2]
        longitude = i[3]
        w = get_weather(show_date, latitude, longitude)
        convert_weather_data(w)
