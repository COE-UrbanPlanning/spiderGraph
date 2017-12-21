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

### Data format
There is not currently any sample data for this project. The format of the data we used is covered below.

One file contains information about all of the trips carried out between locations. This file should be a csv file that starts 
with the line 
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

The other data file you need is a geojson file that contains the shapes of the locations people are travelling between. Each feature within the features needs to have an "id" that corresponds to the id of the location, a "centroid" within the "properties" parameter that contains a list of the latitude and longitude of the centroid of the shape, and a list of lists of coordinates representing the points that make up the shape of each location.

The other data file you need is the filters.json file that there is an example of in this folder. It is covered in more detail in the next section.
