import React, { Component } from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react';

// Actions
import { setCurrentChannel } from '../../actions';

class Channels extends Component {
  state={
    user: this.props.currentUser,
    channels: [],
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref('channels'),
    isModalOpen: false,
    firstLoad: true,
    activeChannel: ''
  }

  componentDidMount() {
    this.addListeners();
  }

  addListeners = () => {
    let loadedChannels = [];
    this.state.channelsRef.on('child_added', snap => {
      loadedChannels.push(snap.val());
      this.setState({channels: loadedChannels}, () => this.setFirstChannel());
    })
  }

  removeListeners = () => { // not listening for events that doesn't take place
    this.state.channelsRef.off();
  }

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) { // on first load and there are at least 1 channel
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel)
    }
    this.setState({ firstLoad: false });
  }

  changeChannel = channel => {
    this.setActiveChannel(channel)
    // add channel data and set it to global state
    this.props.setCurrentChannel(channel);
  }

  setActiveChannel = channel => {
    this.setState({activeChannel: channel.id});
  }

  displayChannels = channels => {
    return channels.length > 0 && channels.map(channel => (
      <Menu.Item 
        key={channel.id}
        onClick={() => this.changeChannel(channel)}
        name={channel.name}
        style={{opacity: 0.7}}
        active={channel.id === this.state.activeChannel}
        >
        # {channel.name}
      </Menu.Item>
    ))
  }

  addChannel = () => {
    const { channelsRef, channelName, channelDetails, user} = this.state;
    const key = channelsRef.push().key; // unique key
    const newChannel = {
      id: key,
      name: channelName,
      details: channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL
      }
    }

    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({ channelName: '', channelDetails: ''});
        this.closeModal();
        console.log('channel added');
      })
      .catch(err => console.error(err))
  }

  handleSubmit = event => {
    event.preventDefault();
    if(this.isFormValid(this.state)) {
      this.addChannel()
    }
  }

  isFormValid = ({ channelName, channelDetails}) => (
    channelName && channelDetails
  )

  openModal = () => this.setState({isModalOpen: true});

  closeModal = () => this.setState({isModalOpen: false});

  handleChange = event => this.setState({
    [event.target.name]: event.target.value
  });


  render() {
    const {channels, isModalOpen} = this.state;
    return (
      <React.Fragment>
      <Menu.Menu style={{ paddingBottom: '2em'}}>
        <Menu.Item>
          <span>
            <Icon name="exchange" /> CHANNELS{" "}
          </span>
          ({channels.length}) <Icon name="add" onClick={this.openModal}/>
        </Menu.Item>
        {/* channels */}
        {this.displayChannels(channels)}
        {/* modal to add channels */}
        <Modal basic open={isModalOpen} onClose={this.closeModal}>
          <Modal.Header>Add Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <Input 
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>

              <Form.Field>
                <Input 
                  fluid
                  label="About the Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Modal.Actions>
                <Button color="green" inverted onClick={this.handleSubmit}>
                  <Icon name="checkmark" /> Add
                </Button>
                <Button color="red" inverted onClick={this.closeModal}>
                  <Icon name="remove" /> Cancel
                </Button>
              </Modal.Actions>
            </Form>
          </Modal.Content>
        </Modal>
      </Menu.Menu>
      </React.Fragment>
    )
  }
}
// This way you have to explicitly set dispatch
// const mapDispatchToProps = dispatch  => {
//   return {
//     setCurrentChannel: () => dispatch(setCurrentChannel)
//   }
// }

export default connect(null, { setCurrentChannel } )(Channels)