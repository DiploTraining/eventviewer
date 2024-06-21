% Instructions - Event Viewer

The Event Viewer page is divided into sections:

+------------------+------------------+
| Map              | Information Tabs |
+------------------+------------------+
| Time Filter      | Time Line        |
+------------------+------------------+
| Event Filters    | Event Bar        |
+------------------+------------------+
| Sandbox Controls | Event Markers    |
+------------------+------------------+

Most things on the page are clickable (text will be underlined
when hovered over to show this).

A good way to experiment is to select everything with the
&#x2B24; icon in the Event Filters Section.

The Sandbox sections are not shown when the page first loads.


Map
---

The Map displays colored circle icons representing the Locations
of Events; grey circles representing the Origins of People and
colored lines connecting these Locations.  The thickness of the
lines indicates how many People came from that Origin.  Hovering
the mouse pointer over any of these features reveals more
information.

Clicking on any of the Event or Origin Locations on the map
changes the Locations or Origins in the filters.  A click
filters only for that location; shift-click adds the location to
the filter; control-click (or command-click on a Mac) toggles
the location in the filter.


Information Tabs
----------------

Information tabs appear next to the map and contain text
information about the events and people.


### Event Tab

Displays the Organisation, Title and extra fields for an event.

Clicking on the Title fills in the Attend Tab for everyone at
the event.


### From Tab

A list of all Origin Locations which People attended from.

Clicking on the Title fills in the Attend Tab for everyone at
the event.


### Attend Tab

A list of People for the whole event or from a specific Origin
Location.

Clicking on a Name will display that Person's information in the
Bio Tab.  Clicking on the Event Title will add everyone to the
Sandbox.


### Bio Tab

Biographical information about a Person.

Click on the Name to add that Person to the Sandbox.


### Control Tab

* `Reset map` Click here to reset the map to its initial center and zoom
* `Labels:`   Turn map labels on or off (only with a Google base map)
* `Timeline:` Turn the timeline display on or off
* `Loading:`  Displays the data loading progress when the page is opened or refreshed


Time Filter
-----------

Selects a time range.  Only Events with a Start Time inclusively
within that range will appear in the Event Bar.  The range is
reflected by the grey are in the Time Line.  If start and end
are equal then all of the time range is selected.

Start and end ranges may be stepped through with a mouse click
or using the left and right arrow keys.  The step is determined
by the day / month / year radio buttons.


Time Line
---------

Shows the Time Line over which the events took place with colored
lines to indicate the position within the Time Line of the
Events shown in the Event Bar.


Event Filters
-------------

Filters which change which Events appear in the Event Bar.


### Organiser Filter
Filters by the Organiser of the Event.  Filters may be part of
the name and different filters may be separated by the `|`
character.  `*` is a wildcard for any number of characters `?`
is a wildcard for a single character.


### Location Filter
Drop down list of Event Locations.  Multiple selections can be
made with the shift-key or control-key (command-key on Mac).


### Origin Filter
Drop down list of People Origins.  Multiple selections can be
made with the shift-key or control-key (command-key on Mac).


### Event Selections

* &#x2B24;      Show all Events on Map
* &xcirc;       Clear all Events on Map
* &vltri;       Select previous Event on Map and in Information Tab
* &vrtri;       Select next Event on Map and in Information Tab

Next and previous Event keys may be modified with the shift-key
or control-key (command-key on Mac).  Shift-key adds to the
selection; control-key toggles the current and new selections.
Thus control-key can be used to step through the events
individually.


Event Bar
---------

Shows the Organisation, Date and Title for the Events.

Click an Event to select or deselect them from the Map.  If an
event is selected then it is also displayed in the Event, From
and Attend Tabs.


Sandbox Controls and Event Markers
----------------------------------

The Sandbox is a table of People with the Events they attended.
Add people to the Sandbox by clicking the name in the Bio Tab or
the event Title in the Attend Tab.

Clicking a name in the sandbox fills in the Bio tab.

Controls for each row are:

* &blacktriangle;       Move row to top
* &triangle;            Move row up
* &triangledown;        Move row down
* &blacktriangledown;   Move row to bottom
* &times;               Clear row
* &otimes;              Clear rows to bottom



Data Sheets
===========

The visualisation is driven by data held Google Spreadsheets or
loaded from JSON data.  Each sheet must have a first row which
consists only of Field Names.  Any field name starting with a
lower case letter will be ignored.  There are fields which must
appear in some sheets and also extra fields which may appear to
provide additional information.

Any value which starts with an ! is treated as a comment in the
data only.  Any field name surrounded with [ ... ] will be
included as a non-compulsory field but the field name will not
be shown.  (This can be used for images and captions, for
example.)

