//
// Event Viewer
//
// Copyright 2017,2019,2021 Tarim
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
    tableWidth: 75,

    title: 'Event Viewer',
    header: '',
    footer: `<p>Event Viewer usage: ${document.location.host}?googleKey=API_KEY&sheet=SHEET_NAME</p><a href="instructions.html">Instructions</a>`,
    markerIconSize: 8,
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

    timeline: true,
    labeled: true,
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
var Load = {};

Load.initialise = function() {
    var queryStr = location.search.split('?')[1];
    var queryArray = queryStr ? queryStr.split('&') : [];
    Load.progress = document.getElementById( 'configmessage' );

    Load.chain( Load.setup );
    Load.chain( Load.googleMap );
    Load.chain( Load.parseQueryStr, queryArray );
    Load.chain( Load.javascript, ['local.js?unique=' + Date.now()] );
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
    Load.chain( Load.sheet, [Param, Location, Event, Person, PeopleAtEvents] );
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
            Load.message( Load.fullSheetName( 'Failed to load sheet', sheetClass ) );
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

    HeaderRow.create( TimelineHeader, 'timelineheader', 'timelinecell' );
    HeaderRow.create( AcronymHeader, 'acronymheader', 'acronymcell' );
    Sandbox.group = new Sandbox( 'persontable',
        HeaderRow.create( PersonTemplate, 'personrow', 'attendedcell' )
    );

    Event.initialise();
    HeaderRow.initialise();
    Person.initialise();

    new TimeLine( 'yeartable' );

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
    var sheet = json.values ? json.values : json;
    if( !isArray( sheet ) ) return;

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
//   Location.latLngs   lat/lngs by place name
//     place.Lat
//     place.Lng
//
function Location( row ) {
    this.copyFields( row );
    if( !isBlank( this.Place ) ) {
        Location.latLngs[this.Place] = {
            lat: this.Lat,
            lng: this.Lng,
        };
    }
};

Location.latLngs = {};
Location.sheetName = 'Locations';
Location.requiredFields = ['Place', 'Lat', 'Lng'];
Location.optionalFields = [];
Location.prototype.extraFields = [];

Location.load = Param.load;
Location.prototype.copyFields = Param.prototype.copyFields;





//
// Event sheet class
//   event.events       array of events in start date order
//   Acronym            unique id of event
//   Start              start date
//   startTime          time in seconds of Start date
//   Color              color from data (optional)
//   color              color to show on map
//   Location           location of event
//   latLng             lat/lng of event
//   marker             leaflet marker on map
//   Title              title of event
//
//   index              index into events array
//   shownOnMap         event displayed on map
//   countries          collection of Country objects
//     Country.name             name of country
//     Country.eventID          acronym of country
//     Country.delegates        array of people UIDs
//     Country.line             leaflet polyLine
//
//  Event.initialise            initialise event data
//  setup                       setup individual event data
//  fullTitle                   return title of event
//  setColor                    setup map color based on startTime
//  setMarker                   setup marker on map
//  setAttendanceLines          setup country lines on map
//
//  Event.clearMapAllEvents     hide all events on map
//  Event.toggleMapEvent        toggle event visibility on map
//  showMapEvent                display event on map
//
//  showInfoEvent               display info in event tab
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
function Event( row ) {
    this.copyFields( row );
    if( !isBlank( this.Acronym ) ) {
        this.index = Event.events.length;
        this.countries = {};
        Event.events.push( this );
    }
};

Event.events = [];
Event.sheetName = 'Events';
Event.requiredFields = ['Acronym', 'Title'];
Event.optionalFields = ['Color'];
Event.prototype.extraFields = [];

Event.load = Param.load;
Event.prototype.copyFields = Param.prototype.copyFields;


// initilise, setup, fullTitle, setColor, setMarker, setAttendanceLines
//   set up events
//
Event.initialise = function() {
    Event.eventHeader = document.getElementById( 'eventinfoheader' );
    Event.eventBody = document.getElementById( 'eventinfobody' );
    Event.countryMenuList = document.getElementById( 'countrymenulist' );
    Event.countryMenuHeader = document.getElementById( 'countrymenuheader' );
    Event.countryMenuItem = document.getElementById( 'countrymenuitem' ).cloneNode( true );

    Event.events.forEach( function( event ) {
        event.setup();
    } );

    Event.events.sort( function( a, b ) {
        return a.startTime - b.startTime;
    } );
};

Event.prototype.setup = function() {
    this.latLng = Location.latLngs[this.Location];
    if( !this.latLng ) {
        Load.message( 'Unknown location ' + this.Location + ' for ' + this.Acronym );
    }

    this.startTime = new Date( this.Start ).getTime();
    if( isNaN( this.startTime ) ) this.startTime = 0;
    this.color = this.Color || this.setColor( this.startTime );

    this.setMarker();
    this.setAttendanceLines();
    this.shownOnMap = false;
};

Event.prototype.fullTitle = function() {
    return joinText([ this.Acronym, ' ', this.Title, ' - ', this.Location, ' ', this.Start, '-', this.End ]);
};

// set a rainbow color depending on startTime
Event.prototype.color = '#FFFFFF';
Event.prototype.setColor = function( time ) {
    var scale = clampRange( Math.floor( mapRange( time, Const.startTime, Const.finishTime, 0, 6*256-1 ) ), 0, 6*256-1 );
    var shade = scale % 256;
    var section = Math.floor( scale / 256 ) % 6;
    var range = [
        [255,  0, -1],
        [255,  1,  0],
        [ -1,255,  0],
        [  0,255,  1],
        [  0, -1,255],
        [  1,  0,255],
    ][section];

    for( var j = 0; j < 3; ++j ) {
        if( range[j] == -1 ) range[j] = 255 - shade;
        else if( range[j] == 1 ) range[j] = shade;
    }

    return '#' + ('000000' + ((range[0]*256+range[1])*256+range[2]).toString(16)).substr(-6);
}

// set a marker up for the map
Event.prototype.setMarker = function() {
    if( this.latLng ) {
        this.marker = L.marker( this.latLng, {
            title: this.fullTitle(),
            icon: L.icon( {
                iconUrl: 'event.png',
                iconAnchor: [Const.markerIconSize, Const.markerIconSize],
            } ),
        } ).bindTooltip( this.Title, {
            permanent: true,
            direction: 'center',
            className: 'eventMarker',
            offset: [0,-2*Const.markerIconSize],
        } ).on( 'click', this.showInfoEvent, this );
    }
};

// set attendance lines on map
Event.prototype.setAttendanceLines = function() {
    if( this.latLng ) {
        for( var countryName in this.countries ) {
            var country = this.countries[countryName];
            var latLng = Location.latLngs[countryName];
            if( latLng ) {
                country.line = L.polyline( [ this.latLng, latLng ], {
                    // geodesic: false,
                    color: this.color,
                    opacity: Const.lineOpacity,
                    weight: clampRange( country.delegates.length, Const.lineMinWidth, Const.lineMaxWidth ),
                    title: countryName,
                } ).bindTooltip( countryName, {
                    direction: 'center',
                    className: 'attendanceLine',
                } ).on( 'click', country.showMenuPeopleLine, country
                  ).on( 'mouseover', country.highlightLine, country
                  ).on( 'mouseout', country.highlightLine, country );

            } else {
                Load.message( 'Unknown location ' + countryName + ' for UID ' + country.delegates );
            }
        }
    }
};

// Event.clearMapAllEvents, Event.toggleMapEvent, showMapEvent
//   handle event visibility on map
//
Event.clearMapAllEvents = function() {
    Event.events.forEach( function( event ) {
        event.showMapEvent( false );
    } );
};

Event.toggleMapEvent = function( eventId ) {
    var event = Event.findById( eventId )
    event.showMapEvent( !event.shownOnMap );
};

Event.prototype.showMapEvent = function( state ) {
    this.shownOnMap = state;

    if( isDefined( this.cellIndex ) ) {
        HeaderRow.highlightEvent( this, state );
    }

    if( this.marker ) {
        var action = state ? 'addTo' : 'remove';
        this.marker[action]( Chart.map );
        for( var countryName in this.countries ) {
            this.countries[countryName].showLine( action );
        }
    }

    if( state ) {
        this.showInfoEvent();
    }
};

// showInfoEvent, setHeader, Event.showMenuCountriesUI, showMenuCountries, showFields
//   display information in event and country tabs
//
Event.prototype.showInfoEvent = function() {
    this.setHeader( Event.eventHeader );
    Event.eventBody.innerHTML = this.showFields( this.extraFields );
    this.showMenuCountries();
    Tab.show( 'eventinfo' );
};

Event.prototype.setHeader = function( header ) {
    header.innerHTML = joinText([ this.Acronym, ' ', this.Title ]);
    header.value = this.Acronym;
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
        item.innerHTML = country.name;
        item.value = country;
        Event.countryMenuList.appendChild( item );
    } );

    Person.showMenuPeople( this, '', delegates );
};

