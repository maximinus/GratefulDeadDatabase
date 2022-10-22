import sys
import json
import requests

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
    return data


def convert_weather_data(data):
    data = data['days']
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


def make_hour_weather(data, weather_id):
    hw = HourWeather(weather=weather_id,
                     time=data['time'],
                     temp=data['temp'],
                     feelslike=data[''],
                     humidity=data[''],
                     dew=data[''],
                     precip=data[''],
                     precipprob=data[''],
                     snow=data[''],
                     snowdepth=data[''],
                     preciptype=data[''],
                     windgust=data[''],
                     windspeed=data[''],
                     winddir=data[''],
                     pressure=data[''],
                     visibility=data[''],
                     cloudcover=data[''],
                     solarradiation=data[''],
                     solarenergy=data[''],
                     uvindex=data[''],
                     conditions=data[''])


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
        get_weather(show_date, latitude, longitude)
        #print(i)

    #get_next_weather()
