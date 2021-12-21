// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
var mapPeers = {};

// peers that stream own screen
// to remote peers
var mapScreenPeers = {};

// true if screen is being shared
// false otherwise
var screenShared = false;

const localVideo = document.querySelector('#local-video');
var mainScreenBox = document.querySelector("#main-screen-box");
// button to start or stop screen sharing
var btnShareScreen = document.querySelector('#btn-share-screen');

// local video stream
var localStream = new MediaStream();

// local screen stream
// for screen sharing
var localDisplayStream = new MediaStream();

// buttons to toggle self audio and video
btnToggleAudio = document.querySelector("#btn-toggle-audio");
btnToggleVideo = document.querySelector("#btn-toggle-video");

var messageInput = document.querySelector('#msg');
var btnSendMsg = document.querySelector('#btn-send-msg');
var chatContent = document.querySelector('#chat-content')
// button to start or stop screen recording
var btnRecordScreen = document.querySelector('#btn-record-screen');
// object that will start or stop screen recording
var recorder;
// true of currently recording, false otherwise
var recording = false;

var file;
var aaaa;
var numbTurnCredential = '{{numb_turn_credential}}';
var numbTurnUsername = '{{numb_turn_username}}';
var numbTurnUrl = '{{numb_turn_url}}';

var loc = window.location;
var endPoint = '';
var wsStart = 'ws://';

if (loc.protocol == 'https:') {
    wsStart = 'wss://';
}
var endPoint = wsStart + loc.host + loc.pathname;

var webSocket;
// set username
// join room (initiate websocket connection)
// upon button click
function youtor() {
    if (host == false) {
        document.getElementById("host-screen-box").style.display = "None";
    }
    if (username == '') {
        // ignore if username is empty
        return;
    }
    webSocket = new WebSocket(endPoint);
    webSocket.onopen = function (e) {
        // console.log('Connection opened! ', e);

        // notify other peers
        sendSignal('new-peer', {
            'local_screen_sharing': false,
        });
    }

    webSocket.onmessage = webSocketOnMessage;

    webSocket.onclose = function (e) {
        // console.log('Connection closed! ', e);
    }

    webSocket.onerror = function (e) {
        console.log('Error occured! ', e);
    }

    btnSendMsg.disabled = false;
    messageInput.disabled = false;
}

function webSocketOnMessage(event) {
    var parsedData = JSON.parse(event.data);

    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    // console.log('peerUsername: ', peerUsername);
    if (peerUsername == username) {
        // ignore all messages from oneself
        return;
    }
    // boolean value specified by other peer
    // indicates whether the other peer is sharing screen
    var remoteScreenSharing = parsedData['message']['local_screen_sharing'];
    // console.log('remoteScreenSharing: ', remoteScreenSharing);

    // channel name of the sender of this message
    // used to send messages back to that sender
    // hence, receiver_channel_name
    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    // console.log('receiver_channel_name: ', receiver_channel_name);

    // in case of new peer
    if (action == 'new-peer') {
        // console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createOfferer(peerUsername, false, remoteScreenSharing, receiver_channel_name);

        if (screenShared && !remoteScreenSharing) {
            // if local screen is being shared
            // and remote peer is not sharing screen
            // send offer from screen sharing peer
            // console.log('Creating screen sharing offer.');
            createOfferer(peerUsername, true, remoteScreenSharing, receiver_channel_name);
        }

        return;
    }

    // remote_screen_sharing from the remote peer
    // will be local screen sharing info for this peer
    var localScreenSharing = parsedData['message']['remote_screen_sharing'];

    if (action == 'new-offer') {
        // console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        // set offer as remote description
        var offer = parsedData['message']['sdp'];
        // console.log('Offer: ', offer);
        var peer = createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name);

        return;
    }


    if (action == 'new-answer') {
        // in case of answer to previous offer
        // get the corresponding RTCPeerConnection
        var peer = null;

        if (remoteScreenSharing) {
            // if answerer is screen sharer
            peer = mapPeers[peerUsername + ' Screen'][0];
        } else if (localScreenSharing) {
            // if offerer was screen sharer
            peer = mapScreenPeers[peerUsername][0];
        } else {
            // if both are non-screen sharers
            peer = mapPeers[peerUsername][0];
        }

        // get the answer
        var answer = parsedData['message']['sdp'];

        // console.log('mapPeers:');
        for (key in mapPeers) {
            // console.log(key, ': ', mapPeers[key]);
        }

        // console.log('peer: ', peer);
        // console.log('answer: ', answer);

        // set remote description of the RTCPeerConnection
        peer.setRemoteDescription(answer);

        return;
    }
}

