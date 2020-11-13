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

  createUser = page => async e => {
    e.preventDefault();

    console.log("Adding user to users list");
    const rawResponse = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: this.props.name, socket: this.props.socket, tags: this.props.tags })
    });
    const content = await rawResponse.json();
    console.log(content);
    if(!rawResponse.ok)
      alert(content.msg);
    else
      this.props.setPage(page)(e);
  };

  login = page => async e => {
    e.preventDefault();
    const rawResponse = await fetch(`/api/login/${this.props.name}/${this.props.socket}`);
    const user = await rawResponse.json()
    console.log(user)
    if(!rawResponse.ok)
      return alert(user.msg)

    e.target = { value: user.tags }
    this.props.handleChange('tags')(e);
    this.props.setPage(page)(e);
  };

  genTags = e => {
    if(e.keyCode === 13)
    {
      e.preventDefault();
      // tags will be hashed. when hashing want to change all letters to lowercase 
      // and remove extra spacing at ends so that we can get more consistant results
      this.tags = e.target.value.split(',')
        .map((tag) => {return tag.toLowerCase().trim()});

      e.target = { value: this.tags }
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
              placeholder="eg. skiing, baking, cooking"
              label="Interests"
              onKeyDown={this.genTags}
              defaultValue=''
              margin="normal"
            />
            <br />
            <div>
              <Button
                color="primary"
                variant="contained"
                onClick={this.login(2)}
              >Login</Button>
              <br/>
              <Button
                color="primary"
                variant="contained"
                onClick={this.createUser(2)}
              >Create Account</Button>
            </div>
        </>
      </MuiThemeProvider>
    );
  }
}

export default UserLogin;