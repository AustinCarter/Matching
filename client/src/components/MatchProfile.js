import React, { Component } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';

const murmur = require('murmurhash-js');
const HASHSEED = 0x32F1A902;

export class MatchProfile extends Component {

  render() {
    const { values, startCall, setPage, match, tags } = this.props;
    match.tags = match.tags ? match.tags : []
    console.log(tags)
    console.log(match)
    return (
      <MuiThemeProvider>
        <>
            <h2> { match.name } </h2>
            <br />
            <h4>Common Interests: </h4>
            <div>
             { tags.map((tag) => {
              if(match.tags.includes(murmur.murmur3(tag, HASHSEED)))
              return (
                <Chip label={tag} />
                )})
            }
            </div>
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