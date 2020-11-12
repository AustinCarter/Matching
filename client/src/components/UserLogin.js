import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

export class UserLogin extends Component {

  constructor(){
    super()
    this.tags = []
  }

  login = page => e => {
    e.preventDefault();
    this.props.setUserActive();
    this.props.setPage(page)(e);
  };

  genTags = e => {
    if(e.keyCode === 13)
    {
      e.preventDefault();
      this.tags = e.target.value.split(',');
      console.log(this.tags)
      e.target.value = this.tags;
      this.props.handleChange('tags')(e);
    }
  }

  render() {
    const { handleChange } = this.props;
    return (
      <MuiThemeProvider>
        <>
            <h2> Welcome to TimeFace!</h2>
            <TextField
              placeholder="Enter Your Name"
              label="Name"
              onChange={handleChange('name')}
              defaultValue=''
              margin="normal"
            />
            <br /> 
            <div>
            { this.tags.map((tag) => {
              return (
                <Chip label={tag} />
                )})
            }
            </div>
            <br />
            <TextField
              placeholder="What are your interests?"
              label="Interests"
              onKeyDown={this.genTags}
              defaultValue='Skiing, Baking, Climbing'
              margin="normal"
            />
            <br />
            <Button
              color="primary"
              variant="contained"
              onClick={this.login(2)}
            >Login</Button>
        </>
      </MuiThemeProvider>
    );
  }
}

export default UserLogin;