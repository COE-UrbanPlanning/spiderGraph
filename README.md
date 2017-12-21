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

- If either of the previous steps do not work, try opening a command prompt as an administrator, navigating 
to the project directory, and running the command(s) for the step(s) that didn't work there

- Add [Mapbox access token](https://www.mapbox.com/help/define-access-token/) 
by changing the MAPBOX_TOKEN variable in app.js
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
Sample data is stored in [deck.gl Example Data](https://github.com/uber-common/deck.gl-data/tree/master/examples/arc). To use your own data, checkout
the [documentation of ArcLayer](../../docs/layers/arc-layer.md).
