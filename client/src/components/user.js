// import './App.css';
import React, { Component } from 'react';

class User extends Component {
   constructor(){
    super();
    this.state = {
        Users: []
    }
  }

  componentDidMount() {
    fetch('/api/users')
      .then(res => res.json())
      .then(Users => this.setState({Users}, () => console.log('Fetching users... ', Users)));
  }

  render() {
    return (
      <div>
        <h2>User</h2>
      </div>
    );
  }
}

export default User;