// display extra fields
Event.prototype.showFields = function( fields ) {
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

// Look up an acronym
Event.findById = function( acronym ) {
    return Event.events.find( function( event ) {
        return event.Acronym == acronym;
    } );
};



//
// Country class
// handles collections of delegates by country
//   name       name of country
//   eventID    acronym of event
//   delegates  array of UIDs
//
//   Country.addDelegate        add delegate to a country collection
//   highlightLine              bright/dim attendance line
//   Country.showMenuPeopleLineUI  Interface to showMenuPeopleLine
//   showMenuPeopleLine         display delegates in attend tab
//   showLine                   show/hide attendance line on map
//
function Country( where, acronym ) {
    this.name = where;
    this.eventID = acronym;
    this.delegates = [];
}

// create a new delegate list if country is not in collection
Country.addDelegate = function( countries, where, acronym, uid ) {
    if( where ) {
        var country = countries[where];
        if( !country ) {
            country = new Country( where, acronym );
            countries[where] = country;
        }
        country.delegates.push( uid );
        return true;
    }
    return false;
};

Country.prototype.highlightLine = function( ev ) {
    this.line.setStyle( {
        opacity: ev.type === 'mouseover' ? 1 : Const.lineOpacity
    } );
};

Country.showMenuPeopleLineUI = function( country ) {
    country.showMenuPeopleLine();
};

Country.prototype.showMenuPeopleLine = function() {
    var event = Event.findById( this.eventID );
    Person.showMenuPeople( event, this.name, this.delegates );
};

Country.prototype.showLine = function( action ) {
    if( this.line ) {
        this.line[action]( Chart.map );
    }
};





//
// Person sheet class
//   Event.people       collection of people by UID
//   UID                unique id of person
//   FirstName          first name(s) of person
//   LastName           last name(s) of person (for sorting)
//   name               first and last name of person
//   events             array of events attended
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
    this.events = [];

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
        joinText([ event.Acronym, ' ', event.Title, ' from ', subtitle ]);

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

    Tab.show( 'personinfo' );
};