messageInput.addEventListener('keyup', function (event) {
    if (event.keyCode == 13) {
        // prevent from putting 'Enter' as input
        event.preventDefault();

        // click send message button
        btnSendMsg.click();
    }
});

btnSendMsg.onclick = btnSendMsgOnClick;

function btnSendMsgOnClick() {
    var message = messageInput.value;
    if (message != '') {
        var selfMsgDiv = document.createElement("div");
        var selfSubMsgDiv = document.createElement("div");
        var selfSubMsgParagraph = document.createElement("p");

        chatContent.appendChild(selfMsgDiv);
        selfMsgDiv.appendChild(selfSubMsgDiv);
        selfSubMsgDiv.appendChild(selfSubMsgParagraph);

        selfMsgDiv.classList.add("media", "media-chat", "media-chat-reverse");
        selfSubMsgDiv.classList.add("media-body");
        selfSubMsgParagraph.innerHTML = "Me: " + message;

        var dataChannels = getDataChannels();
        // console.log('Sending: ', message);
        // send to all data channels
        for (index in dataChannels) {
            dataChannels[index].send(full_name + ': ' + message);
        }

        messageInput.value = '';
    }

}

const constraints = {
    'video': true,
    'audio': true
}


const iceConfiguration = {
    iceServers: [{ urls: ['stun:stun.call.addzetstun.xyz'] },
    {
        urls: ['turn:turn.call.addzetstun.xyz'],
        credential: "The Dead Man",
        username: "Addzet"
    },

    ]
};

userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        var mediaTracks = stream.getTracks();
        aaa = mediaTracks;
        for (i = 0; i < mediaTracks.length; i++) {
            // console.log(mediaTracks[i]);
        }

        localVideo.srcObject = localStream;
        localVideo.muted = true;

        window.stream = stream; // make variable available to browser console

        audioTracks = stream.getAudioTracks();
        videoTracks = stream.getVideoTracks();
        // unmute audio and video by default
        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;
        btnToggleAudio.onclick = function () {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if (audioTracks[0].enabled) {
                document.getElementById("audio-mute").style.display = "block";
                document.getElementById("audio-unmute").style.display = "none";
                return;
            }
            document.getElementById("audio-mute").style.display = "none";
            document.getElementById("audio-unmute").style.display = "block";
        };

        btnToggleVideo.onclick = function () {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            if (videoTracks[0].enabled) {
                document.getElementById("video-mute").style.display = "block";
                document.getElementById("video-unmute").style.display = "none";
                return;
            }
            document.getElementById("video-mute").style.display = "none";
            document.getElementById("video-unmute").style.display = "block";

        };
    })
    .then(e => {
        btnShareScreen.onclick = event => {
            if (screenShared) {
                // toggle screenShared
                screenShared = !screenShared;

                // set to own video
                // if screen already shared
                localVideo.srcObject = localStream;
                btnShareScreen.innerHTML = '<i class="fas fa-share"></i><br><small>Share screen</small>';

                // get screen sharing video element
                var localScreen = document.querySelector('#my-screen-video');
                // remove it
                removeVideo(localScreen);

                // close all screen share peer connections
                var screenPeers = getPeers(mapScreenPeers);
                for (index in screenPeers) {
                    screenPeers[index].close();
                }
                // empty the screen sharing peer storage object
                mapScreenPeers = {};

                return;
            }

            // toggle screenShared
            screenShared = !screenShared;

            navigator.mediaDevices.getDisplayMedia(constraints)
                .then(stream => {
                    localDisplayStream = stream;

                    var mediaTracks = stream.getTracks();
                    for (i = 0; i < mediaTracks.length; i++) {
                        // console.log(mediaTracks[i]);
                    }

                    var localScreen = createVideo('my-screen');
                    // set to display stream
                    // if screen not shared
                    localScreen.srcObject = localDisplayStream;

                    // notify other peers
                    // of screen sharing peer
                    sendSignal('new-peer', {
                        'local_screen_sharing': true,
                    });
                })
                .catch(error => {
                    console.log('Error accessing display media.', error);
                });

            btnShareScreen.innerHTML = '<i class="far fa-pause-circle"></i><br><small>Stop sharing</small>';
        }
    })
    .then(e => {
        btnRecordScreen.addEventListener('click', () => {
            if (recording) {
                // toggle recording
                recording = !recording;

                btnRecordScreen.innerHTML = '<i class="fas fa-dot-circle"></i><br><small>Record</small>';

                recorder.stopRecording(function () {
                    var blob = recorder.getBlob();
                    invokeSaveAsDialog(blob);
                });

                return;
            }

            // toggle recording
            recording = !recording;

            navigator.mediaDevices.getDisplayMedia(constraints)
                .then(stream => {
                    recorder = RecordRTC(stream, {
                        type: 'video',
                        MimeType: 'video/mp4'
                    });
                    recorder.startRecording();

                    var mediaTracks = stream.getTracks();
                    for (i = 0; i < mediaTracks.length; i++) {
                        // console.log(mediaTracks[i]);
                    }

                })
                .catch(error => {
                    console.log('Error accessing display media.', error);
                });

            btnRecordScreen.innerHTML = '<i class="fas fa-times"></i> <br> <small>Stop Recording</small>';
        });
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

// send the given action and message
// over the websocket connection
function sendSignal(action, message) {
    webSocket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

// create RTCPeerConnection as offerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete
function createOfferer(peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name) {
    var peer = new RTCPeerConnection(iceConfiguration);

    // add local user media stream tracks
    addLocalTracks(peer, localScreenSharing);

    // create and manage an RTCDataChannel
    var dc = peer.createDataChannel("channel");
    dc.onopen = () => {
        // console.log("Connection opened.");
    };
    var remoteVideo = null;
    if (!localScreenSharing && !remoteScreenSharing) {
        // none of the peers are sharing screen (normal operation)

        dc.onmessage = dcOnMessage;

        remoteVideo = createVideo(peerUsername);
        setOnTrack(peer, remoteVideo);
        // console.log('Remote video source: ', remoteVideo.srcObject);

        // store the RTCPeerConnection
        // and the corresponding RTCDataChannel
        mapPeers[peerUsername] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                console.log('Deleting peer');
                delete mapPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    } else if (!localScreenSharing && remoteScreenSharing) {
        // answerer is screen sharing

        dc.onmessage = (e) => {
            // console.log('New message from %s\'s screen: ', peerUsername, e.data);
        };

        remoteVideo = createVideo(peerUsername + '-screen');
        setOnTrack(peer, remoteVideo);
        // console.log('Remote video source: ', remoteVideo.srcObject);

        // if offer is not for screen sharing peer
        mapPeers[peerUsername + ' Screen'] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                delete mapPeers[peerUsername + ' Screen'];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    } else {
        // offerer itself is sharing screen

        dc.onmessage = (e) => {
            // console.log('New message from %s: ', peerUsername, e.data);
        };

        mapScreenPeers[peerUsername] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                delete mapScreenPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
            }
        };
    }

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }

        // event.candidate == null indicates that gathering is complete

        // console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
        // console.log('receiverChannelName: ', receiver_channel_name);

        // send offer to new peer
        // after ice candidate gathering is complete
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
    }

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(function (event) {
            // console.log("Local Description Set successfully.");
        });

    // console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

    return peer;
}

