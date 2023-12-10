//
// Event Viewer
//
// Copyright 2017,2019,2021,2023 Tarim
// Development funded by Bristol University Afro-Asian Studies Network
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Event Viewer provides a visualisation of delegates attending a
// series of events or conferences.
// A data visualisation of delegates at events
//

'use strict';

var Const = {
    secondsInYear: 31557600,
    msInYear: Math.round(86400000 * 365.2475),
    msInMonth: Math.round(86400000 * 365.2475 / 12),
    msInDay: 86400000,
    msInHour: Math.round(86400000 / 24),
    msInMinute: Math.round(86400000 / 24 / 60),
    tableWidth: 75,

    title: 'Event Viewer',
    header: '',
    footer: `<p>Event Viewer usage: ${document.location.host}?googleKey=API_KEY&sheet=SHEET_NAME</p><a href="instructions.html">Instructions</a>`,
    markerIconSize: 4,
    originMarkerIconSize: 1,
    originMarkerColor: '#aaaaaa',
    originMarkerOpacity: 0.8,
    initLat: 51.4513915,
    initLng: -2.5982592,
    initZoom: 2,
    startYear: 1900,
    finishYear: 2100,
    labelYear: 50,
    linkWidth: 2,
    lineOpacity: 0.5,
    lineMinWidth: 2,
    lineMaxWidth: 17,

    timeline: 1,
    acronyms: 0,
    labeled: 1,
    waterColor: '#eeeeee',
    landColor: '#cccccc',
    tileLayer: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
};



//
// Load singleton class
//   Load.initialise    called after document is loaded
//   Load.chain         push functions with callbacks to front of chain
//   Load.next          callback to run next function in chain
//   Load.parseQueryStr parse our URL query string
//   Load.javascript    load javascript from URL
//   Load.googleDoc     load all sheets in a Google spreadsheet
//   Load.sheet         load an individual sheet from a Google spreadsheet
//
//   Load.googleMap     if no tileLayer use googlemutant gridlayer
//   Load.setup         called after all data and maps are loaded
//
//   Load.message       add message to alert text
//   Load.setProgress   display text in progress element
//
// boot order:
// Load.parseQueryStr
// Load.javascript
// Load.googleDoc
// Load.sheet
//   Param.load
//   Location.load
//   Organiser.load
//   Event.load
//   Person.load
//   PeopleAtEvents.load
//     event.addDelegate
// Load.googleMap
// Load.setup
//   Tab.initialise
//   Event.initialise
//     location.setup
//     countryLine.setup
//   Person.initialise
//
var Load = {};

Load.initialise = function() {
    var queryStr = location.search.split('?')[1];
    var queryArray = queryStr ? queryStr.split('&') : [];
    Load.progress = document.getElementById('configmessage');

    Load.chain(Load.setup);
    Load.chain(Load.googleMap);
    Load.chain(Load.parseQueryStr, queryArray);
    Load.chain(Load.javascript, ['local.js?unique=' + Date.now()]);
    Load.next();
};

Load.actions = [];
Load.chain = function( fn, argArray ) {
    var actions = argArray ?
        argArray.map( function( arg ) { return function() { fn( arg ); } } ) :
        [fn];
    Load.actions = actions.concat( Load.actions );
};

Load.next = function() {
    Load.setProgress();
    var action = Load.actions.shift();
    if( action ) action();
};


// Load.parseQueryStr, Load.javascript, Load.googleDoc, Load.sheet
//   load data from the query string
//   js=URL             load javascript from URL
//   sheet=NAME         load Google spreadsheet with NAME
//   CONST=VALUE        set Const parameter
//
Load.parseQueryStr = function( query ) {
    var pair = query.split( '=' );
    var lhs = decodeURIComponent( pair[0] );
    var rhs = pair[1] && decodeURIComponent( pair[1] );
    switch( lhs ) {
    case 'js':
        Load.javascript( rhs );
        break;

    case 'sheet':
        Load.googleDoc( rhs );
        Load.next();
        break;

    default:
        Param.set( lhs, rhs );
        Load.next();
        break;
    }

};

Load.javascript = function( scriptName ) {
    Load.setProgress( 'Loading: ' + scriptName );
    include( scriptName, Load.next, function() {
        Load.message( 'Failed to load ' + scriptName );
        Load.next();
    } );
};

Load.googleDoc = function( docName ) {
    Const.googleDoc = docName;
    Load.chain(Load.sheet, [Param, Location, Organiser, Event, Person, PeopleAtEvents]);
};

Load.fullSheetName = function( prefix, sheetClass ) {
    return joinText([ prefix, ' ', sheetClass.sheetName, ', ', Const.googleDoc ]);
};

Load.sheet = function( sheetClass ) {
    Load.setProgress( Load.fullSheetName( 'Loading:', sheetClass ) );
    include(
        'https://sheets.googleapis.com/v4/spreadsheets/' + Const.googleDoc +
        '/values/' + sheetClass.sheetName +
        '?key=' + Const.googleKey +
        '&callback=' + sheetClass.name + '.load',
        Load.next,
        function() {
            if (!sheetClass.optional) {
                Load.message(Load.fullSheetName('Failed to load sheet', sheetClass));
            }
            Load.next();
        }
    );
};


Load.googleMap = function() {
    if( Const.tileLayer == 'googleMaps' || !Const.tileLayer ) {
        Load.chain( Load.javascript, [
            'https://maps.googleapis.com/maps/api/js?key=' + Const.googleKey,
            'https://unpkg.com/leaflet.gridlayer.googlemutant@0.6.4/Leaflet.GoogleMutant.js'
        ] );
    }
    Load.next();
};

Load.setup = function() {
    Load.setProgress( 'Initialising' );
    document.title = Const.title;
    document.getElementById( 'docheader' ).innerHTML = Const.header;
    document.getElementById( 'docfooter' ).innerHTML = Const.footer;

    Const.startTime = new Date( '1/1/' + Const.startYear ).getTime();
    Const.finishTime = new Date( '1/1/' + Const.finishYear ).getTime();

    Tab.initialise();
    new Chart( 'map' );

    Sandbox.group = new Sandbox('sandboxTable', 'sandboxRow');

    Event.initialise();
    Person.initialise();
    TimeLine.initialise();

    if( !isBlank( Load.messageText ) ) {
        alert( Load.messageText );
    };

    Load.next();
};


