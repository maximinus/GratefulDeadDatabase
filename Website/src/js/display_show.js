// display a show

function displayShow(show_date) {
    // demo: Show 31/12/78
    // in the div id of show-render
    // using the mustache div of show-template
    log("Rendering show");
    // the data should look like
    var example_data = {'show-date': '31st December 1978',
                        'show-venue': 'Winterland Arena, San Francisco, CA',
                        'sets': [{'set-name': 'Set 1', 'songs': "Sugar Magnolia > Scarlet Begonias > Fire on the Mountain / Me and My Uncle / Big River / Friend of the Devil / It's All Over Now / Stagger Lee / From the Heart of Me / Sunshine Daydream"},
                                 {'set-name': 'Set 2', 'songs': "Samson and Delilah / Ramble on Rose / I Need a Miracle / Terrapin Station > Playin' in the Band > Drums > Not Fade Away > Around and Around"},
                                 {'set-name': 'Set 3', 'songs': "Dark Star > The Other One > Dark Star > Wharf Rat > St. Stephen > Good Lovin'"},
                                 {'set-name': 'Encore 1', 'songs': "Casey Jones / Johnny B. Goode"},
                                 {'set-name': 'Encore 1', 'songs': "We Bid You Goodnight"}]};
    // get the template and render
    var template = document.getElementById('show-template').innerHTML;
    // clear out show-render and place the template
    var new_html = Mustache.render(template, example_data);
    document.getElementById('show-render').innerHTML = new_html;
};
