import React from 'react';
import {
  Button,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop: Constants.statusBarHeight + 10,
    backgroundColor: '#ecf0f1',
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 2,
    borderWidth: 0,
    borderBottomWidth: 1
  },
  adj: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  adjText: {
    fontSize: 14,
    height: 40,
    marginHorizontal: 0,
    textAlignVertical: 'center', // only works on Android
    ...Platform.select({
        ios: {
            lineHeight: 40 // as same as height
        },
        android: {}
    })
  },
  heading: {
    fontSize: 50,
    textAlign: 'center',
    color: '#014d4e'
  },
  switch: {
    marginRight: 5
  },
  item: {
    backgroundColor: '#cce6e6',
    padding: 10,
    margin: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 14,
    height: 40,
    marginHorizontal: 0,
    textAlignVertical: 'center', // only works on Android
    ...Platform.select({
        ios: {
            lineHeight: 40 // as same as height
        },
        android: {}
    })
  },
  itemBtn: {
    fontSize: 6
  }
});

const Item = ({ title, location }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
    <Button style={styles.itemBtn} title="Get Directions" onPress={() => {
      console.log(location);
      const daddr = location.join(',');
      const company = Platform.OS === "ios" ? "apple" : "google";
      Linking.openURL(`http://maps.${company}.com/maps?daddr=${daddr}`);
    }} />
  </View>
);

const BasicScreen = () => {
  const [address, setAddr] = React.useState(null);
  const [dist, setDist] = React.useState(null);
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [apiKey, setApiKey] = React.useState(null);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const renderItem = ({ item }) => (
    <Item title={item.title} location={item.location} />
  );
  React.useEffect(() => {
    async function fn() {
    setApiKey(await getApiKey());
    }
    fn();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>
        VicValet
      </Text>
      <GooglePlacesAutocomplete
        placeholder="Enter destination address"
        query={{
          key: apiKey,
          language: 'en',
          components: 'country:au',
        }}
        onPress={(data, details = null) => {
        setAddr(data.description)
      }}
      />
      <View style= {{ paddingTop: 40 }} />
      <View style={styles.adj}>
        <Text style={styles.adjText}>
          Only show me parking bays within
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={setDist}
          value={dist}
          placeholder="500"
          keyboardType="numeric"
        />
        <Text style={styles.adjText}>
          meters from my destination.
        </Text>
      </View>
      <View style={styles.adj}>
        <Switch
          style={styles.switch}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
        <Text style={styles.adjText}>
          Show occupied bays
        </Text>
      </View>
      <Button
        title = "Search"
        onPress={async () => {
          let newResults = await getResults(address, dist, !isEnabled);
          setResults(newResults);
        }}
      />
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

async function getResults(address, dist, hideOccupied) {
  try {
    let response = await fetch('https://vicvalet-bed.herokuapp.com/getBays', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        dist,
        hideOccupied
      }),
    });
    let responseJson = await response.json();
    return responseJson.records.map(record => ({
      id: record.fields.bay_id,
      title: (Math.round((Number(record.fields.dist) + Number.EPSILON) * 100) / 100).toString() + "m away",
      location: record.fields.location
    }));
  } catch (error) {
    console.error(error);
  }
}

async function getApiKey() {
  try {
    let response = await fetch('https://vicvalet-bed.herokuapp.com/getApiKey', {
      method: 'GET'
    });
    let responseJson = await response.json();
    return responseJson.key;
  } catch (error) {
    console.error(error);
  }
}

export default BasicScreen;