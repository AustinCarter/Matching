import React, { Component } from 'react';
import UserLogin from './UserLogin';
import FindMatch from './FindMatch';
import MatchProfile from './MatchProfile';
import io from "socket.io-client";

const { RTCPeerConnection, RTCSessionDescription } = window;

export class StateManager extends Component {
  state = {
    page: 1, // Ideally this would be an enum, is that supported in JS?
    name: '',
    socket: '',
    currentMatch: {},
    peerConnection: {},
    isAlreadyCalling: false
  };

  startCall = () => async e => {
    const peerConnection = this.state.peerConnection;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    console.log(`calling: ${this.state.currentMatch.socket}`)
    this.state.socket.emit("startCall", { 
      toCall: this.state.currentMatch.socket, 
      offer: offer 
    });
  }

  constructor() {
    super();
    this.localVideo = React.createRef();
    this.remoteVideo = React.createRef();
  }

  componentDidMount() {this.forceUpdate()
    //super();
    // this.remoteVideoStream = new MediaStream();
    if(Object.keys(this.state.socket).length === 0) 
    {
      console.log("init state manager....");
      const soc = io("/");
      const peerConnection = new RTCPeerConnection();
      this.setState({peerConnection: peerConnection});

      this.setState({socket: soc});

      this.remoteVideoTag = (<><h1>remote Video</h1><video ref={this.remoteVideo} autoPlay={true} muted={false}/></>)
        // formating

      peerConnection.ontrack = function({ streams: [stream] }) {
          //this.remoteVideo.current.srcObject = stream;
          this.remoteStream = stream;
          console.log(stream);
          console.log(this);
          //console.log(this.remoteVideoStreams)
      };

      navigator.getUserMedia(
        { video: true, audio: true },
        stream => {
          stream.getTracks().forEach(track => this.state.peerConnection.addTrack(track, stream));
          this.localStream = stream;
        },
        error => {
          console.warn(error.message);
        }
      );

      

       soc.on('connect', () => {
        console.log(soc.id);
      });

      soc.on('incomingCall', async (data) => {
        console.log(`recieving call ${data.from}`);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        soc.emit("answerCall", {
          toCall: data.from,
          answer: answer
        });
      });

      soc.on("callAnswered", async (data) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );

      if (!this.state.isAlreadyCalling) {
        this.setState({isAlreadyCalling: true})
        soc.emit("returnCall", {
          toCall: data.from
        });
      }
      this.setState({ page: 4 });
      console.log("call answered");
     // this.startCall(data.soc)({});
     // 
     // this.startCall(soc.id)({})
    // this.state.isAlreadyCalling = true;
      
    });
    soc.on("callback", async (data) => {
      console.log("callingback")
      this.state.currentMatch = {socket: data.from}
      this.startCall()({})
    })

    }
    else
      console.log("socket already exists for this manager");

  }

  componentDidUpdate() {
    if(this.localVideo.current) {
        this.localVideo.current.srcObject = this.localStream;
        this.remoteVideo.current.srcObject = this.state.peerConnection.remoteStream;
        console.log(this.localStream);
        console.log(this.state.peerConnection.remoteStream);
      }
   
  }

  /*callUser = async (socketId) => {
      const offer = await this.state.peerConnection.createOffer();
      await this.state.peerConnection.setLocalDescription(new RTCSessionDescription(offer));

      socket.emit("call-user", {
        offer,
        to: socketId
      });
    }*/


  setUserActive = async () => {
    console.log("Adding user to users list");
    const rawResponse = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: this.state.name, socket: this.state.socket.id })
    });
    const content = await rawResponse.json();

    console.log(content);
  }

  setPage = n => e => {
    e.preventDefault();
    this.setState({ page: n });
  };

  handleChange = input => e => {
    this.setState({ [input]: e.target.value });
  };

  

  render() {
    const { page, socket } = this.state;
    
    if(this.remoteVideo.current)
    {
      this.remoteVideo.current.srcObject = this.remoteVideoSrc
    }

    switch (page) {
      case 1:
        return (
          <UserLogin
            setPage={this.setPage}
            handleChange={this.handleChange}
            setUserActive={this.setUserActive}
          />
        );
      case 2:
        return (
          <FindMatch
            setPage={this.setPage}
            handleChange={this.handleChange}
            socket={socket}
          />
        );
      case 3:
        return (
          <MatchProfile
            setPage={this.setPage}
            startCall={this.startCall}
            match={this.state.currentMatch}
          />
          );
      case 4:
        return (
            <div>
              <h2>In A Call</h2>
              <video ref={this.localVideo} autoPlay={true} muted={true}>
              </video>
              <video ref={this.remoteVideo} autoPlay={true} muted={false}>
              </video>
            </div>
          );
      default:
        (console.log('State not found'))
    }
  }
}

export default StateManager;