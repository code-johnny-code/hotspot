![HotSpot](https://repository-images.githubusercontent.com/250440145/0c952c80-7032-11ea-9f19-8a45a66b9cdf)
Created for the Devpost COVID-19 Global Hackathon 1.0

# HotSpot React Native App

A React Native App designed to be used with the [HotSpot API](https://github.com/code-johnny-code/hotspot-api) and a MongoDB instance (I used mLab.com).

### .env file
You'll need to set up a `.env` file in your project's root directory with the following keys and values:  

```
DB_URL=(the URL of your MongoDB instance, such as mongodb://ds#####.mlab.com:#####/hotspot)
DB_NAME=(MongoDB database name)
DB_USER=(MongoDB user name)
DB_PW=(MongoDB password)
PORT=(whichever port you want the service to run on)

API_KEY=(whatever you want to use as your API key when communicating with the HotSpot API)
API_REGISTER_URL=(URL for the HotSpot API /registerNewUser endpoint)
API_POSITION_URL=(URL for the HotSpot API /logPosition endpoint)
API_USER_POSITIONS=(URL for the HotSpot API /userLocations endpoint)
API_REPORT_POSITIVE=(URL for the HotSpot API /reportPositive endpoint)
API_REPORT_NEGATIVE=(URL for the HotSpot API /reportNegative endpoint)
API_HOTSPOTS_URL=(URL for the HotSpot API /hotspots endpoint)
GOOGLE_API_KEY=(Maps SDK for Android API Key)
```
