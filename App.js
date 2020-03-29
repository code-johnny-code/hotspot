/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Config from 'react-native-config';
import moment from 'moment';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
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

const reportPositiveCovidTestResult = userId => {
  console.log(`USER ${userId} REPORTED A POSITIVE COVID-19 TEST RESULT`);
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      userId: '54231ae2-2f41-4fbc-bf19-849b3e355baf',
      intervalId: null,
    };
  }

  componentDidMount() {
    this.startGeoPolling();
    this.getMyPositionHistory();
  }

  getMyPositionHistory = userId => {
    const payload = {
      userId: userId,
      key: Config.API_KEY,
    };
    return axios
      .post(Config.API_USER_POSITIONS, payload)
      .then(function(response) {
        console.log(response);
        return response;
      })
      .catch(error => {
        if (error.response) {
          return error.response;
        }
      });
  };

  startGeoPolling = () => {
    if (!this.state.intervalId) {
      const geoInterval = setInterval(
        () =>
          Geolocation.getCurrentPosition(
            position => {
              reportPosition(position, this.state.userId);
            },
            error => Alert.alert('Error', JSON.stringify(error)),
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
          ),
        5000,
      );
      this.setState({intervalId: geoInterval});
    } else {
      console.log(`GeoPolling already active: ${this.state.intervalId}`);
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          region={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}
        />
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
