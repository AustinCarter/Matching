import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import UserLogin from './UserLogin';
import CreateProfile from './CreateProfile';
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

  async componentDidMount() {
    
    if(Object.keys(this.state.socket).length === 0) 
    {
      console.log("init state manager....");
      const soc = io("/");

      this.state.peerConnection = new RTCPeerConnection();

      this.setState({socket: soc});

      this.streamButton = (<Button
              color="primary"
              variant="contained"
              onClick={this.shareScreen()}
            >Share Screen</Button>); //

      console.log(this.state.peerConnection)
      await this.initPeerConnection()

      soc.on('incomingCall', async (data) => {
        console.log(`recieving call ${data.from}`);
        console.log(this.state.peerConnection)
        await this.state.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await this.state.peerConnection.createAnswer();
        await this.state.peerConnection.setLocalDescription(new RTCSessionDescription(answer))
                      .catch((e) => {console.log(e)});
        console.log(answer)

        await soc.emit("answerCall", {
          toCall: data.from,
          answer: answer
        });
      });

      soc.on("callAnswered", async (data) => {
        await this.state.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

      if (!this.state.isAlreadyCalling) {
        this.setState({isAlreadyCalling: true})
        await soc.emit("returnCall", {
          toCall: data.from
        });
      }
      console.log(this.state.peerConnection)
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
      if(this.sharingScreen)
        await this.endScreenShare()({});

      this.setState({isAlreadyCalling: false});
      await this.state.peerConnection.close()
      await this.initPeerConnection()
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
      console.warn("socket already exists for this manager");

  }

  startCall = () => async e => {
    const offer = await this.state.peerConnection.createOffer();
    await this.state.peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    console.log(offer)
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
    this.setState({ [input]: e.target.value });
  };

  endCall = () => async e => {
    if(this.sharingScreen)
      await this.endScreenShare()(e);
    console.log("ending call");
    await this.state.peerConnection.close()
    await this.initPeerConnection()

    this.setState({isAlreadyCalling: false});

    await this.state.socket.emit("endCall", {toCall: this.state.currentMatch.socket});
    this.setState({ page: 2 });
  }  

  nextMatch = () => async e => {
    if(this.sharingScreen)
      await this.endScreenShare()(e);

    console.log("getting next match");

    await this.state.peerConnection.close()
    await this.initPeerConnection()

    this.setState({isAlreadyCalling: false});

    const lastSocket = this.state.currentMatch.socket; 
    const match = await fetch(`/api/match/${this.state.socket.id}`);
    this.state.currentMatch = await match.json();
    if(!match.ok)
    {
      await this.state.socket.emit("endCall", {toCall: lastSocket});
      this.setState({ page: 2 });
      return alert(this.state.currentMatch.msg);
    }
    
    await this.state.socket.emit("nextCall", {
      toCall: this.state.currentMatch.socket,
      toEnd: lastSocket
    });
  }  

  shareScreen = () => async e => {
    const displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
    this.state.peerConnection.getSenders().find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);

    console.log(displayMediaStream)
    this.localVideo.current.srcObject = displayMediaStream;

    this.sharingScreen = true;

     this.streamButton = (<Button
              color="primary"
              variant="contained"
              onClick={this.endScreenShare()}
            >End Screen Share</Button>); //
    this.forceUpdate()
  }

  endScreenShare = () => async e => {
    this.state.peerConnection.getSenders().find(sender => sender.track.kind === 'video')
          .replaceTrack(this.localStream.getTracks().find(track => track.kind === 'video'));

    this.sharingScreen = false;

     this.streamButton = (<Button
              color="primary"
              variant="contained"
              onClick={this.shareScreen()}
            >Share Screen</Button>); //
     this.forceUpdate()
  }

  initPeerConnection = async () => {
    this.state.peerConnection = await new RTCPeerConnection();
    this.state.peerConnection.owner = this;
    this.state.peerConnection.ontrack = function({ streams: [stream] }) { 
          this.remoteStream = stream;
          this.owner.forceUpdate()
      };

      await navigator.mediaDevices.getUserMedia(
        { video: true, audio: true }).then(
        stream => {
          console.log("adding tracks")
          stream.getTracks().forEach(track => this.state.peerConnection.addTrack(track, stream));
          this.localStream = stream;
          console.log(stream.getTracks())
        }).catch(
        error => {
          console.warn(error.message);
        });
  }

  componentDidUpdate() {
    //Refs do not get initialized until they are rendered at least once,
    //componenetDidUpdate will be called after each re render, meaning after switch to in call we will have access to them
    if(this.localVideo.current && !this.sharingScreen) {
        this.localVideo.current.srcObject = this.localStream;
        this.remoteVideo.current.srcObject = this.state.peerConnection.remoteStream;
        console.log(this.localStream);
        console.log(this.state.peerConnection.remoteStream);
      }
   
  }

  render() {
    const { page, socket } = this.state;

    switch (page) {
      case 1:
        return (
          <UserLogin
            setPage={this.setPage}
            handleChange={this.handleChange}
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
            tags={this.state.tags}
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
              {this.streamButton}
            </div>
          );
        case 5: //
          return (
            <CreateProfile
              setPage={this.setPage}
              handleChange={this.handleChange}
              name={this.state.name}
              socket={this.state.socket.id}
              tags={this.state.tags}
            />
          );
      default:
        (console.warn('State not found'))
    }
  }
}

export default SessionManager;