import _ from 'lodash/fp'
import React, { Component } from 'react'
import 'semantic-ui-css/semantic.css'
import {
  Button,
  Grid,
  Header,
  Icon,
  Label,
  List,
  Menu,
} from 'semantic-ui-react'

import { request } from './utils'

const onLocationChange = cb => {
  const watchId = navigator.geolocation.watchPosition(
    location => {
      console.log('onLocationChange success', location)
      cb(null, location)
    },
    error => {
      console.log('onLocationChange error', error)
      cb(error, null)
    },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}

const getAddresses = (lat, lng) => {
  const apiKey = 'AIzaSyDt7zymVF3z4qUgsIoeXW6VZ94oNQzMqTE'
  const url = 'https://maps.googleapis.com/maps/api/geocode/json'
  const params = {
    result_type: 'street_address',
    latlng: `${lat},${lng}`,
    key: apiKey,
  }

  return request(url, params).then(res => {
    console.log('getAddresses success', res)

    return _.map(_.get('address_components'), res.results).reduce(
      (acc, addressComponents) => {
        console.log('reduce', { acc, addressComponents })
        let streetNumbers
        let route
        let city
        let state
        let zip

        addressComponents.forEach(addressComponent => {
          const type = _.get('types[0]', addressComponent)
          console.log('each', type, addressComponent)
          switch (type) {
            case 'street_number':
              streetNumbers = _.flow(_.split('-'), ([lower, upper]) =>
                _.range(lower, +upper + 1),
              )(addressComponent.long_name)
              break

            case 'route':
              route = addressComponent.short_name
              break

            case 'locality':
              city = addressComponent.long_name
              break

            case 'administrative_area_level_1':
              state = addressComponent.short_name
              break

            case 'postal_code':
              zip = addressComponent.short_name
              break

            default:
              break
          }
        })

        const results = streetNumbers.map(streetNumber => ({
          streetNumber,
          route,
          city,
          state,
          zip,
        }))

        console.log(results)

        return [...acc, ...results]
      },
      [],
    )
  })
}

export const getPropertyInfo = propertyId => {
  const params = { client_id: 'rdc_mobile_native,8.3.3,android' }

  return request(
    `https://mapi-ng.rdc.moveaws.com/api/v1/properties/${propertyId}`,
    params,
  ).then(json => {
    const property = json.properties[0]
    // console.debug('REI: got property info', property)
    return property
  })
}

const STATUS = {
  READY: 'READY',
  LOADING: 'LOADING',
  ERROR: 'ERROR',
}

const STATUS_COLORS = {
  [STATUS.READY]: 'green',
  [STATUS.LOADING]: 'orange',
  [STATUS.ERROR]: 'red',
}

class App extends Component {
  state = {
    status: STATUS.LOADING,
  }

  componentDidMount() {
    this.clearLocationWatcher = onLocationChange(this.refreshAddresses)
  }

  componentWillUnmount() {
    this.clearLocationWatcher()
  }

  refreshAddresses = (error, newLocation) => {
    if (error) {
      this.setState({
        addresses: null,
        error,
        location: newLocation,
        status: STATUS.ERROR,
      })
      return
    }

    this.setState({ status: STATUS.LOADING })

    const { coords } = newLocation

    getAddresses(coords.latitude, coords.longitude)
      .then(results => {
        this.setState({ addresses: results })
      })
      .then(() => {
        this.setState({ status: STATUS.READY })
      })
      .catch(error => {
        this.setState({ error, status: STATUS.ERROR })
      })
  }

  handleAddressClick = address => () => {
    this.setState({ selectedAddress: address })
  }

  render() {
    const { addresses, selectedAddress, status } = this.state

    return (
      <Grid padded stackable columns="equal">
        <Grid.Column width={4}>
          <Label
            basic
            horizontal
            color={STATUS_COLORS[status]}
            content="Status"
            detail={status}
            icon={{
              loading: status === STATUS.LOADING,
              name: 'location arrow',
            }}
          />
          <Menu vertical fluid pointing>
            <Menu.Item header color="blue">
              Addresses
              <Label>{_.get('length', addresses) || 0} nearby</Label>
            </Menu.Item>
            {_.flow(
              _.groupBy('route'),
              _.map(addressesByRoute => {
                const firstRoute = _.get('route', _.first(addressesByRoute))
                return (
                  <Menu.Item
                    key={firstRoute}
                    active={firstRoute === _.get('route', selectedAddress)}
                  >
                    <Menu.Header>
                      <Icon name="road" /> {firstRoute}
                    </Menu.Header>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {_.map(
                        address => (
                          <div
                            key={address.streetNumber}
                            style={{
                              flex: '0 0 50%',
                              padding: '0 0.5em 0.5em 0',
                            }}
                          >
                            <Button
                              basic
                              compact
                              fluid
                              toggle
                              size="tiny"
                              active={address === selectedAddress}
                              onClick={this.handleAddressClick(address)}
                              content={address.streetNumber}
                            />
                          </div>
                        ),
                        addressesByRoute,
                      )}
                    </div>
                  </Menu.Item>
                )
              }),
            )(addresses)}
          </Menu>
        </Grid.Column>
        <Grid.Column>
          <pre>
            <code>{JSON.stringify(this.state, null, 2)}</code>
          </pre>
        </Grid.Column>
      </Grid>
    )
  }
}

export default App