// create RTCPeerConnection as answerer
// and store it and its datachannel
// send sdp to remote peer after gathering is complete
function createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name) {
    var peer = new RTCPeerConnection(iceConfiguration);

    addLocalTracks(peer, localScreenSharing);

    if (!localScreenSharing && !remoteScreenSharing) {
        // if none are sharing screens (normal operation)

        // set remote video
        var remoteVideo = createVideo(peerUsername);

        // and add tracks to remote video
        setOnTrack(peer, remoteVideo);

        // it will have an RTCDataChannel
        peer.ondatachannel = e => {
            // console.log('e.channel.label: ', e.channel.label);
            peer.dc = e.channel;
            peer.dc.onmessage = dcOnMessage;
            peer.dc.onopen = () => {
                // console.log("Connection opened.");
            }

            // store the RTCPeerConnection
            // and the corresponding RTCDataChannel
            // after the RTCDataChannel is ready
            // otherwise, peer.dc may be undefined
            // as peer.ondatachannel would not be called yet
            mapPeers[peerUsername] = [peer, peer.dc];
        }

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                delete mapPeers[peerUsername];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    } else if (localScreenSharing && !remoteScreenSharing) {
        // answerer itself is sharing screen

        // it will have an RTCDataChannel
        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = (evt) => {
                // console.log('New message from %s: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                // console.log("Connection opened.");
            }

            // this peer is a screen sharer
            // so its connections will be stored in mapScreenPeers
            // store the RTCPeerConnection
            // and the corresponding RTCDataChannel
            // after the RTCDataChannel is ready
            // otherwise, peer.dc may be undefined
            // as peer.ondatachannel would not be called yet
            mapScreenPeers[peerUsername] = [peer, peer.dc];

            peer.oniceconnectionstatechange = () => {
                var iceConnectionState = peer.iceConnectionState;
                if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                    delete mapScreenPeers[peerUsername];
                    if (iceConnectionState != 'closed') {
                        peer.close();
                    }
                }
            };
        }
    } else {
        // offerer is sharing screen

        // set remote video
        var remoteVideo = createVideo(peerUsername + '-screen');
        // and add tracks to remote video
        setOnTrack(peer, remoteVideo);

        // it will have an RTCDataChannel
        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = evt => {
                // console.log('New message from %s\'s screen: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                // console.log("Connection opened.");
            }

            // store the RTCPeerConnection
            // and the corresponding RTCDataChannel
            // after the RTCDataChannel is ready
            // otherwise, peer.dc may be undefined
            // as peer.ondatachannel would not be called yet
            mapPeers[peerUsername + ' Screen'] = [peer, peer.dc];

        }
        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed") {
                delete mapPeers[peerUsername + ' Screen'];
                if (iceConnectionState != 'closed') {
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    }

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }

        // event.candidate == null indicates that gathering is complete

        // console.log('Gathering finished! Sending answer SDP to ', peerUsername, '.');
        // console.log('receiverChannelName: ', receiver_channel_name);

        // send answer to offering peer
        // after ice candidate gathering is complete
        // answer needs to send two types of screen sharing data
        // local and remote so that offerer can understand
        // to which RTCPeerConnection this answer belongs
        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
    }

    peer.setRemoteDescription(offer)
        .then(() => {
            // console.log('Set offer from %s.', peerUsername);
            return peer.createAnswer();
        })
        .then(a => {
            // console.log('Setting local answer for %s.', peerUsername);
            return peer.setLocalDescription(a);
        })
        .then(() => {
            // console.log('Answer created for %s.', peerUsername);
            // console.log('localDescription: ', peer.localDescription);
            // console.log('remoteDescription: ', peer.remoteDescription);
        })
        .catch(error => {
            // console.log('Error creating answer for %s.', peerUsername);
            // console.log(error);
        });

    return peer
}

function dcOnMessage(event) {
    var message = event.data;
    var chatDiv = document.createElement("div");
    var chatImage = document.createElement('img');
    var chatSubDiv = document.createElement("div");
    var msgParagraph = document.createElement("p");

    chatContent.appendChild(chatDiv);
    chatDiv.appendChild(chatImage);
    chatDiv.appendChild(chatSubDiv);
    chatSubDiv.appendChild(msgParagraph);

    chatDiv.classList.add("media", "media-chat");
    chatImage.src = "/static/img/avtaar.png";
    chatImage.classList.add("avatar");
    chatSubDiv.classList.add("media-body");
    msgParagraph.innerHTML = message
}

