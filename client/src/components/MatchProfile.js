import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

export class MatchProfile extends Component {

  render() {
    const { values, startCall, setPage } = this.props;
    return (
      <MuiThemeProvider>
        <>
            <h2> { this.props.match.name } </h2>
            <br />
            <Button
              color="primary"
              variant="contained"
              onClick={startCall()}
            >Start Call</Button>
        </>
      </MuiThemeProvider>
    );
  }
}

export default MatchProfile;