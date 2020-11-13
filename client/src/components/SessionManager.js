import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import UserLogin from './UserLogin';
import FindMatch from './FindMatch';
import MatchProfile from './MatchProfile';
import io from "socket.io-client";

const { RTCPeerConnection, RTCSessionDescription } = window;


export class SessionManager extends Component {
  state = {
    page: 1, // Ideally this would be an enum, is that supported in JS?
    name: '',
    tags: [],
    socket: '',
    currentMatch: {},
    peerConnection: {},
    isAlreadyCalling: false
  };

  constructor() {
    super();
    this.localVideo = React.createRef();
    this.remoteVideo = React.createRef();
  }

  componentDidMount() {
    
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
          this.remoteStream = stream;
          console.log(stream);
          console.log(this);
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

    });

    soc.on("callback", async (data) => {
      console.log("callingback")
      this.state.currentMatch = {
        socket: data.from,
        tags: [] 
      }
      this.startCall()({})
    })

    soc.on("callEnded", async (data) => {
      this.setState({ page: 2 })
    })

    soc.on("goNext", async (data) => {
      this.state.currentMatch = {
        socket: data.toCall,
        tags: []
      }
      this.startCall()({})
    })

    }
    else
      console.log("socket already exists for this manager");

  }

  componentDidUpdate() {
    //Refs do not get initialized until they are rendered at least once,
    //componenetDidUpdate will be called after each re render, meaning after switch to in call we will have access to them
    if(this.localVideo.current) {
        this.localVideo.current.srcObject = this.localStream;
        this.remoteVideo.current.srcObject = this.state.peerConnection.remoteStream;
        console.log(this.localStream);
        console.log(this.state.peerConnection.remoteStream);
      }
   
  }

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

  setPage = n => e => {
    e.preventDefault();
    this.setState({ page: n });
  };

  handleChange = input => e => {
    console.log(e.target.value)
    this.setState({ [input]: e.target.value });
  };

  endCall = () => e => {
    console.log("ending call");
    this.state.isAlreadyCalling = false;
    this.state.socket.emit("endCall", {toCall: this.state.currentMatch.socket});
    this.setState({ page: 2 });
  }  

  nextMatch = () => async e => {
    console.log("getting next match");
    this.state.isAlreadyCalling = false;
    const lastSocket = this.state.currentMatch.socket; 
    const match = await fetch(`/api/match/${this.state.socket.id}`);
    this.state.currentMatch = await match.json();
    
    await this.state.socket.emit("nextCall", {
      toCall: this.state.currentMatch.socket,
      toEnd: lastSocket
    });
  }  

  render() {
    const { page, socket } = this.state;

    switch (page) {
      case 1:
        return (
          <UserLogin
            setPage={this.setPage}
            handleChange={this.handleChange}
            setUserActive={this.setUserActive}
            name={this.state.name}
            socket={this.state.socket.id}
            tags={this.state.tags}
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
            tags={this.state.tags}
          />
          );
      case 4: // In-call state
        return (
            <div>
              <video playsInline ref={this.localVideo} autoPlay={true} muted={true} width="50%"/>
              <video playsInline ref={this.remoteVideo} autoPlay={true} muted={true} width="50%" />
              <br/>
              <Button
              color="secondary"
              variant="contained"
              onClick={this.endCall()}
            >End Call</Button>
              <Button
              color="primary"
              variant="contained"
              onClick={this.nextMatch()}
            >Next Match</Button>
            </div>
          );
      default:
        (console.log('State not found'))
    }
  }
}

export default SessionManager;