Person.prototype.showFields = Event.prototype.showFields;





//
// PeopleAtEvents sheet class
//   UID                person UID
//   Acronym            event acronym
//
function PeopleAtEvents( row ) {
    this.copyFields( row );
    if( isBlank( this.UID ) ) return;

    var uid = this.UID;
    var acronym = this.Acronym;

    var person = Person.people[uid];
    var event = Event.findById( acronym );

    if( person && event ) {
        person.events.push( acronym );

        Country.addDelegate( event.countries, person.Origin, acronym, uid );

    } else {
        Load.message( 'Unknown PersonAtEvents ' + uid + ', ' + acronym );
    }
};

PeopleAtEvents.peopleAtEvents = [];
PeopleAtEvents.sheetName = 'PeopleAtEvents';
PeopleAtEvents.requiredFields = ['UID', 'Acronym'];
PeopleAtEvents.optionalFields = [];
PeopleAtEvents.prototype.extraFields = [];
PeopleAtEvents.load = Param.load;
PeopleAtEvents.prototype.copyFields = Param.prototype.copyFields;





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
function TimeLine( tableName ) {
    var table = document.getElementById( tableName );
    for( var rowIndex = 0; rowIndex < table.rows.length; ++rowIndex ) {
        var row = table.rows[rowIndex];
        var cell = table.rows[rowIndex].cells[0];
        for( var year = Const.startYear; year < Const.finishYear; year += Const.labelYear ) {
            if( !isBlank( cell.innerHTML ) ) {
                cell.innerHTML = year.toString();
            }
            row.appendChild( cell );
            cell = cell.cloneNode( true );
        }
    }

    TimeLine.show( Const.timeline );
};

