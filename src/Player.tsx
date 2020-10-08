import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Youtube, { Options } from 'react-youtube';
import Song from './Song';
import { joinRoom } from './roomUsecase';
import { notification } from 'antd';

const youtubeOpts: Options = {
  playerVars: {
    autoplay: 1,
  },
};

const defaultSong = new Song(
  'Gác lại âu lo - Da LAB ft. Miu Lê (Official MV)',
  'ECxVfrwwTp0',
  'https://i.ytimg.com/vi/ECxVfrwwTp0/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDUDVO_R2woFe0raTEnFyTXRskFzw'
);

const Player = () => {
  const [loading, setLoading] = useState(true);
  const [curSong, setCurSong] = useState<Song>(defaultSong);
  const [nextSong, setNextSong] = useState<Song>();
  const player = useRef<any>();
  const sendData = useRef<(data: Object) => void>();

  const sendDataSafe = (d: Object) => {
    if (sendData.current) {
      sendData.current(d);
    }
  };

  const handleStageChange = (event: { data: number }) => {
    if (event.data === 0) {
      sendDataSafe({ type: 'msg', msg: 'END' });
    }
  };

  const handlePlay = () => {
    sendDataSafe({ type: 'msg', msg: 'PLAY' });
  };

  const handlePause = () => {
    sendDataSafe({ type: 'msg', msg: 'PAUSE' });
  };

  const onReady = (event: { target: any }) => {
    player.current = event.target;
  };

  const play = () => {
    if (!player.current) {
      return;
    }

    player.current.playVideo();
  };

  const pause = () => {
    if (!player.current) {
      return;
    }

    player.current.pauseVideo();
  };

  const handleCmd = useCallback((cmd: string) => {
    switch (cmd) {
      case 'PLAY':
        play();
        break;
      case 'PAUSE':
        pause();
    }
  }, []);

  const handleChangeCurSong = (song: Song) => {
    setCurSong(song);
  };

  const handleChangeNextSong = (song: Song | 'END') => {
    if (song === 'END') {
      setNextSong(undefined);
    } else {
      setNextSong(song);
    }
  };

  useEffect(() => {
    joinRoom().then((dataChannel) => {
      if (!dataChannel) {
        return;
      }

      dataChannel.addEventListener('open', () => {
        const data = { type: 'msg', msg: 'CONNECTED' };
        dataChannel.send(JSON.stringify(data));
        setLoading(false);

        sendData.current = (d: Object) => dataChannel.send(JSON.stringify(d));
      });

      dataChannel.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'CMD') {
          handleCmd(data.cmd);
        } else if (data.type === 'DATA') {
          if (data.curSong) {
            handleChangeCurSong(data.curSong);
          }

          if (data.nextSong) {
            handleChangeNextSong(data.nextSong);
          }
        }
      };
    });
  }, [handleCmd]);

  useEffect(() => {
    if (!player.current) {
      return;
    }

    player.current.seekTo(0, true);
  }, [curSong]);

  useEffect(() => {
    const message = nextSong
      ? `Next song: ${nextSong.title}`
      : 'Do not have the next song';

    notification.info({
      message,
    });
  }, [nextSong]);

  return (
    <div className='player'>
      {!loading && (
        <Youtube
          containerClassName='youtube-container'
          className='youtube'
          videoId={curSong.id}
          opts={youtubeOpts}
          onReady={onReady}
          onStateChange={handleStageChange}
          onPlay={handlePlay}
          onPause={handlePause}
        />
      )}
    </div>
  );
};

export default memo(Player);