// get all stored data channels
function getDataChannels() {
    var dataChannels = [];

    for (peerUsername in mapPeers) {
        // console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);
        var dataChannel = mapPeers[peerUsername][1];
        // console.log('dataChannel: ', dataChannel);

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}

// get all stored RTCPeerConnections
// peerStorageObj is an object (either mapPeers or mapScreenPeers)
function getPeers(peerStorageObj) {
    var peers = [];
    for (peerUsername in peerStorageObj) {
        var peer = peerStorageObj[peerUsername][0];
        // console.log('peer: ', peer);
        peers.push(peer);
    }

    return peers;
}

// for every new peer
// create a new video element
// and its corresponding user gesture button
// assign ids corresponding to the username of the remote peer
function createVideo(peerUsername) {
    // console.log(peerUsername);
    // console.log(aaaa);
    if (peerUsername.includes('-screen') && peerUsername != 'my-screen') {
        if (peerUsername == host_name + '-screen') {
            // If Host Share the screen
            var videoContainer = document.querySelector('#main-screen-box');
            var remoteVideo = document.createElement('video');
            remoteVideo.id = peerUsername + '-video';
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;

            let mainBox = peerUsername.replace('-screen', '');

            var mq = window.matchMedia("(max-width: 570px)");
            if (mq.matches) {
                $('#youtor-main').css('height', '75vh');
                remoteVideo.style.height = "55vh";
                remoteVideo.style.width = "100%";
                $(remoteVideo).css('object-fit', 'fill');
                $(remoteVideo).css('boxShadow', 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px');
                videoContainer.appendChild(remoteVideo);

                $(localVideo).css('top', '9px');
                $(localVideo).css('left', '10px');
                $(localVideo).css('height', '14vh');
                $(localVideo).css('width', '47%');
                $(localVideo).css('boxShadow', 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px');

                $(mainBox).css('object-fit', 'fill');
                document.getElementById(mainBox + '-video').style.width = '47%';
                document.getElementById(mainBox + '-video').style.height = '14vh';
                document.getElementById(mainBox + '-video').style.margin = '0 0 10px';
                document.getElementById(mainBox + '-video').style.float = 'right';
                document.getElementById(mainBox + '-video').style.border = "thin solid black";
                document.getElementById(mainBox + '-video').style.boxShadow = "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px";
            }
            else {
                remoteVideo.style.height = "72vh";
                remoteVideo.style.width = "80%";
                $(remoteVideo).css('object-fit', 'fill');
                $(remoteVideo).css('boxShadow', 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px');
                videoContainer.appendChild(remoteVideo);

                $(localVideo).css('top', '179px');
                $(localVideo).css('left', '914px');
                $(localVideo).css('height', '20vh');
                $(localVideo).css('width', '19%');
                $(localVideo).css('boxShadow', 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px');

                $(mainBox).css('object-fit', 'fill');
                document.getElementById(mainBox + '-video').style.width = '19%';
                document.getElementById(mainBox + '-video').style.height = '20vh';
                document.getElementById(mainBox + '-video').style.float = 'right';
                document.getElementById(mainBox + '-video').style.border = "thin solid black";
                document.getElementById(mainBox + '-video').style.boxShadow = "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px";

            }


            return remoteVideo;
        } else {
            // If Other user share the screen
            if (host_name == username) {
                // this is userscreen share in admin side
                document.getElementById('mmm').style.display = 'block';
                var x = document.getElementById('mmm');
                x.appendChild(localVideo);
                localVideo.style.height = "80px";
                document.getElementById('host-local-video').style.display = 'none';

                var videoContainer = document.querySelector('#user-share-screen-video');
                var remoteVideo = document.createElement('video');
                remoteVideo.id = peerUsername + '-video';
                remoteVideo.autoplay = true;
                remoteVideo.playsinline = true;
                videoContainer.appendChild(remoteVideo);

                if (document.getElementById('my-screen-video')) {
                    document.getElementById('my-screen-video').style.display = "None";
                }

                // $(localVideo).css('object-fit', 'fill');
                // localVideo.css('object-fit', 'fill');   

                return remoteVideo;
            } else {
                var videoContainer = document.querySelector('#host-screen-box');
                var remoteVideo = document.createElement('video');
                remoteVideo.id = peerUsername + '-video';
                remoteVideo.autoplay = true;
                remoteVideo.playsinline = true;
                videoContainer.appendChild(remoteVideo);
                videoContainer.appendChild(localVideo);
                videoContainer.appendChild(document.getElementById(host_name + '-video'));

                document.getElementById('youtor-main').style.display = 'none';
                document.getElementById('youtor-video').style.display = 'block';
                document.getElementById('host-screen-box').style.display = 'block';

                document.getElementById(peerUsername + '-video').style.width = '80%';
                document.getElementById(peerUsername + '-video').style.height = '70vh';
                // $(peerUsername + '-video').css('object-fit', 'fill');
                // document.getElementById(peerUsername + '-video').css('object-fit', 'fill');

                let participantVideo = peerUsername.replace('-screen', '');
                document.getElementById(participantVideo + '-video').style.width = '19%';
                document.getElementById(participantVideo + '-video').style.height = '21vh';
                document.getElementById(participantVideo + '-video').style.float = 'right';
                // $(participantVideo + '-video').css('object-fit', 'fill');
                // document.getElementById(participantVideo + '-video').css('object-fit', 'fill');

                document.getElementById(host_name + '-video').style.width = '19%';
                document.getElementById(host_name + '-video').style.height = '21vh';
                document.getElementById(host_name + '-video').style.float = 'right';
                document.getElementById(host_name + '-video').style.marginTop = '-175px';
                // $(host_name + '-video').css('object-fit', 'fill');
                // document.getElementById(host_name + '-video').css('object-fit', 'fill');

                document.getElementById('local-video').style.width = '19%';
                document.getElementById('local-video').style.height = '21vh';
                document.getElementById('local-video').style.float = 'right';
                document.getElementById('local-video').style.top = '170px';
                document.getElementById('local-video').style.left = '80%';
            }


            if (document.getElementById('my-screen-video')) {
                document.getElementById('my-screen-video').style.display = "None";
            }

            // $(localVideo).css('object-fit', 'fill');
            // localVideo.css('object-fit', 'fill');   

            return remoteVideo;
        }


    }
    else if (peerUsername == host_name) {
        // For Create Host Video 
        var videoContainer = document.querySelector('#main-screen-box');
        var remoteVideo = document.createElement('video');
        remoteVideo.id = peerUsername + '-video';
        remoteVideo.autoplay = true;
        remoteVideo.playsinline = true;
        videoContainer.appendChild(remoteVideo);
        localVideo.style.height = "75px";
        localVideo.style.width = "75px";
        var mq = window.matchMedia("(max-width: 570px)");
        if (mq.matches) {
            remoteVideo.style.height = "67vh";
            remoteVideo.style.width = "100%";
            $(remoteVideo).css('object-fit', 'fill');
            $('#youtor-video').css('display', 'none');
        }
        else {
            // Create video Host css   
            remoteVideo.style.height = "75vh";
            remoteVideo.style.width = "100%";
            $(remoteVideo).css('object-fit', 'fill');
            $('#youtor-video').css('display', 'none');
        }

        return remoteVideo;
    } else {

        if (username == host_name) {
            // this is admin side
            document.getElementById("youtor-main").style.display = "none";
            document.getElementById("youtor-video").style.display = "none";
            document.getElementById("host-view").style.display = "block";
            var videoContainer2 = document.querySelector('#host-local-video');
            videoContainer2.appendChild(localVideo);
            // For create user video
            var userVideoContainer = document.querySelector('#user-video');
            var userSubdiv = document.createElement('div');
            var remoteVideo = document.createElement('video');

            remoteVideo.id = peerUsername + '-video';
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;

            userVideoContainer.appendChild(userSubdiv);
            userSubdiv.appendChild(remoteVideo);

            userSubdiv.classList.add("col-lg-12");
        } else {
            // For create user video
            // This is user side
            var videoContainer = document.querySelector('#host-screen-box');
            var remoteVideo = document.createElement('video');
            remoteVideo.id = peerUsername + '-video';
            remoteVideo.autoplay = true;
            remoteVideo.playsinline = true;
            videoContainer.appendChild(remoteVideo);
        }

        if (document.getElementById('my-screen-video')) {
            document.getElementById('my-screen-video').style.display = "None";
        }
        return remoteVideo;

    }
}

// set onTrack for RTCPeerConnection
// to add remote tracks to remote stream
// to show video through corresponding remote video element
function setOnTrack(peer, remoteVideo) {
    // console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    // console.log('remoteVideo: ', remoteVideo.id);

    peer.addEventListener('track', async (event) => {
        // console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}

// called to add appropriate tracks
// to peer
function addLocalTracks(peer, localScreenSharing) {
    if (!localScreenSharing) {
        // if it is not a screen sharing peer
        // add user media tracks
        localStream.getTracks().forEach(track => {
            // console.log('Adding localStream tracks.');
            peer.addTrack(track, localStream);
        });

        return;
    }

    // if it is a screen sharing peer
    // add display media tracks
    localDisplayStream.getTracks().forEach(track => {
        // console.log('Adding localDisplayStream tracks.');
        peer.addTrack(track, localDisplayStream);
    });
}

function removeVideo(video) {
    // remove it
    // console.log(video.id);
    if (video.id.includes('-screen-video') == true) {
        let mainBox = video.id.replace('-screen', '');
        if (mainBox != 'my-video' && mainBox != null) {
            if (host_name + '-screen-video' == video.id) {
                document.getElementById(mainBox).style.height = "70vh";
                document.getElementById(mainBox).style.width = "100%";
                localVideo.style.width = "80px";
                localVideo.style.height = "80px";
                localVideo.style.top = "10px";
                localVideo.style.left = "10px";
                document.getElementById(mainBox).style.removeProperty('float');
            }
            else {
                let participant = video.id.replace('-screen', '');
                document.getElementById(participant).style.display = 'none';
                if (host_name == username) {

                    document.getElementById('youtor-main').style.display = 'none';
                    document.getElementById('youtor-video').style.display = 'none';
                    document.getElementById('host-local-video').style.display = 'block';
                    document.getElementById('user-share-screen-video').style.display = 'none';
                    document.getElementById('mmm').style.display = 'none';

                    var x = document.getElementById('host-local-video');
                    x.appendChild(localVideo);

                    let participant1 = video.id.replace('-screen', '');
                    document.getElementById(participant1).style.display = 'block';

                } else {
                    document.getElementById(host_name + '-video').style.width = '100%';
                    document.getElementById(host_name + '-video').style.height = '70vh';
                    document.getElementById(host_name + '-video').style.marginTop = '0px';
                    document.getElementById(host_name + '-video').style.removeProperty('float');
                }
                localVideo.style.width = "75px";
                localVideo.style.height = "75px";
                localVideo.style.top = "10px";
                localVideo.style.left = "10px";
                document.getElementById(mainBox).style.removeProperty('float');
                localVideo.style.removeProperty('float');
            }


        }
        if (host == true) {
            localVideo.width = "100%";
        }

        video.remove();
    } else {
        video.remove();
    }
    if (Object.keys(mapPeers).length == 0) {

        var mq = window.matchMedia("(max-width: 570px)");
        if (mq.matches) {
            localVideo.style.height = "68vh";
            localVideo.style.width = "100%";
            localVideo.style.top = "0";
            localVideo.style.left = "0";
        }
        else {
            // Create video Host css   
            localVideo.style.height = "75vh";
            localVideo.style.width = "100%";
            localVideo.style.top = "0";
            localVideo.style.left = "0";
        }
    }
}

function manas() {
    // console.log(mapPeers);
    // console.log(Object.keys(mapPeers).length);
}
// $(document).ready(function () {
//     setTimeout(function () {
//       location.reload(true);
//     }, 5000);
//   });