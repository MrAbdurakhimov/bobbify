import React from 'react';
import { Grid } from 'semantic-ui-react';
import { connect } from 'react-redux';
import './App.css';
import ColorPanel from './ColorPanel';
import SidePanel from './SidePanel';
import Messages from './Messages';
import MetaPanel from './MetaPanel';

// eslint-disable
const App = ({ currentUser, currentChannel }) => (
  <Grid columns="equal" className="app" style={{background: "#eee"}}>
    <ColorPanel />
    <SidePanel
      currentUser={currentUser}
      currentUser={currentUser && currentUser.uid}
    />
    <Grid.Column style={{ marginLeft: 320 }}>
      <Messages
        key={currentChannel && currentChannel.id}
        currentChannel={currentChannel}
        currentUser={currentUser}
      />
    </Grid.Column>
    <Grid.Column width={4}>
      <MetaPanel />
    </Grid.Column>
  </Grid>
);

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel
});

export default connect(mapStateToProps)(App);
