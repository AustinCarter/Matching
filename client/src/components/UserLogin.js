import React, { Component } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

export class UserLogin extends Component {

  login = page => e => {
    e.preventDefault();
    this.props.setUserActive();
    this.props.setPage(page)(e);
  };

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