Fields which contain a URL ending with .png, .jpg, .gif etc will
be displayed as inline images.  Other URLs will be displayed as
clickable links.

The different sheets within the Google Spreadsheets are:


People Sheet
------------

* `UID`        A unique id for each person
* `Last Name`  A person's last name (sorted by this field)
* `First Name` A person's first name (may be blank)
* `Origin`     The origin of the person (linked to the Location Sheet)

Any other fields starting with a capital letter will be listed,
in order, in the Bio Tab.


Events Sheet
------------

* `Acronym`     A unique id for each Event
* `Title`       The title or name of each Event
* `Location`    The Location of the Event (linked to Locations Sheet)
* `Organiser`   Organiser of the Event (optional - linked to Organisers Sheet)
* `Start`       The date the event started

Any other fields starting with a capital letter will be
displayed in the Event Tab.


PeopleAtEvents Sheet
--------------------

This table links People with all the Events they attended.

* `UID`         Id for the Person
* `Acronym`     Id for the Event

Any other fields are displayed in the Bio Tab.


Locations Sheet
---------------

This table gives the lat, lng coordinates for locations referenced in the
People and Events tables.  Fields are:

* `Place`       Name of Location
* `Lat`         Latitude value
* `Lng`         Longitute value
* `Color`       The color of the Event lines on the Map for that Location

Color names can be hex values or names listed on
<https://www.w3schools.com/colors/colors_names.asp>.  If Color
is blank then a color will be allocated based on the earliest
Start Date of an Event at that Location.


Organisers Sheet
----------------

* `Name`        Name of the Organiser
* `Title`       Title of Organiser

This is an optional sheet - any additional fields will appear in
the Event Tab.  This allows grouping of information together
without having to duplicate over many Events by the same
Organiser.


Parameters
----------

The parameters configure the way the data is displayed.

### title
Displayed in the window title bar.

### header
Displayed at the start of the page (can be in HTML).

### footer
Displayed at the end of the page (can be any HTML).

### initLat, initLng, initZoom
The initial latitude, longitute and zoom of the map (also used
when Reset Map is clicked).

### startYear, finishYear, labelYear
The beginning and end of the time line and the intervals which
labels appear.

### linkWidth
Width of link connecting timelines.

### lineOpacity
Floating point number for the opacity ranging from 0 (invisible)
to 1 (opaque).

### lineMinWidth, lineMaxWidth
Minimum an maximum line widths for location connecting lines on
the map.

### timeline
Whether the timeline is displayed.

### labeled
Whether the map has country names labeled.  (Only applies to
Google maps not other tile servers.)

### waterColor, landColor
Color.  Could be a named color or in the format #RRGGBB where
RR, GG and BB are hex digits.  Only applies to Google maps not
tile servers.

### googleKey
Set a Google API key to load data from a Google sheet or load
Google map grid layer.

### tileLayer, attribution
The URL of a tile server (like Open Street Map) and the
attribution which should be applied to the map.  Most tile
servers require some kind of copyright attribution as part of
their terms of use.



Loading
=======

Data may be loaded into the page in various ways.  The
Javascript file local.js is loaded automatically.


Google Spreadsheet
------------------

To read a Google spreadsheet - you need to generate a valid
Google API key.  This can be assigned in the local.js file, or
passed as a query string after the URL.

The key can be generated through the following URLs:

* <https://console.cloud.google.com/apis/credentials> Create Credentials->API Key
* <https://console.cloud.google.com/apis/library> Google Sheets API->Enable

You can also use Google Maps rather than Open Street Map if you
enable your API Key for use with maps APIs.  Although this is
free for reasonable use; this may require billing to be enabled
for the key.


Javascript
----------

The page can load additional Javascript, useful statements are:

* `Const.OPTION = VALUE;`       Set parameter value
* `Load.googleDoc('NAME');`     Load all the sheets from a Google doc
* `Param.load(JSON);`           Load parameters
* `Location.load(JSON);`        Load locations
* `Event.load(JSON);`           Load events
* `Person.load(JSON);`          Load people
* `PeopleAtEvents.load(JSON);`  Load people at events

Load.googleDoc needs Const.googleKey to be an API key which can
be used with Google maps.

When loading a sheet directly from a JSON array.  The first row
must contain the field names starting with a capital letter.


Query String
------------

Query string options may be added to the URL and are parsed as
follows:

* `sheet=NAME`          Load all sheets from a Google doc
* `js=URL`              Load the javascript file

* `PARAMETER=VALUE`     Set the PARAMETER to VALUE