TimeLine.show = function( value ) {
    Param.setConfig( 'timeline', value );
    document.getElementById( 'timeline' ).style.display =
        Const.timeline ? 'initial' : 'none';
};





//
// HeaderRow singleton class
//   container for headerRow class instantiations:
//   TimelineHeader, AcronymHeader, PersonTemplate
//
//   HeaderRow.prefixCells      number of prefix cells (=2)
//   HeaderRow.tabled           number of cells displayed in acronym bar
//   HeaderRow.rows             array of headerRow classes
//     headerRow.row            row element
//     headerRow.cell           cell element
//
//   HeaderRow.create           creates a headerRow class
//   HeaderRow.initialise       initialise headerRows by event
//   HeaderRow.setup            initialise headerRow for single event
//   HeaderRow.appendColumn     add another column for event
//     headerRow.setupCell      initialise a cell for a headerRow
//
//   HeaderRow.highlightEvent   highlight event for all headerRows
//     headerRow.highlightEvent highlight event for single headerRow
var HeaderRow = {};

HeaderRow.create = function( rowClass, rowName, cellName ) {
    var headerRow = new rowClass();
    headerRow.row = document.getElementById( rowName );
    headerRow.cell = document.getElementById( cellName );
    headerRow.prefixCells = headerRow.row.cells.length;

    HeaderRow.rows.push( headerRow );

    return headerRow;
};

HeaderRow.rows = [];
HeaderRow.tabled = 0;

HeaderRow.initialise = function() {
    Event.events.forEach( function( event ) {
        HeaderRow.setup( event );
    } );

    Event.events.forEach( function( event ) {
        if( isDefined( event.cellIndex ) ) {
            for( var rowIndex = 0; rowIndex < HeaderRow.rows.length; ++rowIndex ) {
                var headerRow = HeaderRow.rows[rowIndex];
                var cell = headerRow.row.cells[event.cellIndex + headerRow.prefixCells];
                headerRow.setupCell( cell, event );
            }
        }
    } );
};

HeaderRow.setup = function( event ) {
    if( !isEmpty( event.countries ) ) {
        event.cellIndex = HeaderRow.tabled;
        ++HeaderRow.tabled;
        HeaderRow.appendColumn();
    }
};

HeaderRow.appendColumn = function() {
    HeaderRow.rows.forEach( function( headerRow ) {
        headerRow.row.appendChild( headerRow.cell.cloneNode( true ) );
    } );

    HeaderRow.cellWidth = Const.tableWidth / HeaderRow.tabled;
};

HeaderRow.highlightEvent = function( event, state ) {
    HeaderRow.rows.forEach( function( headerRow ) {
        headerRow.highlightCell && headerRow.highlightCell( state, event );
    } );
};


// headerRow classes TimelineHeader, AcronymHeader, PersonTemplate
//
function TimelineHeader() {};

