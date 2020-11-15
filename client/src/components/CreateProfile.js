import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

export class CreateProfile extends Component {

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

  genTags = e => {
    console.log(e)
    if(e.keyCode === 13 || e.type === "blur")
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
            <h2> Tell us About Yourself!</h2>
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
              onBlur={this.genTags}
              defaultValue=''
              margin="normal"
            />
            <br />
            <div>
              <Button
                color="primary"
                variant="contained"
                onClick={this.createUser(2)}
              >Confirm</Button>
            </div>
        </>
      </MuiThemeProvider>
    );
  }
}

export default CreateProfile;