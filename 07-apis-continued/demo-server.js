'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// API routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
})

// Dark Skies / weather
app.get('/weather', getWeather);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Helper Functions

function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res => {
      return {
        search_query: query,
        formatted_query: res.body.results[0].formatted_address,
        latitude: res.body.results[0].geometry.location.lat,
        longitude: res.body.results[0].geometry.location.lng
      }
    })
    .catch(error => handleError(error));
}

function getWeather(request, response) {
  // construct url
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  // superagent request
  return superagent.get(url)
  // .then handle results, massage data
  .then( result => {
    // console.log(result.body.daily.data, 'result of DarkSky request');
    const weatherSummaries = [];
    result.body.daily.data.forEach( day => {
      const summary = new Weather(day);
      weatherSummaries.push(summary);
    });
    // send back to the browser
    response.send(weatherSummaries)
  })
  .catch( error => handleError(error, response));
  
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

function Weather(day) {
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.forecast = day.summary;
  // default values?
}
