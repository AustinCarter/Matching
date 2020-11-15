import React, { Component } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';

export class FindMatch extends Component {

  getMatch = (page, socket) => async e => {
    e.preventDefault();
    const match = await fetch(`/api/match/${socket.id}`);
    const matchJson = await match.json();
    if(match.ok)
    {
      e.target = {value: matchJson}; // prevents value from being cast to a string 
      this.props.handleChange('currentMatch')(e);
      this.props.setPage(page)(e); 
    }
    else
      alert(matchJson.msg);
  };

  render() {
    const { socket, tags } = this.props;
    return (
      <MuiThemeProvider>
        <>
          <h1>My Interests</h1>
          <div>
             { tags.map((tag) => {
              return (
                <Chip label={tag} />
                )})
            }
          </div>
          <br/>
          <Button
            color="primary"
            variant="contained"
            onClick={this.getMatch(3, socket)}
          >Find Match</Button>
        </>
      </MuiThemeProvider>
    );
  }
}

export default FindMatch;