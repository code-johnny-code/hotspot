/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Config from 'react-native-config';
import moment from 'moment';
import MapView, {Polygon, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';

const positiveReportChickenTest = userId => {
  Alert.alert(
    'Report a Positive COVID-19 Result?',
    'This will result in the generation of new hotspots and notifications based on your anonymous position history. \n\n Did you in fact receive a Positive result from a COVID-19 Test?',
    [
      {
        text: 'Confirm',
        onPress: () => reportPositiveCovidTestResult(userId),
      },
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
    ],
  );
};

const reportPosition = (position, userId) => {
  const payload = position.coords;
  payload.key = Config.API_KEY;
  payload.userId = userId;
  payload.timestamp = moment().valueOf();
  return axios
    .post(Config.API_POSITION_URL, payload)
    .then(function(response) {
      return response;
    })
    .catch(error => {
      if (error.response) {
        return error.response;
      }
    });
};

const coordsToMapPolygonFormat = coords => {
  return coords.map(coordPair => {
    return {
      latitude: coordPair[1],
      longitude: coordPair[0],
    };
  });
};

const reportPositiveCovidTestResult = userId => {
  console.log(`USER ${userId} REPORTED A POSITIVE COVID-19 TEST RESULT`);
};

const showDetails = message => {
  ToastAndroid.show(message, ToastAndroid.LONG);
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      userId: '54231ae2-2f41-4fbc-bf19-849b3e355baf',
      intervalId: null,
      locations: [],
    };
  }

  componentDidMount() {
    this.startGeoPolling();
    this.getMyPositionHistory().then(res => this.setState({locations: res}));
  }

  getMyPositionHistory = () => {
    const payload = {
      userId: this.state.userId,
      key: Config.API_KEY,
    };
    return axios
      .post(Config.API_USER_POSITIONS, payload)
      .then(function(response) {
        return response.data.map(position => {
          return {
            coordinates: coordsToMapPolygonFormat(position.h3_geom),
            timestamp: moment(position.timestamp).format(
              'dddd, MMMM Do YYYY, h:mm:ss a',
            ),
          };
        });
      })
      .catch(error => {
        if (error.response) {
          return error.response;
        }
      });
  };

  reportCurrentPosition = () => {
    Geolocation.getCurrentPosition(
      position => {
        reportPosition(position, this.state.userId);
      },
      error => Alert.alert('Error', JSON.stringify(error)),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  startGeoPolling = () => {
    if (!this.state.intervalId) {
      this.reportCurrentPosition();
      const geoInterval = setInterval(
        () => this.reportCurrentPosition(),
        900000,
      );
      this.setState({intervalId: geoInterval});
    } else {
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          showsMyLocationButton={true}>
          {this.state.locations.map(loc => {
            return (
              <Polygon
                coordinates={loc.coordinates}
                tappable={true}
                onPress={() => showDetails(loc.timestamp)}
              />
            );
          })}
        </MapView>
        <View style={styles.buttonPanel}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => positiveReportChickenTest(this.state.userId)}>
            <Icon name="bullhorn" size={40} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => null}>
            <Icon name="history" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    height: 60,
    width: 60,
    margin: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'purple',
    backgroundColor: '#00aadf',
  },
  buttonPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
  },
});

export default App;
