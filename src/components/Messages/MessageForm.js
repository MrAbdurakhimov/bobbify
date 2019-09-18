import React, { Component } from 'react'
import firebase from '../../firebase'
import {Segment, Button, Input} from 'semantic-ui-react'

export default class MessageForm extends Component {
  state = {
    message: '',
    loading: false,
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    errors: []
  }

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  createMessage = () => {
    const {user, message} = this.state;
    const newMessage = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      content: message,
      user: {
        id: user.uid,
        name: user.displayName,
        avatar: this.state.user.photoURL
      }
    }
    return newMessage
  }

  sendMessage = () => {
    const { messagesRef } = this.props;
    const { message, channel, errors } = this.state;

    if ( message ) {
      this.setState({ loading: true });
      messagesRef
        .child(channel.id)
        .push() // push onto messagesRef
        .set(this.createMessage())
        .then(() => {
          this.setState({loading: false, message: '', errors: []})
        })
        .catch(err => {
          console.error(err);
          this.setState({
            loading: false,
            errors: errors.concat(err)
          })
        })
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: 'Add a message.'})
      })
    }
  }

  render() {
    const { errors, message, loading } = this.state;

    return (
      <Segment className="message__form">
        <Input 
          fluid
          name="message"
          value={message}
          onChange={this.handleChange}
          style={{marginBottom: '0.7em'}}
          label={<Button icon="add" />}
          labelPosition="left"
          placeholder="Write your message"
          className={
            errors.some(error => error.message.includes('message')) ? 'error': ''
          }
        />
        <Button.Group
          icon
          widths="2"
        >
          <Button 
            color="orange"
            onClick={this.sendMessage}
            content="Add Reply"
            labelPosition="left"
            icon="edit"
            disable={loading}
          />
          <Button 
            color="teal"
            content="Upload Media"
            labelPosition="right"
            icon="cloud upload"
          />
        </Button.Group>
      </Segment>
    )
  }
}
