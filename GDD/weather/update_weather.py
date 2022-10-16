import requests

from secrets import API_KEY

# example: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.9697,-77.385?key=YOUR_API_KEY'
# as {URL}{location}{date as YYYY-MM-DD}?key={API_KEY}
URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/'


def get_weather():
    lat = 37.786
    long = -122.435
    location = f'{lat},{long}'
    full_url = f'{URL}{location}/1978-12-31?key={API_KEY}'
    resp = requests.get(url=full_url)
    data = resp.json()  # Check the JSON Response Content documentation below
    print(data)


if __name__ == '__main__':
    get_weather()
