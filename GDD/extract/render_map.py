import json
import geopandas as gpd
from shapely.geometry import Point, LineString
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.text import Text

from gdshowsdb_yaml_extract import extract_year

output = 'output/cleaned_venues.json'


def get_json_data(file_path):
    with open(file_path) as json_file:
        json_data = json.load(json_file)
        return json_data


class TourEntry:
    def __init__(self, show, times_played, venues):
        self.date = show.text_date
        self.city = show.city
        self.venue_name = show.venue_name
        self.location = show.full_location
        self.times_played = times_played
        self.long = None
        self.lat = None
        # find the long / lat
        for i in venues:
            if self.location == i['location_from_yaml']:
                self.long = i['longitude']
                self.lat = i['latitude']
        if self.long is None:
            raise ValueError


def get_tour(year):
    venues = get_json_data(output)
    year_data = extract_year(1977)
    # we need date, venue, city and "full_name", i.e. the venue in the venues
    shows = []
    last = None
    times_played = 1
    for i in year_data[5:31]:
        if last is not None:
            # check not same place as previous
            if last == i.full_location:
                times_played += 1
                continue
        shows.append(TourEntry(i, times_played, venues))
        last = i.full_location
        times_played = 1
    return shows


def scale_rect(x1, x2, y1, y2, factor):
    # add a margin that means this rect is factor * current_size
    topx = x1
    topy = y1
    width = x2 - x1
    height = y2 - y1
    ox = topx + (width / 2)
    oy = topy + (height / 2)
    new_topx = ox + (topx - ox) * factor
    new_topy = oy + (topy - oy) * factor
    new_width = width * factor
    new_height = height * factor
    return [new_topx, new_topx + new_width, new_topy, new_topy + new_height]


def render_map(venues):
    lines = []
    for i in range(len(venues) - 1):
        line_from = (venues[i].long, venues[i].lat)
        line_to = (venues[i + 1].long, venues[i + 1].lat)
        lines.append(LineString([line_from, line_to]))

    geo_lines = {'geometry': lines}
    geo_df = gpd.GeoDataFrame(geo_lines, crs="EPSG:4326")

    # put into buckets of up to 6 times played
    geo_points = []
    for i in range(5):
        new_points = [Point(x.long, x.lat) for x in venues if x.times_played == i + 1]
        if len(new_points) != 0:
            geo_points.append([i + 1, new_points])

    urban_map = gpd.read_file('map_data/urban/ne_50m_urban_areas.shp')
    usa_map = gpd.read_file('map_data/states2/cb_2021_us_state_500k.shp')

    # create figure and axes, assign to subplot
    fig, ax = plt.subplots(figsize=(15,15))

    # draw the USA
    usa_map.plot(ax=ax, alpha=0.4, color='green', zorder=1)
    # draw urban areas
    urban_map.plot(ax=ax, alpha=0.3, color='grey', zorder=2)
    # draw US boundaries
    usa_map.boundary.plot(ax=ax, alpha=0.4, color='black', linewidth=0.2, zorder=3)

    # draw the lines
    geo_df.plot(ax=ax, legend=False, linewidth=2.0, zorder=4, color='blue')

    for i in geo_points:
        ng_data = {'geometry': i[1]}
        new_geo = gpd.GeoDataFrame(ng_data, crs='EPSG:4326')
        new_geo.plot(ax=ax, markersize=(i[0] * 50) + 90, color='black', legend=False, zorder=5)
        new_geo.plot(ax=ax, markersize=(i[0] * 50) + 70, color='red', legend=False, zorder=6)

    # add numbers to venue markers
    index = 1
    for x in venues:
        ax.annotate(str(index), xy=(x.long, x.lat), xytext=(0.5, 0), textcoords="offset points", fontsize=8, ha='center', va='center', zorder=6)
        index += 1

    # annotate names
    #for x in venues:
    #    ax.annotate(x['name'], xy=(x['longitude'], x['latitude']), xytext=(3, 3), textcoords="offset points", fontsize=5)

    # area in world found by size of points and then increase by 10%
    xmin = min([x.long for x in venues])
    xmax = max([x.long for x in venues])
    ymin = min([x.lat for x in venues])
    ymax = max([x.lat for x in venues])
    d = scale_rect(xmin, xmax, ymin, ymax, 1.12)

    custom_data = [Line2D([0], [0], marker='o', color='w', label='Boston Gardens\n14-05-77', markerfacecolor='g', markersize=15),
                   Line2D([0], [0], marker='o', color='w', label='Barton Hall\n9-05-77', markerfacecolor='g', markersize=15),
                   Line2D([0], [0], marker='o', color='w', label='Arizona Uni\n6-05-77', markerfacecolor='g', markersize=15)]
    ax.legend(loc='lower left', fontsize=10, frameon=True, handles=custom_data)

    plt.xlim(d[0], d[1])
    plt.ylim(d[2], d[3])
    plt.show()


if __name__ == '__main__':
    venues = get_tour(1977)
    render_map(venues)
