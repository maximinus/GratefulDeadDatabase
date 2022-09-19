import json
import geopandas as gpd
from shapely.geometry import Point, Polygon
import matplotlib.pyplot as plt


output = 'output/cleaned_venues.json'


def get_json_data(file_path):
    with open(file_path) as json_file:
        json_data = json.load(json_file)
        return json_data

venues = get_json_data(output)

points = [Point(x['longitude'], x['latitude']) for x in venues]
names = [x['name'] for x in venues]

# create GeoPandas dataframe
data = {'names': names, 'geometry': points}
geo_df = gpd.GeoDataFrame(data, crs="EPSG:4326")
usa_map = gpd.read_file('map_data/places/ne_50m_populated_places.shp')
urban_map = gpd.read_file('map_data/urban/ne_50m_urban_areas.shp')
borders = gpd.read_file('map_data/borders/ne_50m_admin_0_map_units.shp')

# create figure and axes, assign to subplot
fig, ax = plt.subplots(figsize=(15,15))

usa_map.plot(ax=ax, alpha=0.4,color='grey')
borders.plot(ax=ax)
urban_map.plot(ax=ax)
# note we never use names. Can we show next to?
geo_df.plot(ax=ax, markersize=20, color="red", legend=False)

# annotate names
for x in venues:
    ax.annotate(x['name'], xy=(x['longitude'], x['latitude']), xytext=(3, 3), textcoords="offset points", fontsize=5)

# area in world found by trial and error
plt.xlim(-126.0,-66.0)
plt.ylim(24.0, 50.0)
plt.show()
