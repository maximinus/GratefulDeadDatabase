import requests


def get_osm_map_image():
    url = f"http://a.tile.openstreetmap.org/11/510/844.png"
    response = requests.get(url)

    if response.status_code == 200:
        with open('map_image.png', 'wb') as file:
            file.write(response.content)
        print("Map image downloaded successfully.")
    else:
        print("Failed to download the map image.")

get_osm_map_image()
