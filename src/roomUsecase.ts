import firebase from 'firebase/app';
import 'firebase/firestore';
import configs from './config';

export const createRoom = async (): Promise<RTCDataChannel> => {
  const db = firebase.firestore();

  // create peer connection
  const peerConnection = new RTCPeerConnection(configs.webRTC);
  registerPeerConnectionListeners(peerConnection);

  const dataChannel = peerConnection.createDataChannel('send-cmd');
  registerDataChannelListeners(dataChannel);

  // create room
  await deleteRoom();
  const roomRef = db.collection('karaRooms').doc('default');
  await collectICECandidates(
    roomRef,
    peerConnection,
    'controllerCandidates',
    'playerCandidates'
  );

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  const roomWithOffer = {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await roomRef.set(roomWithOffer);

  roomRef.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!data) {
      return;
    }

    console.log('got update room:', data);
    if (!peerConnection.currentRemoteDescription && data.answer) {
      console.log('set remote description:', data.answer);
      const answer = new RTCSessionDescription(data.answer);
      peerConnection.setRemoteDescription(answer);
    }
  });

  return dataChannel;
};

export const joinRoom = async (): Promise<RTCDataChannel | undefined> => {
  const db = firebase.firestore();

  await leaveRoom();
  const roomRef = db.collection('karaRooms').doc('default');
  const roomSnapshot = await roomRef.get();
  const room = roomSnapshot.data();

  if (!room) {
    return;
  }

  const peerConnection = new RTCPeerConnection(configs.webRTC);
  registerPeerConnectionListeners(peerConnection);

  await collectICECandidates(
    roomRef,
    peerConnection,
    'playerCandidates',
    'controllerCandidates'
  );

  return new Promise(async (resolve) => {
    peerConnection.addEventListener('datachannel', (event) => {
      registerDataChannelListeners(event.channel);
      resolve(event.channel);
    });

    const offer = room.offer;
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);

    const roomWithOffer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await roomRef.update(roomWithOffer);
  });
};

export const deleteRoom = async (): Promise<void> => {
  const db = firebase.firestore();
  const roomRef = db.collection('karaRooms').doc('default');
  const concans = await roomRef.collection('controllerCandidates').get();
  concans.forEach(async (doc) => await doc.ref.delete());
  const placans = await roomRef.collection('playerCandidates').get();
  placans.forEach(async (doc) => await doc.ref.delete());
  await roomRef.delete();
};

export const leaveRoom = async (): Promise<void> => {
  const db = firebase.firestore();
  const roomRef = db.collection('karaRooms').doc('default');
  const placans = await roomRef.collection('playerCandidates').get();
  placans.forEach(async (doc) => await doc.ref.delete());
};

async function collectICECandidates(
  roomRef: firebase.firestore.DocumentReference,
  peerConnection: RTCPeerConnection,
  localName: string,
  remoteName: string
) {
  const candidatesCollection = roomRef.collection(localName);
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log(localName, 'add candidate:', event.candidate);

      const json = event.candidate.toJSON();
      candidatesCollection.add(json);
    }
  };

  roomRef.collection(remoteName).onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        console.log(localName, 'receive candidate:', data);

        const candidate = new RTCIceCandidate(data);
        peerConnection.addIceCandidate(candidate);
      }
    });
  });
}

function registerDataChannelListeners(dataChannel: RTCDataChannel) {
  dataChannel.addEventListener('message', (event) => {
    console.log(event.data);
  });
  dataChannel.addEventListener('open', () => {
    console.log('data channel open');
  });
  dataChannel.addEventListener('close', () => {
    console.log('data channel close');
  });
}

function registerPeerConnectionListeners(peerConnection: RTCPeerConnection) {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
      `ICE gathering state changed: ${peerConnection.iceGatheringState}`
    );
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
      `ICE connection state change: ${peerConnection.iceConnectionState}`
    );
  });
}
