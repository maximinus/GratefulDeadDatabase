import os
import sys
import json
import requests
from pathlib import Path

from sqlalchemy import and_
from sqlalchemy.orm import Session

from gddb import get_engine, Show, Venue, Weather, HourWeather
from weather.secrets import API_KEY


WEATHER_DIR = Path(os.getcwd()) / 'database' / 'weather'


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
    # we need to save this data
    filepath = WEATHER_DIR / f'{show_date}.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    return(data)


def convert_weather_data(show_id, data):
    sql_engine = get_engine()
    weather_id = None
    with Session(sql_engine) as session:
        # there's only ever 1 day here
        data = data['days'][0]

        preciptype_data = None
        # preciptype a json array or null
        if data['preciptype'] is not None:
            preciptype_data = ','.join(data['preciptype'])

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
                       # this is a json array or null
                       preciptype=preciptype_data,
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
        session.add(neww)
        session.flush()
        weather_id = neww.id
        # update the show information with this value.
        # it should be NULL, so verify this to start
        matched_show = session.get(Show, show_id)
        if matched_show.weather != None:
            print('Error: Show already has weather')
            sys.exit()
        matched_show.weather = weather_id
        session.commit()
    for i in data['hours']:
        make_hour_weather(weather_id, i)


def make_hour_weather(weather_id, data):
    sql_engine = get_engine()
    with Session(sql_engine) as session:

        preciptype_data = None
        # preciptype a json array or null
        if data['preciptype'] is not None:
            preciptype_data = ','.join(data['preciptype'])

        # time data is a string, leave like that as we almost never sort
        hw = HourWeather(weather=weather_id,
                         time=data['datetime'],
                         temp=data['temp'],
                         feelslike=data['feelslike'],
                         humidity=data['humidity'],
                         dew=data['dew'],
                         precip=data['precip'],
                         precipprob=data['precipprob'],
                         snow=data['snow'],
                         snowdepth=data['snowdepth'],
                         preciptype=preciptype_data,
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
        session.add(hw)
        session.flush()
        session.commit()


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


def get_json_weather(show_date):
    filepath = WEATHER_DIR / f'{show_date}.json'
    if os.path.exists(filepath):
        # load and return
        with open(filepath) as f:
            return json.load(f)


class TopWeather:
    def __init__(self, date, venue, max_heat, heat, min_heat, weather_type, feel):
        self.date = date
        self.venue = venue
        self.max_heat = max_heat
        self.heat = heat
        self.min_heat = min_heat,
        self.weather_type = weather_type
        self.feel = feel

    def __repr__(self):
        return f'{self.date}, {self.heat} F'


def get_hottest_shows(year):
    start = f'{year}-01-01'
    end = f'{year}-12-31'
    sql_engine = get_engine()
    results = []
    with Session(sql_engine) as session:
        # get all shows in this year
        query = session.query(Show).filter(and_(Show.date >= start, Show.date <= end)).all()
        for wshow in query:
            w = session.get(Weather, wshow.weather)
            v = session.get(Venue, wshow.venue)
            results.append(TopWeather(wshow.date, v.fullname, w.tempmax, w.temp, w.tempmin, w.conditions, w.feelslike))
        print(len(query))
    return results


if __name__ == '__main__':
    #w_shows = get_hottest_shows(1977)
    # get the hottest 10
    #w_shows.sort(key=lambda x: x.heat, reverse=False)
    #for i in w_shows[:10]:
    #    print(i)
    #sys.exit()

    shows_to_get = 20
    for i in get_viable_shows(1978)[:shows_to_get]:
        show_id = int(i[0])
        show_date = i[1].isoformat()
        latitude = i[2]
        longitude = i[3]
        # we store previous API calls to avoid replications
        weather = get_json_weather(show_date)
        if weather is None:
            print(f'{show_date} - will get from API')
            weather = get_weather(show_date, latitude, longitude)
        else:
            print(f'{show_date} - got json')
        convert_weather_data(show_id, weather)
