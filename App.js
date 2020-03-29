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
  Text,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Config from 'react-native-config';
import moment from 'moment';
import MapView, {Polygon, PROVIDER_GOOGLE} from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-community/async-storage';
import {getUniqueId} from 'react-native-device-info';
import {v4 as uuidv4} from 'uuid';

const storeData = async (key, val) => {
  try {
    await AsyncStorage.setItem(key, val);
  } catch (e) {
    console.log(e);
    // saving error
  }
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
      startingLoc: {latitude: 38.627003, longitude: -90.199402},
      userStatus: 'clear',
      activeHotspots: [],
    };
  }

  componentDidMount() {
    this.setInitialMapLocation();
    this.getSetUserIdandStatus().then(() => {
      this.startGeoPolling();
      this.getMyPositionHistory().then(res => this.setState({locations: res}));
    });
    this.getActiveHotspots();
  }

  positiveReportChickenTest = () => {
    Alert.alert(
      'Report a Positive COVID-19 Result?',
      'This will result in the generation of new hotspots and notifications based on your anonymous position history. \n\n Did you in fact receive a Positive result from a COVID-19 Test?',
      [
        {
          text: 'Confirm',
          onPress: () => this.reportPositiveCovidTestResult(),
        },
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
      ],
    );
  };

  negativeReportChickenTest = () => {
    Alert.alert(
      'Revoke your Positive COVID-19 Result?',
      'This will revoke your earlier report of testing positive and may remove hotspots from the system. \n\n Did you in fact receive a Negative result from a COVID-19 Test?',
      [
        {
          text: 'Confirm',
          onPress: () => this.negatePositiveTestResult(),
        },
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
      ],
    );
  };

  reportPositiveCovidTestResult = () => {
    const payload = {
      userId: this.state.userId,
      key: Config.API_KEY,
      timestamp: moment().valueOf(),
    };
    axios.post(Config.API_REPORT_POSITIVE, payload).then(() => {
      this.getActiveHotspots();
      this.setState({userStatus: 'positive'});
      storeData('@HOTSPOT_STATUS', 'positive');
    });
  };

  negatePositiveTestResult = () => {
    const payload = {
      userId: this.state.userId,
      key: Config.API_KEY,
    };
    axios.post(Config.API_REPORT_NEGATIVE, payload).then(() => {
      this.getActiveHotspots();
      this.setState({userStatus: 'clear'});
      storeData('@HOTSPOT_STATUS', 'clear');
    });
  };

  setInitialMapLocation = () => {
    Geolocation.getCurrentPosition(
      res => {
        const crd = res.coords;
        this.setState({
          startingLoc: {latitude: crd.latitude, longitude: crd.longitude},
        });
      },
      () => {
        this.setState({
          startingLoc: {latitude: 38.627003, longitude: -90.199402},
        });
        Alert.alert('Location Error', 'Unable to determine current location');
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 10000},
    );
  };

  getSetUserIdandStatus = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('@HOTSPOT_USERID');
      const storedUserStatus = await AsyncStorage.getItem('@HOTSPOT_STATUS');
      if (storedUserStatus !== null) {
        this.setState({userStatus: storedUserStatus});
      }
      if (storedUserId !== null) {
        return this.setState({userId: storedUserId});
      }
      const userId = uuidv4();
      const deviceId = getUniqueId();
      const payload = {
        userId,
        deviceId,
        key: Config.API_KEY,
      };
      axios.post(Config.API_REGISTER_URL, payload).then(res => {
        if (Object.keys(res.data).length) {
          this.setState({userId: userId});
          storeData('@HOTSPOT_USERID', userId);
          this.reportCurrentPosition();
        }
      });
    } catch (e) {
      // error reading value
    }
  };

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
            h3: position.h3,
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

  getActiveHotspots = () => {
    const payload = {
      key: Config.API_KEY,
    };
    axios.get(Config.API_HOTSPOTS_URL, payload).then(res => {
      const hotspots = res.data.map(spot => {
        return {
          h3: spot.h3,
          coordinates: coordsToMapPolygonFormat(spot.geometry),
          timestamp: spot.timestamp,
        };
      });
      const positionHistoryH3s = this.state.locations.map(loc => loc.h3);
      hotspots.forEach(spot => {
        if (positionHistoryH3s.includes(spot.h3)) {
          this.setState({userStatus: 'exposed'});
          storeData('@HOTSPOT_STATUS', 'exposed');
        }
      });
      this.setState({activeHotspots: hotspots});
    });
  };

  reportCurrentPosition = () => {
    if (this.state.userId) {
      Geolocation.getCurrentPosition(
        position => {
          reportPosition(position, this.state.userId).then(() => {
            this.getMyPositionHistory().then(res => {
              this.getActiveHotspots();
              this.setState({locations: res});
            });
          });
        },
        error => Alert.alert('Error', JSON.stringify(error)),
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
      );
    }
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

  userStatusIcon = () => {
    if (this.state.userStatus === 'clear') {
      return 'check';
    }
    if (this.state.userStatus === 'exposed') {
      return 'warning';
    }
    if (this.state.userStatus === 'positive') {
      return 'exclamation-triangle';
    }
  };

  userStatusColor = () => {
    if (this.state.userStatus === 'clear') {
      return 'green';
    }
    if (this.state.userStatus === 'exposed') {
      return 'orange';
    }
    if (this.state.userStatus === 'positive') {
      return 'red';
    }
  };

  userStatusText = () => {
    if (this.state.userStatus === 'clear') {
      return 'Data does not indicate any exposure.';
    }
    if (this.state.userStatus === 'exposed') {
      return 'Data indicates that you may have been exposed based on your recent activity. Please take extra precautions.';
    }
    if (this.state.userStatus === 'positive') {
      return 'You have anonymously reported that you tested positive for COVID-19. Please take all appropriate precautions to limit exposure to others.';
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={true}
          initialRegion={{
            latitude: this.state.startingLoc.latitude,
            longitude: this.state.startingLoc.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}>
          {this.state.locations.map(loc => {
            return (
              <Polygon
                key={loc.timestamp + this.state.userId}
                coordinates={loc.coordinates}
                tappable={true}
                onPress={() => showDetails(loc.timestamp)}
              />
            );
          })}
          {this.state.activeHotspots.map(loc => {
            return (
              <Polygon coordinates={loc.coordinates} fillColor={'#FF0000'} />
            );
          })}
        </MapView>
        <View style={styles.buttonPanel}>
          {this.state.userStatus === 'positive' ? null : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => this.positiveReportChickenTest()}>
              <Icon name="bullhorn" size={40} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{
              ...styles.statusButton,
              backgroundColor: this.userStatusColor(),
            }}
            onPress={() => showDetails(this.userStatusText())}
            onLongPress={() => this.negativeReportChickenTest()}>
            <Icon name={this.userStatusIcon()} size={40} color="white" />
          </TouchableOpacity>
        </View>
        <View
          style={{
            ...styles.statusBarTop,
            backgroundColor: this.userStatusColor(),
          }}>
          <Text style={{color: 'white'}}>{this.state.userStatus}</Text>
        </View>
        <View
          style={{
            ...styles.statusBarBottom,
            backgroundColor: this.userStatusColor(),
          }}>
          <Text style={{color: 'white'}}>{this.state.userStatus}</Text>
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
    backgroundColor: '#00aadf',
  },
  statusButton: {
    height: 60,
    width: 60,
    margin: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBarTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  statusBarBottom: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
  },
  buttonPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
  },
});

export default App;