Load.messageText = '';
Load.message = function( msg ) {
    Load.messageText = joinText( [Load.messageText, '\n', msg] );
};

Load.setProgress = function( message ) {
    Load.progress.innerHTML = message ? message : '';
};





//
// Param sheet class
//   Param.set                  set Const parameters
//   Param.setConfig            set Const and reflect in DOM
//
// all sheet classes have:
//   Class.sheetName            name of sheet in Google spreadsheet
//   Class.requiredFields       array of required fields
//   Class.optionalFields       array of optional fields
//   extraFields                array of arbitrary fields shown by showFields
//   fieldIndexes               object of field name indexes
//   Class.load                 callback from Load.sheet
//   copyFields                 copy field values
//
function Param( row ) {
    this.copyFields( row );
    if( this.Parameter ) {
        Param.set( this.Parameter, this.Value );
    }
};

Param.set = function( parameter, value ) {
    Const[parameter] = (value === '' || isNaN( +value )) ? value : +value;
};

Param.setConfig = function( constName, value ) {
    Const[constName] = value === undefined ? !Const[constName] : value;
    var element = document.getElementById( 'config' + constName );
    if( element ) {
        element.lastChild.innerHTML = Const[constName] ? 'on' : 'off';
    }
};

Param.sheetName = 'Parameters';
Param.requiredFields = ['Parameter', 'Value'];
Param.optionalFields = [];
Param.prototype.extraFields = [];


// Param.load, copyFields
//   parse first row for fields starting with a capital letter and
//   call new sheetclass for each subsequent row to copy the values
//
Param.load = function( json ) {
    var sheet;
    if (isArray (json.values)) {
        sheet = json.values;
    } else if (isArray (json)) {
        sheet = json;
    } else {
        return;
    }

    var header = isArray( sheet ) ? sheet[0] : [];
    var requiredCount = 0;
    this.prototype.fieldIndexes = {};
    var extraFields = [];

    header.forEach( function( fieldName, fieldIndex ) {
        var initial = fieldName[0];
        if( initial >= 'A' && initial <= '[' ) {
            if( this.requiredFields.includes( fieldName ) ) {
                fieldName = fieldName.replace( /[^A-Za-z]/g, '' )
                ++requiredCount;

            } else if( !this.optionalFields.includes( fieldName ) ) {
                extraFields.push( fieldName );
            }

            this.prototype.fieldIndexes[fieldName] = fieldIndex;
        }
    }, this );

    extraFields.forEach( function( fieldName ) {
        if( !this.includes( fieldName ) ) {
            this.push( fieldName );
        };
    }, this.prototype.extraFields );

    if( requiredCount == this.requiredFields.length ) {
        for( var index = 1; index < sheet.length; ++index ) {
            new this( sheet[index] );
        }

    } else {
        Load.message( this.sheetName + ' sheet missing fields ' + JSON.stringify( this.requiredFields ) );
    }

    delete this.prototype.fieldIndexes;
};

// values starting with ! are treated as blank
Param.prototype.copyFields = function( row ) {
    for( var fieldName in this.fieldIndexes ) {
        var value = row[this.fieldIndexes[fieldName]];
        if( !isDefined( value ) ) value = '';
        this[fieldName] = value.startsWith( '!' ) ? '' : value.trim();
    }
};





//
// Location sheet class
//   Place              place name
//   Lat                latitude
//   Lng                longitute
//
//   latLng             lat/lngs in one object
//   marker             map marker for this location
//   color              color on map
//
//   countryLines[place]        country lines from this location
//   countryMarker      marker if this is an origin country
//
function Location( row ) {
    this.copyFields( row );
    if( !isBlank( this.Place ) ) {
        this.latLng = { lat: this.Lat, lng: this.Lng };
        Location.locations[this.Place] = this;
    }

    this.countryLines = {};
};

Location.locations = {};
Location.sheetName = 'Locations';
Location.requiredFields = ['Place', 'Lat', 'Lng'];
Location.optionalFields = ['Title', 'Color'];
Location.prototype.extraFields = [];
Location.load = Param.load;
Location.prototype.copyFields = Param.prototype.copyFields;

// set a rainbow color depending on index
Location.prototype.color = '#FFFFFF';
Location.prototype.getColor = function(ratio) {
    const scale = Math.floor(ratio * 6 * 256);
    const section = Math.floor(scale / 256) % 6;
    const shade = scale % 256;
    const range = [
        [255,  0, -1],
        [255,  1,  0],
        [ -1,255,  0],
        [  0,255,  1],
        [  0, -1,255],
        [  1,  0,255],
    ][section];

    for (var j = 0; j < 3; ++j) {
        if (range[j] == -1) range[j] = 255 - shade;
        else if (range[j] == 1) range[j] = shade;
    }

    const color = '#' + ('000000' + ((range[0] * 256 + range[1]) * 256 + range[2]).toString(16)).substr(-6);
    return color;
}


Location.prototype.setup = function(place) {
    this.color = this.Color || this.getColor((this.hasEvent-1) / (Event.locationsCount-1));

    if (this.latLng) {
        for (var place in this.countryLines) {
            this.countryLines[place] = new CountryLine(place, this);
        }
    }

    this.createMarker();
};

// create marker for the map
Location.prototype.createMarker = function() {
    if (this.latLng) {
        this.marker = L.circleMarker(this.latLng, {
                radius: Const.markerIconSize,
                color: this.color,
                zIndexOffset: 1100,
            }).
            bindTooltip(joinText([this.Place, ', ', this.Title]), {
                direction: 'top',
                className: 'eventMarker',
            }).
            on('click', Location.selectLocation, this).
            addTo(Chart.map);
    }
};

Location.selectLocation = function() {
    DropDown.method('modify', 'location', this.Place, window.event);
};

Location.selectOrigin = function() {
    DropDown.method('modify', 'origin', this.Place, window.event);
};