TimelineHeader.prototype.setupCell = function( cell, event ) {
    function mapPos( x, min, max ) {
        return mapRange( x, min, max, 100 - Const.tableWidth, 100 );
    }

    function setBackground( left, right, direction ) {
        var width = right - left;
        cell.style.left = left + '%';
        cell.style.width = width + '%';

        if( width > 0.2 ) {
            cell.style.background =
                'linear-gradient(to bottom ' + direction + ', ' +
                'transparent, transparent ' + (50-Const.linkWidth) + '%, ' +
                event.color + ' ' + (50-Const.linkWidth) + '%, ' +
                event.color + ' ' + (50+Const.linkWidth) + '%, ' +
                'transparent ' + (50+Const.linkWidth) + '%, transparent)';

        } else {
            cell.style.backgroundColor = event.color;
        }
    };

    var upper = mapPos( event.startTime, Const.startTime, Const.finishTime );
    var lower = mapPos( event.cellIndex+0.5, 0, HeaderRow.tabled );
    if( upper < lower ) {
        setBackground( upper, lower, 'left' );

    } else {
        setBackground( lower, upper, 'right' );
    }
};

function AcronymHeader() {};

AcronymHeader.prototype.setupCell = function( cell, event ) {
    cell.style.width = HeaderRow.cellWidth + '%';
    cell.innerHTML = event.Acronym;
    cell.title = event.fullTitle();
};

AcronymHeader.prototype.highlightCell = function( state, event ) {
    this.row.cells[event.cellIndex + this.prefixCells].style.color =
        state ? event.color : 'black';
};

function PersonTemplate() {};

PersonTemplate.prototype.setupCell = function( cell, event ) {
    cell.style.width = HeaderRow.cellWidth + '%';
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
function Sandbox( tableName, personTemplate ) {
    this.table = document.getElementById( tableName );
    this.template = personTemplate;

    this.firstCell = document.getElementById( 'firstcell' ).cloneNode( true );
    this.controlCell = document.getElementById( 'controlcell' ).cloneNode( true );
};

Sandbox.prototype.controlIndex = 0;
Sandbox.prototype.nameIndex = 1;

Sandbox.addPeopleUI = function() {
    Person.peopleMenu.forEach( function( person ) {
        Sandbox.addPersonUI( person.id );
    } );
};

Sandbox.addPersonUI = function( personId ) {
    Sandbox.group.addPerson( personId );
};

Sandbox.prototype.addPerson = function( personId ) {
    for( var rowIndex = 0; rowIndex < this.table.rows.length; ++rowIndex ) {
        if( personId == this.table.rows[rowIndex].cells[this.nameIndex].value ) return;
    }

    var person = Person.people[personId];
    var row = this.template.row.cloneNode( true );
    var prefixCells = this.template.prefixCells;

    row.cells[this.nameIndex].innerHTML = person.name;
    if( person.Role ) {
        row.cells[this.nameIndex].title = person.Role;
    }
    row.cells[this.nameIndex].value = person.UID;

    person.events.forEach( function( id ) {
        var cellIndex = Event.findById( id ).cellIndex;
        if( isDefined( cellIndex ) ) {
            row.cells[cellIndex + prefixCells].innerHTML = '&bull;';
        }
    } );

    this.table.appendChild( row );
    this.replaceControlCell( this.table.rows[0], this.firstCell );
};

Sandbox.moveRowUI = function( button, direction ) {
    Sandbox.group.moveRow( button.parentNode.parentNode, direction );
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
    }

    this.replaceControlCell( this.table.rows[0], this.firstCell );
};

Sandbox.prototype.replaceControlCell = function( row, cell ) {
    row.replaceChild( cell.cloneNode( true ), row.cells[this.controlIndex] );
};

Sandbox.clearRowUI = function( button ) {
    Sandbox.group.clearRow( button.parentNode.parentNode );
};

Sandbox.prototype.clearRow = function( row ) {
    removeElement( row );
    this.table.rows[0] &&
        this.replaceControlCell( this.table.rows[0], this.firstCell );
};

Sandbox.clearRowsToBottomUI = function( button ) {
    Sandbox.group.clearRowsToBottom( button.parentNode.parentNode );
};

Sandbox.prototype.clearRowsToBottom = function( row ) {
    var nextRow;
    do {
        nextRow = row.nextSibling;
        removeElement( row );
        row = nextRow;
    } while( row );
};

Sandbox.clearRowsAllUI = function() {
    for( var index = Sandbox.group.table.rows.length - 1; index >= 0; --index ) {
        Sandbox.group.table.deleteRow( index );
    }
};
