import logging
import json
import requests
from datetime import datetime, timezone
import azure.functions as func

# Define the 5 locations with their coordinates
LOCATIONS = [
    {"name": "New York, NY", "lat": "40.7128", "lon": "-74.0060"},
    {"name": "Los Angeles, CA", "lat": "34.0522", "lon": "-118.2437"},
    {"name": "Chicago, IL", "lat": "41.8781", "lon": "-87.6298"},
    {"name": "Houston, TX", "lat": "29.7604", "lon": "-95.3698"},
    {"name": "Phoenix, AZ", "lat": "33.4484", "lon": "-112.0740"}
]

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request to sync weather.')

    weather_data = []

    for location in LOCATIONS:
        try:
            # Step 1: Get the forecast URL for the location's grid points
            points_url = f"https://api.weather.gov/points/{location['lat']},{location['lon']}"
            points_res = requests.get(points_url, headers={"User-Agent": "(my-weather-app, myemail@example.com)"})
            points_res.raise_for_status() # Raises an HTTPError for bad responses
            
            forecast_url = points_res.json()['properties']['forecast']

            # Step 2: Get the actual forecast from the URL
            forecast_res = requests.get(forecast_url, headers={"User-Agent": "(my-weather-app, myemail@example.com)"})
            forecast_res.raise_for_status()

            # Get the very first forecast period (the most current one)
            current_forecast = forecast_res.json()['properties']['periods'][0]

            weather_data.append({
                "Title": location['name'],
                "LatitudeLongitude": f"{location['lat']}, {location['lon']}",
                "Name": current_forecast['name'],
                "Temperature": current_forecast['temperature'],
                "TemperatureUnit": current_forecast['temperatureUnit'],
                "ShortForecast": current_forecast['shortForecast'],
                "DateTime": datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            })
        except requests.exceptions.RequestException as e:
            logging.error(f"Could not fetch weather for {location['name']}: {e}")
            # Skip this location and continue with the next
            continue
        except KeyError as e:
            logging.error(f"Unexpected data structure for {location['name']}: {e}")
            continue


    return func.HttpResponse(
        json.dumps(weather_data),
        mimetype="application/json",
        status_code=200
    )