// display extra fields
Location.prototype.showFields = function( fields ) {
    var text = '';

    fields.forEach( function( fieldName ) {
        var value = this[fieldName];

        if( !isBlank( value ) ) {
            if( value.match( /\.png$|\.jpg$|\.jpeg$|\.gif$/i ) &&
                !value.match( /#\/media\/File:/ )
            ) {
                text += '<a href="' + value +
                    '" target="_blank"><image src="' + value +
                    '" width="100%"/></a>';

            } else {
                var suffix = '';
                if( fieldName < '[' ) {
                    text += fieldName + ': ';
                } else {
                    text += '<i>';
                    suffix = '</i>'
                }

                if( value.match( /^http:\/\/|^https:\/\// ) ) {
                    text += '<a href="' + value +
                        '" target="_blank">' + value +
                        '</a>';

                } else {
                     text += value;
                }
                text += suffix + '</br>\n';
            }
        }
    }, this );
    return text;
};


Location.renderMap = function() {
    Location.clearCounts();

    Event.events.forEach((event) => {
        if (event.filtered && event.shownOnMap) {
            for (var countryPlace in event.countries) {
                event.location.countryLines[countryPlace].delegateCount += event.countries[countryPlace].delegates.length;
            }
        }
    });

    for (var place in Event.locations) {
        const location = Event.locations[place];
        for (var countryPlace in location.countryLines) {
            location.countryLines[countryPlace].showLine();
        }
    }
};


Location.clearCounts = function() {
    for (var place in Event.locations) {
        const location = Event.locations[place];
        for (var countryPlace in location.countryLines) {
            const countryLine = location.countryLines[countryPlace];
            countryLine.delegateCount = 0;
        }
    }
};




//
// CountryLine class
// handles country lines on map
//   place              name of country
//   location           country location
//   delegateCount      number of delegates
//   line               attendance line
//
//   highlightLine      bright/dim attendance line
//   showLine           show/hide attendance line on map
//
// origins[]            countries which have delegates
//
function CountryLine(place, eventLocation) {
    this.place = place;
    this.location = eventLocation;
    this.delegateCount = 0;

    // create attendance lines for map
    const countryLocation = Location.locations[place];
    if (countryLocation && countryLocation.latLng) {
        this.line =
            L.polyline([eventLocation.latLng, countryLocation.latLng], {
                // geodesic: false,
                color: eventLocation.color,
                opacity: Const.lineOpacity,
                weight: 0,
            }).
            // on('click', CountryLine.clickLine, this).
            on('mouseover', CountryLine.highlightLine, this).
            on('mouseout', CountryLine.highlightLine, this).
            addTo(Chart.map);
        CountryLine.origins[place] = countryLocation;

    } else {
        alert(`People Origin: ${place} not in Locations`);
    }
};

CountryLine.origins = {};

CountryLine.prototype.showLine = function() {
    if (this.line) {
        const weight = this.delegateCount ? clampRange(this.delegateCount, Const.lineMinWidth, Const.lineMaxWidth) : 0;
        this.line.setStyle({
            weight,
        }).
        bindTooltip(`${this.place}&rarr;${this.location.Place}: ${this.delegateCount}`, {
            direction: 'auto',
            sticky: true,
            className: 'attendanceLine',
        })
    }
};


CountryLine.highlightLine = function(ev) {
    this.line.setStyle({
        opacity: ev.type === 'mouseover' ? 1 : Const.lineOpacity
    });
};





//
// Organiser sheet class
//   Name               organiser name
//
function Organiser(row) {
    this.copyFields(row);
    Organiser.organisers[this.Name] = this;
};

Organiser.optional = true;
Organiser.organisers = {};
Organiser.sheetName = 'Organisers';
Organiser.requiredFields = ['Name'];
Organiser.optionalFields = [];
Organiser.prototype.extraFields = [];
Organiser.load = Param.load;
Organiser.prototype.copyFields = Param.prototype.copyFields;
Organiser.prototype.showFields = Location.prototype.showFields;





//
// Event sheet class
//   event.events       array of events in start date order
//   Acronym            unique id of event
//   Start              start date
//   startTime          time in seconds of Start date
//   Location           location of event
//   Title              title of event
//
//   countries          collection of Country objects
//     Country.name             name of country
//     Country.eventID          acronym of country
//     Country.delegates        array of people UIDs
//
//  Event.initialise            initialise event data
//  setup                       setup individual event data
//  fullTitle                   return title of event
//  setMarker                   setup marker on map
//  setAttendanceLines          setup country lines on map
//
//  Event.clearMapAllEvents     hide all events on map
//  Event.toggleMapEvent        toggle event visibility on map
//  showMapEvent                display event on map
//
//  showInfoEvent               display info in event tab
//  currentIndex                index of current event
//  setHeader                   set header in event tab
//  Event.showMenuCountriesUI   UI handler for showMenuCountries
//  showMenuCountries           display info in country tab
//  showFields                  display extra fields in event tab
//  Event.findById              find an event in Event.events
//
//  Event.eventHeader           event tab element
//  Event.eventBody             event tab element
//  Event.countryMenuList       country tab element
//  Event.countryMenuHeader     country tab element
//  Event.countryMenuItem       country tab element
//
//  acronymCell                 cell in Rows
//
function Event(row) {
    this.copyFields(row);
    if (isBlank(this.Acronym)) return;

    this.countries = {};
    this.filtered = true;
    this.startTime = Date.parse(this.Start.replace(/([0-9]+)\/([0-9]+)\//, '$2/$1/'));

    if (isNaN(this.startTime)) {
        this.startTime = Date.parse(this.Start.replace(/[\/ -]/, '/1/'));
    }

    if (isNaN(this.startTime)) {
        this.startTime = -Infinity;
    }

    this.location = Location.locations[this.Location];
    if (!this.location) {
        Load.message(`Unknown location ${this.Location} for ${this.Acronym}`);
        return;
    }

    if (!this.location.hasEvent) {
        Event.locations[this.Location] = this.location;
        this.location.countryLines = {};
        this.location.hasEvent = ++Event.locationsCount;
    }

    this.organiser = Organiser.organisers[this.Organiser];

    Event.events.push(this);
};

Event.events = [];
Event.sheetName = 'Events';
Event.requiredFields = ['Acronym'];
Event.optionalFields = ['Title'];
Event.prototype.extraFields = [];

Event.load = Param.load;
Event.prototype.copyFields = Param.prototype.copyFields;
Event.prototype.showFields = Location.prototype.showFields;

Event.locations = {};
Event.locationsCount = 0;


// create a new delegate list if country is not in collection
Event.prototype.addDelegate = function(origin, acronym, uid) {
    if (origin) {
        var country = this.countries[origin];
        if (!country) {
            country = new Country(origin, acronym);
            this.countries[origin] = country;
        }
        country.delegates.push(uid);

        this.location.countryLines[origin] = {origin};
    }
};

// initilise, setup, fullTitle, setMarker, setAttendanceLines
//   set up events
//
Event.initialise = function() {
    Event.eventHeader = document.getElementById( 'eventinfoheader' );
    Event.eventBody = document.getElementById( 'eventinfobody' );
    Event.countryMenuList = document.getElementById( 'countrymenulist' );
    Event.countryMenuHeader = document.getElementById( 'countrymenuheader' );
    Event.countryMenuItem = document.getElementById( 'countrymenuitem' ).cloneNode( true );

    Event.events.sort((a, b) => a.startTime - b.startTime);
    Event.events.forEach((event, index) => event.cellIndex = index + 1);

    Event.locationsArray = [];
    for (var place in Event.locations) {
        const location = Event.locations[place];
        location.setup(place);
        Event.locationsArray.push(location);
    }

    new DropDown('location', Event.locationsArray);

    CountryLine.originsArray = [];
    for (var place in CountryLine.origins) {
        const location = CountryLine.origins[place];
        location.originMarker = L.circleMarker(location.latLng, {
                radius: Const.originMarkerIconSize,
                color: location.Color || Const.originMarkerColor,
                opacity: Const.originMarkerOpacity,
                zIndexOffset: 1000,
            }).
            bindTooltip(place, {
                direction: 'top',
                className: 'eventMarker',
            }).
            on('click', Location.selectOrigin, location).
            addTo(Chart.map);

        CountryLine.originsArray.push(location);
    };

    new DropDown('origin', CountryLine.originsArray);
};


Event.prototype.getLabel = function() {
    return (Const.acronyms || !this.organiser || !this.organiser.Name) ?
        this.Acronym :
        this.organiser.Name;
};

Event.prototype.fullTitle = function() {
    return joinText([this.getLabel(), ' ', this.Title, ' - ', this.location.Place, ' ', this.Start, '-', this.End]);
};

// Event.clearMapAllEvents, Event.selectMapAllEvents, Event.filter, Event.toggleMapEvent, Event.showMapEvent
//   handle event visibility on map
//
Event.selectMapAllEvents = function() {
    Event.events.forEach((event) => event.showMapEvent(true));
    Location.renderMap();
};

Event.clearMapAllEvents = function() {
    Event.events.forEach((event) => event.showMapEvent(false));
    Location.renderMap();
};

Event.filterUI = function(ev) {
    if (ev.key == 'Enter') {
        Event.filter();
        ev.preventDefault();
        return false;
    }
};

Event.setLabels = function(value) {
    Param.setConfig('acronyms', value);
    Event.filter();
};

Event.filter = function() {
    const eventPattern = document.getElementById('eventPattern').value;
    const regex = new RegExp(eventPattern.
        replace(/\./g, '\\.').
        replace(/\+/g, '\\+').
        replace(/\*/g, '.*').
        replace(/\?/g, '.')
    );

    const timePattern = DateRange.startRange.time < DateRange.finishRange.time;

    const locationPatternValue = document.getElementById('locationPattern').value;
    const locationPattern = `|${locationPatternValue}|`;

    const originPattern = document.getElementById('originPattern').value;

    Event.events.forEach ((event, index) => {
        event.filtered =
            (!eventPattern || regex.test(event.getLabel())) &&
            (!timePattern || (event.startTime >= DateRange.startRange.time && event.startTime <= DateRange.finishRange.time)) &&
            (!locationPatternValue || locationPattern.includes(`|${event.Location}|`)) &&
            (!originPattern || event.hasOrigin(originPattern));

        Array.from(TimeLine.acronymTable.rows).forEach((row) => {
            row.cells[index+1].style.display = event.filtered ? 'table-cell' : 'none';
        });
    });

    TimeLine.setLinks();
    Location.renderMap();
};

Event.prototype.hasOrigin = function(originPattern) {
    originPattern = `|${originPattern}|`;
    for (var country in this.countries) {
        if (originPattern.includes(`|${country}|`)) return true;
    }
    return false;
};


Event.clearInput = function() {
    document.getElementById('eventPattern').value = '';
    Event.filter();
};


Event.currentIndex = 0;
Event.showNext = function(direction, ev) {
    if (!Event.events.length) return;

    var newIndex = Event.currentIndex;
    do {
        newIndex += direction;
        if (!direction) direction = 1;
        if (newIndex < 0) newIndex = Event.events.length - 1;
        if (newIndex >= Event.events.length) newIndex = 0;
        const event = Event.events[newIndex];
        if (event.filtered) {
            if (ev) {
                if (ev.shiftKey) {
                    event.toggleMap();

                } else if (ev.ctrlKey || ev.metaKey) {
                    Event.toggleMapIndex(Event.currentIndex, false);
                    event.toggleMap(true);
                }
                ev.preventDefault();
            }

            event.showInfoEvent();
            TimeLine.scroll(event);
            return false;
        }
    } while (Event.currentIndex != newIndex);
};

Event.toggleMapEvent = function(eventId, state) {
    const event = Event.findById(eventId);
    event.toggleMap(state);
};

Event.toggleMapIndex = function(index, state) {
    const event = Event.events[index];
    event.toggleMap(state);
};

Event.prototype.toggleMap = function(state) {
    this.showMapEvent(state == undefined ? !this.shownOnMap : state);
    Location.renderMap();
};


Event.prototype.showMapEvent = function(state) {
    this.shownOnMap = state;

    const color = state ? this.location.color : 'black';
    Array.from(TimeLine.acronymTable.rows).forEach((row) => {
        const cell = row.cells[this.cellIndex];
        cell.style.color = cell.style.borderColor = color;
    });

    if (state) {
        this.showInfoEvent();
    }
};

Event.prototype.showAcronymEvent = function(state) {
};

// showInfoEvent, setHeader, Event.showMenuCountriesUI, showMenuCountries, showFields
//   display information in event and country tabs
//
Event.prototype.showInfoEvent = function() {
    this.setHeader( Event.eventHeader );

    const locationFields = this.location ? this.location.showFields(this.location.extraFields) : '';
    const organiserFields = this.organiser ? this.organiser.showFields(this.organiser.extraFields) : '';

    Event.eventBody.innerHTML = this.showFields(this.extraFields) + locationFields + organiserFields;

    this.highlight();
    this.showMenuCountries();
    Tab.show( 'eventinfo' );
};

Event.prototype.setHeader = function( header ) {
    header.innerHTML = joinText([this.getLabel(), ' ', this.Title]);
    header.value = this.Acronym;
};

Event.prototype.highlight = function() {
    Event.events.forEach ((event, index) => {
        var backgroundColor = 'initial';
        if (event == this) {
            Event.currentIndex = index;
            backgroundColor = 'lightgrey';
        }

        Array.from(TimeLine.acronymTable.rows).forEach((row) => {
            row.cells[index+1].style.backgroundColor = backgroundColor;
        });
    })
};


Event.showMenuCountriesUI = function( eventId ) {
    var event = Event.findById( eventId );
    event.showMenuCountries();
};

Event.prototype.showMenuCountries = function( ev ) {
    var countries = [];
    var delegates = [];
    for( var countryName in this.countries ) {
        var country = this.countries[countryName];
        delegates = delegates.concat( country.delegates );
        countries.push( country );
    }

    countries.sort( function( a, b ) {
        if( a.name > b.name ) return 1;
        if( a.name < b.name ) return -1;
        return 0;
    } );

    this.setHeader( Event.countryMenuHeader );

    var child;
    while( (child = Event.countryMenuList.lastChild) ) {
        removeElement( child );
    }

    countries.forEach( function( country ) {
        var item = Event.countryMenuItem.cloneNode( true );
        item.textContent = `${country.name}: ${country.delegates.length}`;
        item.value = country;
        Event.countryMenuList.appendChild( item );
    } );

    Person.showMenuPeople( this, '', delegates );
};

// Look up an acronym
Event.findById = function( acronym ) {
    return Event.events.find( function( event ) {
        return event.Acronym == acronym;
    } );
};





//
// DropDown class for drop down lists
//
function DropDown(prefix, list) {
    this.prefix = prefix;
    this.list = list;
    this.list.sort((a, b) => a.Place.localeCompare(b.Place));
    this.container = document.getElementById(prefix + 'Container');
    this.pattern = document.getElementById(prefix + 'Pattern');
    DropDown.dropDowns[prefix] = this;
};
DropDown.dropDowns = {};

DropDown.method = function(method, instant, arg1, arg2) {
    const me = DropDown.dropDowns[instant];
    if (me && me[method]) {
        me[method].call(me, arg1, arg2);
    } else {
        console.log(`Unknown method ${method} of ${instant}`);
    }
};


DropDown.prototype.createSelect = function() {
    var html = `
    <select
        id="${this.prefix}Select"
        class="selectPattern"
        multiple
        onkeydown="DropDown.method('keyDown', '${this.prefix}', event)"
        onclick="DropDown.method('choose', '${this.prefix}', event)"
        onblur="DropDown.method('closeSelect', '${this.prefix}', event)"
    >
    <option value="">Any ${this.prefix}</option>
    `;

    const pattern = `|${this.pattern.value}|`;
    this.list.forEach ((location) => {
        html += `
            <option
                value="${location.Place}"
                ${pattern.includes(`|${location.Place}|`) ? 'selected' : ''}
            >${location.Place}</option>
        `;
    });

    html += '</select>';
    this.container.innerHTML = html;
    this.select = this.container.firstElementChild;

    this.select.size = this.list.length + 1;
    do {
        var top = this.select.getBoundingClientRect().top;
    } while (top < 0 && --this.select.size > 2);

    this.select.focus();
};


DropDown.prototype.closeSelect = function() {
    this.container.innerHTML = '';
    this.select = false;
};

DropDown.prototype.toggleSelect = function(ev) {
    if (this.select) {
        this.closeSelect();
    } else {
        this.createSelect();
    }

    ev.preventDefault();
}

DropDown.prototype.keyDown = function(ev) {
    if (ev.code == 'Enter') {
        this.closeSelect();
    } else {
        setTimeout(() => this.choose(ev));
    }
};

DropDown.prototype.choose = function(ev) {
    var text = '';
    for (var opt = this.select.firstElementChild; opt; opt = opt.nextElementSibling) {
        if (opt.selected) {
            text = joinText([text, '|', opt.value]);
        }
    };
    this.pattern.value = text;

    Event.filter();
};


DropDown.prototype.clear = function() {
    this.pattern.value = '';

    Event.filter();
};


// methods called by modify
DropDown.prototype.set = function(item) {
    this.pattern.value = item;
};

DropDown.prototype.add = function(item) {
    var pattern = `|${this.pattern.value}|`;
    if (pattern.includes(`|${item}|`)) return false;
    pattern += item;
    this.pattern.value = pattern.replace(/^\|*/, '');
    return true;
};

DropDown.prototype.remove = function(item) {
    this.pattern.value =
        `|${this.pattern.value}|`.
        replace(`|${item}|`, '|').
        replace(/^\|*/, '').
        replace(/\|*$/, '');
};

DropDown.prototype.toggle = function(item) {
    if (this.add(item)) return;
    this.remove(item);
};

DropDown.prototype.modify = function(item, ev) {
    if (ev.shiftKey) this.add(item);
    else if (ev.ctrlKey || ev.metaKey) this.toggle(item);
    else this.set(item);

    Event.filter();
};





//
// Country class
// handles collections of delegates by country
//   name       name of country
//   eventID    acronym of event
//   delegates  array of UIDs
//
//   showMenuPeopleLineUI       Interface to showMenuPeopleLine
//   showMenuPeopleLine         display delegates in attend tab
//
function Country(where, acronym) {
    this.name = where;
    this.eventID = acronym;
    this.delegates = [];
}

Country.showMenuPeopleLineUI = function(country) {
    country.showMenuPeopleLine();
};

Country.prototype.showMenuPeopleLine = function() {
    var event = Event.findById(this.eventID);
    Person.showMenuPeople(event, this.name, this.delegates);
};





//
// Person sheet class
//   Event.people       collection of people by UID
//   UID                unique id of person
//   FirstName          first name(s) of person
//   LastName           last name(s) of person (for sorting)
//   name               first and last name of person
//   peopleAtEvents     array PeopleAtEvents fields
//
//  People.initialise   initialise people data
//  setup               setup individual person data
//
//  showMenuPeople      display attend tab information
//  Person.showInfoPersonUI  UI call to showInfoPerson
//  showInfoPerson      display bio tab information
//  showFields          display extra fields in bio tab
//
//  Person.menuList     attend tab element
//  Person.menuHeader   attend tab element
//  Person.menuItem     attend tab element
//  Person.personHeader bio tab element
//  Person.personBody   bio tab element
//
function Person( row ) {
    this.copyFields( row );

    this.name = joinText([ this.FirstName, ' ', this.LastName ]);
    this.peopleAtEvents = [];

    Person.people[this.UID] = this;
};

Person.people = {};
Person.sheetName = 'People';
Person.requiredFields = ['UID', 'Last Name', 'First Name'];
Person.optionalFields = [];
Person.prototype.extraFields = [];
Person.load = Param.load;
Person.prototype.copyFields = Param.prototype.copyFields;


Person.initialise = function() {
    Person.menuList = document.getElementById( 'peoplemenulist' );
    Person.menuHeader = document.getElementById( 'peoplemenuheader' );
    Person.menuItem = document.getElementById( 'peoplemenuitem' ).cloneNode( true );
    Person.personHeader = document.getElementById( 'personinfoheader' );
    Person.personBody = document.getElementById( 'personinfobody' );
};


// Person.showMenuPeople, showInfoPerson, showFields
//   set up attend and bio info tabs
//
Person.showMenuPeople = function( event, subtitle, delegates ) {
    Person.menuHeader.innerHTML =
        joinText([event.getLabel(), ' ', event.Title, ' from ', subtitle]);

    Person.peopleMenu = [];
    delegates.forEach( function( delegate ) {
        Person.peopleMenu.push( {
            id: delegate,
            name: Person.people[delegate].name,
            sortName: Person.people[delegate].LastName,
        } );
    } );

    Person.peopleMenu.sort( function( a, b ) {
        return a.sortName.localeCompare( b.sortName, 'en', {sensitivity:'base'} );
    } );

    var child;
    while( (child = Person.menuList.lastChild) ) {
        removeElement( child );
    }

    Person.peopleMenu.forEach( function( person ) {
        var item = Person.menuItem.cloneNode( true );
        item.value = person.id;
        item.innerHTML = person.name;
        Person.menuList.appendChild( item );
    } );

    Tab.show( 'peoplemenu' );
};

Person.showInfoPersonUI = function( id ) {
    Person.people[id].showInfoPerson();
};

Person.prototype.showInfoPerson = function() {
    Person.personHeader.innerHTML = this.name;
    Person.personHeader.value = this.UID;

    Person.personBody.innerHTML = this.showFields( this.extraFields );
    this.peopleAtEvents.forEach ((personAtEvent) => {
        Person.personBody.innerHTML += `
            <br/>
            <span class="biotabevent"
                onclick="Event.findById('${personAtEvent.Acronym}').showInfoEvent()"
                title="${personAtEvent.event.fullTitle()}"
            >
                ${joinText([personAtEvent.event.getLabel(), ' ', personAtEvent.event.Title])}
            </span><br/>
            Start: ${personAtEvent.event.Start}<br/>
            ${personAtEvent.showFields(personAtEvent.extraFields)}
            `;
    });

    Tab.show( 'personinfo' );
};

Person.prototype.showFields = Location.prototype.showFields;





//
// PeopleAtEvents sheet class
//   UID                person UID
//   Acronym            event acronym
//
function PeopleAtEvents(row) {
    this.copyFields(row);
    if (isBlank(this.UID)) return;

    const uid = this.UID;
    const acronym = this.Acronym;

    const person = Person.people[uid];
    this.event = Event.findById(acronym);

    if (person && this.event) {
        person.peopleAtEvents.push(this);
        this.event.addDelegate(person.Origin, acronym, uid);

    } else {
        Load.message(`Unknown PersonAtEvents ${uid}, ${acronym}`);
    }
};

PeopleAtEvents.peopleAtEvents = [];
PeopleAtEvents.sheetName = 'PeopleAtEvents';
PeopleAtEvents.requiredFields = ['UID', 'Acronym'];
PeopleAtEvents.optionalFields = [];
PeopleAtEvents.prototype.extraFields = [];
PeopleAtEvents.load = Param.load;
PeopleAtEvents.prototype.copyFields = Param.prototype.copyFields;
PeopleAtEvents.prototype.showFields = Location.prototype.showFields;





//
// Chart class          handles map layers
//   Chart.map          Leaflet map
//   Chart.gridLayer    Google gridLayer (if we have one)
//
//   Chart.reset        resets to initial lat/lng and zoom
//   Chart.setLabels    set map labels
//   Chart.setLayer     reinitialises map layer (either tile or grid)
//
function Chart( mapName ) {
    Chart.map = new L.Map( mapName );

    Chart.reset();
    Param.setConfig( 'labeled', Const.labeled );
    Chart.setLayer();
};

Chart.reset = function() {
    Chart.map.setView(
        new L.LatLng( Const.initLat, Const.initLng ),
        Const.initZoom
    );
};

Chart.setLabels = function( value ) {
    Param.setConfig( 'labeled', value );
    Chart.setLayer();
};

Chart.setLayer = function() {
    var visibility = Const.labeled ? 'on' : 'off';

    if( Const.tileLayer == 'googleMaps' || !Const.tileLayer  ) {
        if( Chart.gridLayer && Chart.map.hasLayer( Chart.gridLayer ) ) {
            Chart.map.removeLayer( Chart.gridLayer );
        }

        Chart.gridLayer = L.gridLayer.googleMutant( {
            type: 'roadmap', // 'roadmap', 'satellite', 'terrain', 'hybrid'
            styles: [
                { elementType: 'labels', stylers: [{visibility: 'off'}] },
                { elementType: 'geometry.stroke', stylers: [{visibility: 'off'}] },
                { featureType: 'road', stylers: [{visibility: 'off'}] },
                { featureType: 'poi', stylers: [{visibility: 'off'}] },
                { featureType: 'transit', stylers: [{visibility: 'off'}] },
                { featureType: 'water', stylers: [{color: Const.waterColor}] },
                { featureType: 'landscape', stylers: [{color: Const.landColor}] },
                { elementType: 'labels',
                  featureType: 'administrative.country',
                  stylers: [{visibility: visibility}] },
                { elementType: 'geometry.stroke',
                  featureType: 'administrative.country',
                  stylers: [{visibility: visibility}] },
            ]
        } ).addTo( Chart.map );

    } else {
        L.tileLayer(
            Const.tileLayer,
            { attribution: Const.attribution }
        ).addTo( Chart.map );
    }
};





// Tabs class
//   Tab.tabs           array of parent element for tabs
//   Tab.initialise     initialise the tabs
//   Tab.show           show the element and hide the rest
//
function Tab( tabElement ) {
    var elementName = tabElement.id.replace( 'tab', '' );

    this.elementName = elementName;
    tabElement.value = elementName;
    this.tabElement = tabElement;
    this.infoElement = document.getElementById( elementName );
};

Tab.tabs = [];
Tab.initialise = function() {
    var cells = document.getElementById( 'infotabs' ).rows[0].cells;
    for( var index = 0; index < cells.length; ++index ) {
        Tab.tabs.push( new Tab( cells[index] ) );
    };
};


Tab.show = function( elementName ) {
    Tab.tabs.forEach( function( tab ) {
        if( tab.elementName === elementName ) {
            tab.infoElement.style.display = 'inherit';
            tab.tabElement.style.borderBottom = '0';
        } else {
            tab.infoElement.style.display = 'none';
            tab.tabElement.style.borderBottom = '1px solid';
        }
    } );
};





//
// TimeLine class       display time line
//
function TimeLine() {};

TimeLine.show = function( value ) {
    Param.setConfig( 'timeline', value );
    document.getElementById( 'timeLine' ).style.display =
        Const.timeline ? 'initial' : 'none';
};

TimeLine.initialise = function() {
    TimeLine.initialiseElements();
    TimeLine.initialiseAcronyms();
    TimeLine.initialiseLines();
    DateRange.initialise();
    TimeLine.show(Const.timeline);
    Event.setLabels(Const.acronyms);
};

TimeLine.initialiseElements = function() {
    TimeLine.startTimeFilter = document.getElementById('startTimeFilter');
    TimeLine.finishTimeFilter = document.getElementById('finishTimeFilter');
    TimeLine.startTimeDisplay = document.getElementById('startTimeDisplay');
    TimeLine.finishTimeDisplay = document.getElementById('finishTimeDisplay');
    TimeLine.timeShade = document.getElementById('timeShade');

    TimeLine.timeSVG = document.getElementById('timeSVG');
    TimeLine.timeLabels = document.getElementById('timeLabels');
    TimeLine.timeShade = document.getElementById('timeShade');
    TimeLine.timeBorder = document.getElementById('timeBorder');
    TimeLine.timeLinks = document.getElementById('timeLinks');
    TimeLine.acronymTable = document.getElementById('acronymTable');
    TimeLine.acronymRow = document.getElementById('acronymRow');
    TimeLine.acronymCell = document.getElementById('acronymCell');
    TimeLine.scrollable = document.getElementById('scrollable');
    TimeLine.timeLines = document.getElementById('timeLines');
};


TimeLine.initialiseLines = function() {
    const box = TimeLine.timeSVG.getBoundingClientRect();
    TimeLine.left = box.left;
    TimeLine.right = box.right;
    TimeLine.width = box.width;
    const height = 40;

    TimeLine.timeBorder.setAttribute('x2', TimeLine.width);

    timeLabels.innerHTML = '';
    for (var year = Const.startYear; year < Const.finishYear; year += Const.labelYear ) {
        const x = mapRange(year, Const.startYear, Const.finishYear, 0, TimeLine.width)
        timeLabels.innerHTML += `
            <line x1="${x}" x2="${x}" y1="0" y2="${height}" stroke="black"/>
            <text x="${x+2}" y="${height*2/3}">${year}</text>
        `;
    }

    timeLinks.innerHTML = '';
    Event.events.forEach ((event) => {
        let line;
        if (event.startTime >= Const.startTime) {
            const x = mapRange(event.startTime, Const.startTime, Const.finishTime, 0, TimeLine.width);
            line = `<line x1="${x}" x2="${x}" y1="${height+2}" y2="${height*2+2}" stroke="${event.location.color}" stroke-width="2" />`;

        } else {
            line = `<line x1="-1" x2="-1" y1="${height*2}" y2="${height*2}" stroke-width="0" stroke-color="black" />`;
        }

        timeLinks.innerHTML += line;
    });

    TimeLine.setLinks();
};

//
// Draw the timeLine links
//
TimeLine.setLinks = function() {
     Event.events.forEach((event, index) => {
        const timeLink = TimeLine.timeLinks.children[index];
        const cell = TimeLine.acronymRow.cells[index+1];
        const box = cell.getBoundingClientRect();
        if (event.filtered && box.right >= TimeLine.left && box.left <= TimeLine.right) {
            timeLink.style.display = 'inherit';
            const midPoint = box.left - TimeLine.left + box.width/2;
            timeLink.setAttribute('x2', midPoint);

        } else {
            timeLink.style.display = 'none';
        }
    });
};

TimeLine.initialiseAcronyms = function() {
    Event.events.forEach ((event, index) => {
        event.acronymCell = TimeLine.acronymCell.cloneNode(true);
        event.acronymCell.innerHTML = `
            ${event.getLabel()}<br/>
            <span class="tiny">${event.Start}</span><br/>
            <span class="tiny">${event.Title}</span>
        `;
        event.acronymCell.value = index;
        event.acronymCell.title = joinText([event.Acronym, ' ', dateToString(event.startTime)]);
        TimeLine.acronymRow.appendChild(event.acronymCell);
    });
};

TimeLine.scroll = function(event) {
    const rowRect = TimeLine.acronymRow.getBoundingClientRect();
    const timeLinesRect = TimeLine.timeLines.getBoundingClientRect();
    const cellRect = event.acronymCell.getBoundingClientRect();
    const mid = cellRect.left + cellRect.width/2;

    if (mid < timeLinesRect.left || mid > timeLinesRect.right) {
        TimeLine.scrollable.scrollTo({
            behavior: 'smooth',
            left: cellRect.left - rowRect.left - (timeLinesRect.left + timeLinesRect.width/2),
        });
    };
};


//
// DateRange
// controller for input date ranges
//
function DateRange(name) {
    const rangeContainer = document.getElementById(name);
    this.rangeInput = rangeContainer.getElementsByClassName('rangeInput')[0];
    this.timeDisplay = rangeContainer.getElementsByClassName('timeDisplay')[0];
    this.rangeInput.min = Const.startTime;
    this.rangeInput.max = Const.finishTime;
    this.rangeInput.value = Const.startTime;

    this.setTime(Const.startTime);
};

DateRange.initialise = function() {
    DateRange.startRange = new DateRange('startRange');
    DateRange.finishRange = new DateRange('finishRange');
    DateRange.setStep(document.querySelector('input[name=dateStep]:checked').value);
};

DateRange.setStep = function(stepName) {
    DateRange.stepName = stepName;

    DateRange.startRange.rangeInput.step =
    DateRange.finishRange.rangeInput.step =
    DateRange.step = {
        year: Const.msInYear,
        month: Const.msInMonth,
        day: Const.msInDay,
        hour: Const.msInHour,
        minute: Const.msInMinute,
    }[stepName];
};

DateRange.startRangeUI = function() {
    DateRange.startRange.adjustValue(DateRange.finishRange);
};

DateRange.finishRangeUI = function() {
    DateRange.finishRange.adjustValue(DateRange.startRange);
};

DateRange.prototype.adjustValue = function(otherRange) {
    const startRange = DateRange.startRange;
    const finishRange = DateRange.finishRange;
    var newTime = +this.rangeInput.value;

    const date = new Date(this.time);
    const difference = Math.round((newTime - this.time) / DateRange.step);
    switch (DateRange.stepName) {
    case 'year':
        date.setYear(date.getYear() + difference);
        newTime = date.getTime();
        break;

    case 'month':
        date.setMonth(date.getMonth() + difference);
        newTime = date.getTime();
        break;
    }

    if (+startRange.rangeInput.value > +finishRange.rangeInput.value) {
        otherRange.setTime(newTime);
    }

    this.setTime(newTime);

    const left = startRange.convertTime();
    TimeLine.timeShade.setAttribute('x', left);
    const right = finishRange.convertTime();
    TimeLine.timeShade.setAttribute('width', right-left);

    Event.filter();
};

DateRange.prototype.setTime = function(time) {
    this.time = time;
    this.rangeInput.value = time;

    this.timeDisplay.textContent = dateToString(this.time);
};


DateRange.prototype.convertTime = function() {
    return mapRange(this.time, Const.startTime, Const.finishTime, 0, TimeLine.width);
};





//
// Sandbox singleton class
// for a table to compare people at events
//   Sandbox.group              only one group in the sandbox
//   table                      default table element
//   Sandbox.addPeopleUI        add all the people in the attend tab
//   Sandbox.addPersonUI        add single person from bio tab
//   addPerson                  add person to sandbox
//   Sandbox.moveRowUI          UI interface to moveRow
//   moveRow                    move a sandbox row up/down/top/bottom
//   replaceControlCell         control cell is dependent on table position
//   Sandbox.clearRowUI         UI interface to clearRow
//   clearRow                   remove a row from the sandbox group
//   Sandbox.clearRowsToBottomUI  UI interface to clearRowsToBottom
//   clearRowsToBottom          remove all rows to the bottom of sandbox group
//   sandbox.clearRowsAllUI     remove all rows from sandbox group
//
//   template                   headerRow class
//   firstCell                  name cell element
//   nameIndex                  cell index of name cell
//   controlCell                control cell element
//   controlIndex               cell index of control cell
//
function Sandbox(tableName, rowName) {
    this.table = document.getElementById(tableName);
    this.template = document.getElementById(rowName);

    this.firstCell = document.getElementById('sandboxControlFirst');
    this.controlCell = document.getElementById('sandboxControlMiddle');
};


Sandbox.addPeopleUI = function() {
    Person.peopleMenu.forEach( function( person ) {
        Sandbox.addPersonUI( person.id );
    } );
};

Sandbox.addPersonUI = function( personId ) {
    Sandbox.group.addPerson( personId );
};

Sandbox.prototype.addPerson = function(personId) {
    if (Array.from(this.table.rows).some((row) => personId == row.value)) {
        return;
    }

    const person = Person.people[personId];
    const row = this.template.cloneNode(true);

    const nameElement = row.getElementsByClassName('sandboxName')[0];
    nameElement.textContent = person.name;
    nameElement.value = person.UID;
    if (person.Role) {
        nameElement.title = person.Role;
    }
    row.value = person.UID;

    Event.events.forEach((event) => {
        const newCell = document.createElement('td');
        newCell.className = 'sandboxCell';
        newCell.innerHTML = person.peopleAtEvents.some((personEvent) => personEvent.Acronym == event.Acronym) ? '&bull;' : '';
        newCell.style.color = newCell.style.borderColor = event.shownOnMap ? event.location.color : 'black';
        row.appendChild(newCell);
    });

    this.table.appendChild(row);
    this.replaceControlCell(this.table.rows[0], this.firstCell);

    Event.filter();
};

Sandbox.moveRowUI = function(button, direction) {
    Sandbox.group.moveRow(button.closest('.sandboxRow'), direction);
};

Sandbox.prototype.moveRow = function( row, direction, clone ) {
    if( clone ) {
        row = row.cloneNode( true );
    }
    this.replaceControlCell( this.table.rows[0], this.controlCell );

    switch( direction ) {
    case 'top':
        this.table.insertBefore( row, this.table.rows[0] );
        break;

    case 'bottom':
        this.table.insertBefore( row, null );
        break;

    case 'up':
        row.previousSibling &&
            this.table.insertBefore( row, row.previousSibling );
        break;

    case 'down':
        row.nextSibling &&
            this.table.insertBefore( row, row.nextSibling.nextSibling );
        break;

    case 'clear':
        removeElement(row);
        break;

    case 'clearToBottom':
        var nextRow;
        do {
            nextRow = row.nextSibling;
            removeElement(row);
            row = nextRow;
        } while(row);
        break;
    }

    this.replaceControlCell( this.table.rows[0], this.firstCell );
};

Sandbox.prototype.replaceControlCell = function(row, cell) {
    if (row) {
        const sandboxControl = row.getElementsByClassName('sandboxControl')[0];
        sandboxControl.parentElement.replaceChild(cell.cloneNode(true), sandboxControl);
    }
};

Sandbox.clearRowsAllUI = function() {
    for( var index = Sandbox.group.table.rows.length - 1; index >= 0; --index ) {
        Sandbox.group.table.deleteRow( index );
    }
};
