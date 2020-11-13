import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

export class FindMatch extends Component {

  getMatch = (page, socket) => async e => {
    e.preventDefault();
    const match = await fetch(`/api/match/${socket.id}`);
    if(match.ok)
    {
      const matchJson = await match.json();
      e.target = {value: matchJson}; // prevents value from being cast to a string 
      this.props.handleChange('currentMatch')(e);
      this.props.setPage(page)(e); 
    }
    else
      throw new Error(`HTTP error: ${match.status}`);
  };

  render() {
    const { values, handleChange, setPage, socket } = this.props;
    return (
      <MuiThemeProvider>
        <>
          <Dialog
            open
            fullWidth
            maxWidth='sm'
          >
            <Button
              color="primary"
              variant="contained"
              onClick={this.getMatch(3, socket)}
            >Find Match</Button>
          </Dialog>
        </>
      </MuiThemeProvider>
    );
  }
}

export default FindMatch;