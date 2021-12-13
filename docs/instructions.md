% Instructions - Event Viewer


Most things on the page are clickable (text will be underlined when hovered
over to show this).

To start, click on an acronym in the Acronym Bar.


Map
---

Events are displayed on the map as round icons with colored lines to each
country of origin of the delegates.  The thickness of the line indicates how
many delegates came from that location.

Clicking the event icon fills in the Event, From and Attend Tabs for that
event.  Clicking the country line fills in the Attend Tab with delegates for
that event from that location.


Information Tabs
----------------

Information tabs appear next to the map and contain text information about the
events and people.


### Event Tab

Displays Acronym, Title and Extra Fields for an event.

Clicking on the title fills in the Attend Tab for all delegates at the event.


### From Tab

A list of all the locations which delegates attended from.

Clicking on the title fills in the Attent Tab for al delegates at the event.


### Attend Tab

A list of delegates either for the whole event or only from a specific
location.

Clicking on a delegate will display their information in the Bio Tab.  Clicking on the Event Title will add all delegates to the Sandbox.


## Bio Tab

Biographical information about a delegate.

Click on the delegate's name to add that delegate to the Sandbox.


### Control Tab

* `Reset map` Click here to reset the map to its initial center and zoom.
* `Labels:` Turn map labels on or off
* `Timeline:` Turn the timeline display on or off
* `Loading:` Displays the data loading progress when the page is opened or refreshed.


Timeline
--------

Shows the timeline over which the events took place with colored lines to
indicate the position within the timeline.


Acronym Bar
-----------

Shows the acronyms for the events.

Click an Acronym to select or deselect them from the map; selected events are displayed in the Event, From and Attend Tabs.

The &empty; icon deselects all events.


Sandbox
-------

Table of people with the events they attended marked.  Add people to the
Sandbox by clicking the name in the Bio Tab or the event Title in the Attend
Tab.

Clicking a name in the sandbox fills in the Bio tab.  Rows can be moved up,
down or to the top or bottom; the row can be deleted or all rows to the bottom
of the table deleted.



Data Sheets
===========

The visualisation is driven by data held Google Spreadsheets or loaded from
JSON data.  Each sheet must have a first row which consists only of Field
Names.  Any field names starting with a lower case letter will be ignored.
There are fields which must appear in some sheets and also extra fields which
may appear.

Any value which starts with an ! is treated as blank.  Any field name
surrounded with [ ... ] will be included as a non-compulsory field but the
field name will not be shown.  (This can be used for images and captions, for
example.)

Fields which contain a URL ending with .png, .jpg, .gif etc will be displayed
as inline images.  Other URLs will be displayed as clickable links.

The different sheets within the Google Spreadsheets are:

People
------

Compulsory Fields are:

* `UID` A unique id for each person.
* `Last Name` A person's last name - delegates are sorted by this field.
* `First Name` A person's first name (may be blank).
* `Origin` The location of origin for the person.

Any other fields starting with a capital letter will be listed, in order, in
the Bio Tab.

Events
------

Fields are:

* `Acronym` A unique id for each event.
* `Title` The title or name of each event.
* `Location` The location of the event.
* `Start` The date the event started.
* `Color` The color of the event lines on the map (can be blank in
which case a color will be allocated based on Start date).  Color names can be hex values or names listed on <https://www.w3schools.com/colors/colors_names.asp>

Any other fields starting with a capital letter will be displayed as part of
the event information.


PeopleAtEvents
--------------

This table links people with all the events they attended.

* `UID` Id for the person.
* `Acronym` Id for the event.

Any other fields are ignored.

Locations
---------

This table gives the lat, lng coordinates for locations referenced in the
People and Events tables.  Fields are:

* `Place` Name of location.
* `Lat` Latitude co-ordinate.
* `Lng` Longitute co-ordinate.

All other fields are ignored.


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
The initial latitude, longitute and zoom of the map (also used when Reset Map
is clicked).

### startYear, finishYear, labelYear
The beginning and end of the time line and the intervals which labels appear.

### linkWidth
Width of link connecting timelines.

### lineOpacity
Floating point number for the opacity ranging from 0 (invisible) to 1 (opaque).

### lineMinWidth, lineMaxWidth
Minimum an maximum line widths for location connecting lines on the map.

### timeline
Whether the timeline is displayed.

### labeled
Whether the map has country names labeled.  (Only applies to Google maps not
tile servers.)

### waterColor, landColor
Color.  Could be a named color or in the format #RRGGBB where RR, GG and BB are
hex digits.  Only applies to Google maps not tile servers.

### googleKey
Set a Google API key to load data from a Google sheet or load Google map grid
layer.

### tileLayer, attribution
The URL of a tile server (like Open Street Map) and the attribution which
should be applied to the map.  Most tile servers require some kind of copyright
attribution as part of their terms of use.



Loading
=======

Data may be loaded into the page in various ways.  The Javascript file local.js
is loaded automatically.

Google Spreadsheet
------------------

To read a Google spreadsheet - you need to generate a valid Google API key.
This can be assigned in the local.js file, or passed as a query string after
the URL.

The key can be generated through the following URLs:

* <https://console.cloud.google.com/apis/credentials> Create Credentials->API Key
* <https://console.cloud.google.com/apis/library> Google Sheets API->Enable

You can also use Google Maps rather than Open Street Map if you enable your API
Key for use with maps APIs.  Although this is free for reasonable use; this may
require billing to be enabled for the key.


Javascript
----------

The page can load additional Javascript, useful statements are:

* `Const.OPTION = VALUE;` Set a parameter value.
* `Load.googleDoc( 'NAME' );` Load all the sheets from a Google doc.
* `Param.load( JSON );` Load parameters.
* `Location.load( JSON );` Load locations.
* `Event.load( JSON );` Load events.
* `Person.load( JSON );` Load delegates.
* `PeopleAtEvents.load( JSON );` Load people at events.

Load.googleDoc needs Const.googleKey to be an API key which can be used with
Google maps.

When loading a sheet directly from a JSON array.  The first row must contain
the field names starting with a capital letter.


Query String
------------

Query string options may be added to the URL and are parsed as follows:

* `sheet=NAME` Load all sheets from a Google doc.
* `js=URL` Load the javascript file.
* `PARAMETER=VALUE` Set the PARAMETER to VALUE.

