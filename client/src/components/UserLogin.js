import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

export class UserLogin extends Component {

  login = page => async e => {
    if(!(e.type == 'click'))
      await this.props.handleChange('name')(e);

    if(e.keyCode === 13 || e.type == 'click')
    {
      e.preventDefault();
      const rawResponse = await fetch(`/api/login/${this.props.name}/${this.props.socket}`);
      const user = await rawResponse.json()
      console.log(user)
      if(!rawResponse.ok)
        return alert(user.msg)

      e.target = { value: user.tags }
      this.props.handleChange('tags')(e);
      this.props.setPage(page)(e);
    }
  };

  render() {
    const { handleChange, setPage } = this.props;
    return (
      <MuiThemeProvider>
        <>
            <h2> Welcome to TimeFace!</h2>
            <TextField
              placeholder="Enter Your Name"
              label="Name"
              onKeyDown={this.login(2)}
              onBlur={handleChange('name')}
              defaultValue=''
              margin="normal"
            />
            <br /> 
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
                onClick={setPage(5)}
              >Create Account</Button>
            </div>
        </>
      </MuiThemeProvider>
    );
  }
}

export default UserLogin;