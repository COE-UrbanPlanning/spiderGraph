This is based off of a version of the BrushingLayer example
on [deck.gl](http://deck.gl) website. It's been updated to include
a choropleth and filters. 

### Usage
- Copy the contents of this folder to your project. 

- Copy the data you will be using to a new folder in this project and call that folder 'data'

- In app.js, change the DATA_URL and COORDS_URL variables to point to your data files
```
// Source data locations
const DATA_URL = <Location of data file>;
const COORDS_URL = <Location of coordinate file>;
```

- Open a command prompt and navigate to the project folder

- Install Package by entering the following in the command prompt 
```
npm install
```

- install webpack globally by entering the following in the command prompt
```
npm install -g webpack
```

- If either of the previous steps do not work, try opening a command prompt as an administrator, navigating to the project directory, and running the command(s) for the step(s) that didn't work there

- Add [Mapbox access token](https://www.mapbox.com/help/define-access-token/) by changing the MAPBOX_TOKEN variable in app.js
```
// Set your mapbox token here
const MAPBOX_TOKEN = <Your_Token>;
```

- Start the app. 
```
npm start
```

- In another command prompt, run webpack
```
webpack
```

- When you run `npm start`, it will tell you the URL at which you can access the visualization. If you go to that URL, you will see the map.

### Data format
There is not currently any sample data for this project. The format of the data we used is covered below.

One file, the trips file, contains information about all of the trips carried out between locations. This file should be a csv file that starts with a line similar to
```
I,J,Time,Mode,IncGrp,HHSize,count
```
In lines after this line, 
- I represents the source location
- J represents the destination location
- Time represents the time period during which the trip took place (1 means overnight, 2 means AM, 3 means midday, 4 means PM, and 5 means evening)
- Mode means the mode of transportation used for the trip (WAT means Transit by Walk, DAT means Transit by Auto, SOV means Auto-1 Occupant, HOV2 means Auto-2 Occupants, HOV3 means Auto-3+ Occupants, Bike means biking, Walk means walking, and SB means School Bus)
- IncGrp means the income group of the person making the trip (Low $10K-$20K per year, Med means $25K-$80K per year, and High means $110K-$275K per year)
- HHSize means the number of people who live in the household of the person making the trip
- count means the number of trips that exist that have the parameters preceding it

For example, the line 
```
1000,1001,2,SOV,Med,6,8
```
means that 8 trips took place between location 1000 and location 1001 in the AM in a vehicle that has one occupant where the traveller has an income between $25K-$80K per year and a household size of 6 people.

This is just an example of the data that can be shown and filtered by the trips file. The only essential values are I, J, and count. As long as you have those, you can have other values for the other columns. You can have more or fewer columns. Just keep in mind that having more columns will make the project take longer to load due to the increased amount of data.

Another data file you need, the coords file, is a geojson file that contains the shapes of the locations people are travelling between. Each feature within the features needs to have an "id" that corresponds to the id of the location, a "centroid" within the "properties" parameter that contains a list of the latitude and longitude of the centroid of the shape, and a list of lists of coordinates representing the points that make up the shape of each location.

The other data file you need is the filters.json file that there is an example of in this folder. It is covered in more detail in the next section.

### Filters format
The filters.json file contains information that the script uses to display filters. It contains objects that each have the following parameters:
- `filter`, which is a unique id for each object. It references the column in the trips file that you would like to filter.
- `label`, which is the label that will be displayed for this particular filter. 
- `type`, which is the type of filter that will be displayed. The current supported values are `continuous`, `check`, and `range`. `continuous` shows a continous range that can have one selected value at a time. `check` shows a group of boxes that can be checked or unchecked (by default, all are checked, unless startChecked is defined). `range` is similar to `continuous`, but it is possible to have a range of values selected.
- `values`, which is a list of values that will be displayed. This will be a list of lists. Each list in the list of lists has 2 values: the unique id for that value, and the label that will be shown for that value. For `continuous` and `range`, these values will be shown as points along their ranges. For `check`, the values will each be shown as their own button that can be selected or deselected. 
- `startValue`, which is optional for type `continuous`. This is the value that is selected initially. If it is not set for a `continuous` object, the farthest left value is chosen by default. This value doesn't mean anything in the context of a `check` or `range` type object. 
- `startChecked`, which is optional for objects of type `check`. If it is not present, all values will be checked by default. If it is present, only the values within its list will be checked at the beginning. Its value should be a list of the unique ids of the values. This value has no meaning in the context of a `continuous` or `range` type object.
- `startRange`, which is optional for objects of type `range`. It says what the starting left and right values of the selected range will be. It is a list of 2 unique ids from the values. If it is not present, the range from the farthest left value to the farthest right value is selected by default. This value has no meaning in the context of a `continuous` or `check` type object.
- `overflowTop`, which is an optional boolean argument for objects of type `range`. If true, the uppermost value in the range will also cover any values greater than the greatest value in the range. For example, in the filters.json file, the 6+ option in the range covers household sizes of 6 or more people. If overflowTop had not been true, only households of size 6 would be covered by the 6+ value in the range.


