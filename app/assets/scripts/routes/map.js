import Fuse from 'fuse.js';

export default {
  // JavaScript to be fired on pages that contain the map
  init() {
    var StembureausApp = window.StembureausApp || {stembureaus: [], links_external: false};

    // Icons
    var icons = {
      'Stembureau': '<i class="fa fa-pencil-alt text-red"></i> ',
      'Stembureau-orange': '<i class="fa fa-pencil-alt text-orange"></i> ',
    };

    // List gemeenten on the homepage
    StembureausApp.show_gemeenten = function (matches, query) {
      $('#results-search-gemeenten').empty();
      for (var i=0; i < matches.length; i++) {

        // Deal with alternative municipality names
        var gemeente_uri = matches[i]['gemeente_naam']
        if (matches[i]['gemeente_naam'] == 'Den Haag') {
          gemeente_uri = "'s-Gravenhage"
        }
        else if (matches[i]['gemeente_naam'] == 'Den Bosch') {
          gemeente_uri = "'s-Hertogenbosch"
        }
        else if (matches[i]['gemeente_naam'] == 'De Friese Meren') {
          gemeente_uri = "De Fryske Marren"
        }
        else if (matches[i]['gemeente_naam'] == 'Noordoost-Friesland') {
          gemeente_uri = "Noardeast-Fryslân"
        }
        else if (matches[i]['gemeente_naam'] == 'Zuidwest-Friesland') {
          gemeente_uri = "Súdwest-Fryslân"
        }

        var target = StembureausApp.links_external ? ' target="_blank" rel="noopener"' : '';
        $('#results-search-gemeenten').append($(
          '<div class="result">' +
          '<h2><a href="/s/' + gemeente_uri + '"' + target + ">" + matches[i]['gemeente_naam'] + '</a></h2>' +
          '</div>'
        ))
      }

      if (matches.length == 0 && query.length > 1) {
        $('#results-search-gemeenten').append($('<p>Helaas, we hebben geen gemeente gevonden voor uw zoekopdracht. Wellicht staat uw gemeente onder een andere naam bekend?</p>'));
      }
    };

    // List locations in rigth panel on the gemeente pages
    StembureausApp.show = function (matches, query) {
      $('#results-search').empty();

      matches.sort(function (a,b) {return (a['Nummer stembureau'] > b['Nummer stembureau']) ? 1 : ((b['Nummer stembureau'] > a['Nummer stembureau']) ? -1 : 0)});

      for (var i=0; i < matches.length; i++) {
        var opinfo = matches[i]['Openingstijden 16-03-2022'].split(' tot ');

        var weelchair_labels = {
          'ja': 'Toegankelijk voor mensen met een lichamelijke beperking',
          'nee': 'Niet toegankelijk voor mensen met een lichamelijke beperking',
          '': '',
          undefined: ''
        }

        var akoestiek_labels = {
          'ja': 'Akoestiek geschikt voor slechthorenden',
          'nee': '',
          '': '',
          undefined: ''
        }

        var gehandicaptentoilet_labels = {
          'ja': 'Gehandicaptentoilet',
          'nee': '',
          '': '',
          undefined: ''
        }

        var extra_adresaanduiding = '';
        var orange_icon = '';
        if (matches[i]['Extra adresaanduiding'].trim()) {
          if (matches[i]['Extra adresaanduiding'].toLowerCase().includes('niet open voor algemeen publiek')) {
            extra_adresaanduiding = '<h4 class="color: text-red">NB: ' + matches[i]['Extra adresaanduiding'] + '</h4>';
            orange_icon = '-orange';
          } else {
            extra_adresaanduiding = '<h5>' + matches[i]['Extra adresaanduiding'] + '</h5>';
          }
        }

        var adres = '';
        if (typeof(matches[i]['Straatnaam']) !== "object") {
          adres = matches[i]['Straatnaam'] + ' ' + matches[i]['Huisnummer'];
          if (matches[i]['Huisletter']) {
            adres += ' ' + matches[i]['Huisletter'];
          }
          if (matches[i]['Huisnummertoevoeging']) {
            adres += ' ' + matches[i]['Huisnummertoevoeging'];
          }
        }

        var plaats_naam = matches[i]['Plaats'] || '<i>Gemeente ' + matches[i]['Gemeente'] + '</i>';

        var nummer_stembureau = '';
        if (matches[i]['Nummer stembureau']) {
          nummer_stembureau = '#' + matches[i]['Nummer stembureau'] + ' '
        }

        var target = StembureausApp.links_external ? ' target="_blank" rel="noopener"' : '';

        $('#results-search').append($(
          '<div class="result row">' +
            '<div class="col-xs-12"><hr style="margin: 0; height: 1px; border-color: #888;"></div>' +
            '<div class="col-xs-12 col-sm-7">' +
              '<h2><a href="/s/' + matches[i]['Gemeente'] + '/' + matches[i]['UUID'] + '"' + target + '>' + icons['Stembureau' + orange_icon] + ' ' + nummer_stembureau + matches[i]['Naam stembureau'] + '</a></h2>' +
              '<h5>' + adres + '</h5>' +
              '<h5>' + plaats_naam + '</h5>' +
              extra_adresaanduiding +
            '</div>' +
            '<div class="col-xs-12 col-sm-5" style="padding-top: 24px;">' +
              '<p style="font-size: 12px">' + weelchair_labels[matches[i]["Toegankelijk voor mensen met een lichamelijke beperking"]] + '</p>' +
              '<p style="font-size: 12px">' + akoestiek_labels[matches[i]["Akoestiek"]] + '</p>' +
              '<p style="font-size: 12px">' + gehandicaptentoilet_labels[matches[i]["Gehandicaptentoilet"]] + '</p>' +
            '</div>' +
          '</div>'
        ))
      }

      if (matches && matches.length == 0 && query && query.length > 0) {
        $('#results-search').append($('<p>Helaas, we hebben niks kunnen vinden. Dit komt waarschijnlijk omdat we alleen zoeken in de lijst van stembureaus, en niet in alle straatnamen. Wilt u weten welk stembureau het dichtst bij u in de buurt is? Gebruik dan de knop \'Gebruik mijn locatie\'.</p>'));
      } else if (typeof query !== 'undefined' && query.length == 0){
        StembureausApp.show(StembureausApp.filtered_locations);
      }
    };

    StembureausApp.search_gemeenten = function (query) {
      var gemeenten_matches = StembureausApp.fuse_gemeenten.search(query);
      StembureausApp.show_gemeenten(gemeenten_matches, query);
    };

    // Options for Fuse locations search
    var options = {
      shouldSort: true,
      tokenize: true,
      threshold: 0.25,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        "Gemeente",
        "Plaats",
        "Straatnaam",
        "Naam stembureau"
      ]
    };

    StembureausApp.search = function (query) {
      // Create a Fuse fuzzy search for the filtered locations (used on the gemeenten pages)
      StembureausApp.fuse_locations = new Fuse(StembureausApp.filtered_locations, options);
      //console.log('should be searching for : [' + query + '] now ...');
      //console.log(query.split(/\s+/));
      var stembureau_matches = StembureausApp.fuse_locations.search(query);
      //console.log('matches:');
      //console.dir(stembureau_matches);

      StembureausApp.show(stembureau_matches, query);
    };

    StembureausApp.init = function() {
      // Create an initial Fuse fuzzy search for all locations (used on the gemeenten pages)
      StembureausApp.fuse_locations = new Fuse(StembureausApp.stembureaus, options);

      // Create a Fuse fuzzy search for the gemeenten (used on the homepage)
      var gemeente_options = {
      shouldSort: true,
      tokenize: true,
      threshold: 0.25,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        "gemeente_naam",
      ]
      };
      StembureausApp.fuse_gemeenten = new Fuse(StembureausApp.alle_gemeenten, gemeente_options);

      $('#form-gemeente-search').submit(function (e) {
        e.preventDefault();
        return false;
      });

      $('#form-gemeente-search input[type="text"]').keyup(function (e) {
        StembureausApp.search_gemeenten($(this).val());
      });

      $('#form-search').submit(function (e) {
        e.preventDefault();
        return false;
      });

      $('#form-search input[type="text"]').keyup(function (e) {
        StembureausApp.search($(this).val());
      });

      $('#btn-location').click(function (e) {
        StembureausApp.map.locate({setView : true, maxZoom: 16});
        return false;
      });
    };

    // Creates a list of openingstijden
    var create_opinfo = function(datums, loc) {
      var opinfo_output = '<dl class="dl-horizontal">';

      datums.forEach(function(datum) {
        var dag = datum.split(' ')[1];
        var opinfo = loc['Openingstijden ' + dag + '-03-2022'].split(' tot ');
        opinfo_output += '<dt style="text-align: left;">' + datum + '</dt>'
        if (opinfo[0].trim()) {
          opinfo_output += '<dd>' + opinfo[0].split('T')[1].slice(0, 5) + ' &dash; ' + opinfo[1].split('T')[1].slice(0, 5) + '</dd>';
        } else {
          opinfo_output += '<dd>gesloten</dd>'
        }
      });

      opinfo_output += '</dl>';
      return opinfo_output;
    }

    // Get the value of currently selected dag for the map filter
    var get_dag = function() {
      return $('#dag-filter').val();
    }

    var get_query = function() {
      return $('#form-search input[type="text"]').val();
    }

    var run_stembureaus = function () {
      StembureausApp.init();

      // Icons for the map markers
      var markerIcons = {
        'Stembureau': L.AwesomeMarkers.icon(
          {
            prefix: 'fa',
            icon: 'pencil-alt',
            markerColor: 'red'
          }
        ),
        'Stembureau-orange': L.AwesomeMarkers.icon(
          {
            prefix: 'fa',
            icon: 'pencil-alt',
            markerColor: 'orange'
          }
        )
      };

      var dag;

      // Apply filters to the map
      StembureausApp.filter_map = function (dag) {
        if (StembureausApp.clustermarkers) {
          StembureausApp.map.removeLayer(StembureausApp.clustermarkers);
        }
        StembureausApp.clustermarkers = L.markerClusterGroup({maxClusterRadius: 50});
        StembureausApp.filter_locations(dag);
        // Save markers to filtered_markers as we use it later to fit bounds
        StembureausApp.filtered_markers = [];
        StembureausApp.filtered_locations.forEach(function (loc) {
          var icon = markerIcons['Stembureau'];
          var orange_icon = '';
          if (loc['Extra adresaanduiding'].toLowerCase().includes('niet open voor algemeen publiek')) {
            var orange_icon = '-orange';
          }
          StembureausApp.filtered_markers.push(
            L.marker(
              [
                loc['Latitude'],
                loc['Longitude']
              ],
              {icon: markerIcons['Stembureau' + orange_icon]}
            ).bindPopup(
              StembureausApp.getPopup(loc, orange_icon)
            )
          );
        });
        StembureausApp.filtered_markers.forEach(function (marker) {
          marker.addTo(StembureausApp.clustermarkers);
        });
        StembureausApp.map.addLayer(StembureausApp.clustermarkers);
      };

      // Filter locations
      StembureausApp.filter_locations = function (dag) {
        StembureausApp.filtered_locations = [];
        StembureausApp.stembureaus.forEach(function (loc) {
          // When you only view a single location, there is no dag filter as
          // all the information is shown on the page
          if (dag) {
            if (dag == 'alles') {
              StembureausApp.filtered_locations.push(loc);
            } else if (loc['Openingstijden ' + dag + '-03-2022'].split(' tot ')[0].trim()) {
              StembureausApp.filtered_locations.push(loc);
            }
          } else {
            StembureausApp.filtered_locations.push(loc);
          }
        });
      };

      var datums = [
        'maandag 14 maart:',
        'dinsdag 15 maart:',
        'woensdag 16 maart:'
      ]

      // Create the popup which you see when you click on a marker
      StembureausApp.getPopup = function(loc, orange_icon) {
        // First create the openingstijden HTML
        var opinfo_output = '</p><i>Openingstijden</i>';
        opinfo_output += create_opinfo(datums, loc);
        opinfo_output += '<br><br>';

        // Create the final HTML output
        var target = StembureausApp.links_external ? ' target="_blank" rel="noopener"' : '';

        var output = "<p><b>" + icons['Stembureau' + orange_icon] + "</b>";

        output += " <a href=\"/s/" + loc['Gemeente'] + '/' + loc['UUID'] + "\"" + target + ">";
        if (loc['Nummer stembureau']) {
          output += "#" + loc['Nummer stembureau']  + " ";
        }
        output += loc['Naam stembureau'];
        output += "</a><br />";

        if (loc['Straatnaam']) {
          output += loc['Straatnaam'];
        }
        if (loc['Huisnummer']) {
          output += ' ' + loc['Huisnummer'];
        }
        if (loc['Huisletter']) {
          output += ' ' + loc['Huisletter'];
        }
        if (loc['Huisnummertoevoeging']) {
          output += ' ' + loc['Huisnummertoevoeging'];
        }
        if (loc['Plaats']) {
          output += "<br>" + loc['Postcode'] + ", " + loc['Plaats'];
        } else {
          output += "<i>Gemeente " + loc['Gemeente'] + "</i>";
        }
        if (loc['Extra adresaanduiding']) {
          if (loc['Extra adresaanduiding'].toLowerCase().includes('niet open voor algemeen publiek')) {
            output += '<br><h2 class="color: text-red">NB: ' + loc['Extra adresaanduiding'] + '</h2>';
          } else {
            output += '<br>' + loc['Extra adresaanduiding'];
          }
        }

        output += '<br><a href="https://geohack.toolforge.org/geohack.php?language=en&params=' + loc['Latitude'] + '_N_' + loc['Longitude'] + '_E_type:landmark&pagename=Stembureau ' + loc['Naam stembureau'] + '" target="_blank" rel="noopener">route (via externe dienst)</a>'

        output += opinfo_output;

        if (loc["Toegankelijk voor mensen met een lichamelijke beperking"] == 'ja') {
          output += '<i class="fa fa-wheelchair fa-2x" style="vertical-align: middle;" aria-hidden="true" title="Toegankelijk voor mensen met een lichamelijke beperking"></i><span class="sr-only">Toegankelijk voor mensen met een lichamelijke beperking</span>&nbsp;';
        } else {
          output += '<span class="fa-stack" title="Niet toegankelijk voor mensen met een lichamelijke beperking"><i class="fa fa-wheelchair fa-stack-1x" aria-hidden="true"></i><i class="fa fa-ban fa-stack-2x" style="color: Tomato; opacity: 0.75;"></i></span><span class="sr-only">Niet toegankelijk voor mensen met een lichamelijke beperking</span>&nbsp;';
        }
        if (loc["Akoestiek"] == 'ja') {
          output += '<i class="fa fa-deaf fa-2x" style="vertical-align: middle;" aria-hidden="true" title="Akoestiek geschikt voor slechthorenden"></i><span class="sr-only">Akoestiek geschikt voor slechthorenden</span>&nbsp;';
        }
        if (loc["Gehandicaptentoilet"] == 'ja') {
          output += '<i class="fa fa-wheelchair fa-2x" style="vertical-align: middle;" aria-hidden="true" title="Gehandicaptentoilet"></i><span title="Gehandicaptentoilet" style="position: relative; top: -8px; left: -10px" aria-hidden="true">WC</span><span class="sr-only">Gehandicaptentoilet</span>&nbsp;';
        }
        output += '</p>';
        return output;
      };

      StembureausApp.map = L.map('map', {zoomSnap: 0.2}).setView([52.2, 5.3], 7);

      StembureausApp.map.attributionControl.setPrefix('<a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>');

      // Basisregistratie Topografie (BRT) map used when viewing 'Europees Nederland' on our map
      var brt = L.tileLayer(
        'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png',
        {
          id: 'brt',
          attribution: 'Kaartgegevens &copy; <a href="https://www.kadaster.nl/" target="_blank" rel="noopener">Kadaster</a> | <a href="https://waarismijnstemlokaal.nl/" target="_blank" rel="noopener">Waar is mijn stemlokaal</a>'
        }
      );

      // OpenStreetMap map used when viewing all other places outside 'Europees Nederland' on our map,
      // because BRT doesn't have that data
      var osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          id: 'osm',
          attribution: '<a href="http://osm.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | <a href="https://waarismijnstemlokaal.nl/" target="_blank" rel="noopener">Waar is mijn stemlokaal</a>'
        }
      );

      // Use BRT in 'Europees Nederland' and OSM for the rest
      var zoom = StembureausApp.map.getZoom();
      var center = StembureausApp.map.getCenter();
      if (zoom >= 6 && center.lat > 50 && center.lat < 54 && center.lng > 3 && center.lng < 8) {
        StembureausApp.map.removeLayer(osm);
        StembureausApp.map.addLayer(brt);
      } else {
        StembureausApp.map.removeLayer(brt);
        StembureausApp.map.addLayer(osm);
      }

      // Show BRT only when zoomed in on European Netherlands, use OSM for
      // the rest
      StembureausApp.map.on('zoom move', function() {
        var zoom = StembureausApp.map.getZoom();
        var center = StembureausApp.map.getCenter();
        if (zoom >= 6 && center.lat > 50 && center.lat < 54 && center.lng > 3 && center.lng < 8) {
          StembureausApp.map.removeLayer(osm);
          StembureausApp.map.addLayer(brt);
        } else {
          StembureausApp.map.removeLayer(brt);
          StembureausApp.map.addLayer(osm);
        }
      });

      // Apply updates to the map if the dag filter is clicked
      $('#dag-filter').change(function() {
        StembureausApp.filter_map(
          dag=this.value
        );
        StembureausApp.search(get_query());
      });

      // Default view: show all stembureaus on the 16th of March
      StembureausApp.filter_map(
        dag=get_dag()
      );

      // Select the location to fit the bounds of the map to; use all locations if
      // there are less than 50 (useful for debugging), otherwise only show
      // locations with a longitude > 0; this excludes locations in
      // 'Caribisch Nederland' which would make the map zoom out too much
      StembureausApp.group = L.featureGroup(StembureausApp.filtered_markers.filter(
        function (s) {
          return (StembureausApp.filtered_markers.length <= 50) || (s._latlng.lng > 0);
        }
      ));

      // Only fit map to bounds if we are not showing the homepage map
      // (i.e. less than e.g. 2000 stembureau), because we always want to
      // show the whole map of the Netherlands even if we are still
      // collecting the locations; also only fit bounds if there is at least one
      // marker otherwise you get an error
      if (StembureausApp.filtered_markers.length > 0 && StembureausApp.filtered_markers.length < 2000) {
        StembureausApp.map.fitBounds(StembureausApp.group.getBounds(), {padding: [30, 30]});
      }
    }

    if ($('#map').length) {
      run_stembureaus();
    }
  },
  // JavaScript to be fired on pages that contain the map, after the init JS
  finalize() {
  },
};
