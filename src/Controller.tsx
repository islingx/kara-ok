import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Divider, Input, List, notification, Typography } from 'antd';
import {
  VerticalAlignTopOutlined,
  CloseOutlined,
  CaretRightOutlined,
  PauseOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import axios from 'axios';

import Song from './Song';
import { createRoom } from './roomUsecase';
import { Link } from 'react-router-dom';

const KEY = 'AIzaSyCxMLRCWK7yQW2eH6E9xYZdFl-M4rylTAY';
const getSearchByIDURI = (id: string) =>
  `https://www.googleapis.com/youtube/v3/videos?key=${KEY}&part=snippet&id=${id}&maxResults=20`;
const getSearchURI = (query: string) =>
  `https://www.googleapis.com/youtube/v3/search?key=${KEY}&part=snippet,id&q=${query}&maxResults=20`;

const Controller = () => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isPlay, setPlay] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const curSongId = useRef('NONE');
  const nextSongId = useRef('');
  const sendData = useRef<(data: Object) => void>();
  const nextAvailable = useRef(false);

  const handleSearchByID = async (value: string) => {
    const res = await axios.get(getSearchByIDURI(value));

    const { items } = res.data;
    if (items.length > 0) {
      const first = items[0];

      const title = first.snippet.title;
      const id = first.id;
      const thumb = first.snippet.thumbnails.default.url;

      const song = new Song(title, id, thumb);

      setPlaylist((value) => [...value, song]);
    }
  };

  const handleSearch = async (value: string) => {
    const res = await axios.get(getSearchURI(value));

    console.log(res.data.items);
  };

  const sendDataSafe = (d: Object) => {
    if (sendData.current) {
      sendData.current(d);
    }
  };

  const play = () => {
    sendDataSafe({ type: 'CMD', cmd: 'PLAY' });
  };

  const pause = () => {
    sendDataSafe({ type: 'CMD', cmd: 'PAUSE' });
  };

  const next = useCallback(() => {
    if (nextAvailable.current) {
      setCurrentIndex((val) => val + 1);
    }
  }, []);

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((val) => val - 1);
    }
  };

  const moveTop = (idx: number) => () => {
    setPlaylist((val) => {
      if (idx === val.length - 1) {
        return [
          ...val.slice(0, currentIndex + 1),
          val[idx],
          ...val.slice(currentIndex + 1, idx),
        ];
      } else if (idx > 1) {
        return [
          ...val.slice(0, currentIndex + 1),
          val[idx],
          ...val.slice(currentIndex + 1, idx),
          ...val.slice(idx + 1),
        ];
      } else {
        return val;
      }
    });
  };

  const removeItem = (idx: number) => () => {
    setPlaylist((val) => {
      const clone = [...val];
      clone.splice(idx, 1);
      return clone;
    });
  };

  useEffect(() => {
    createRoom().then((dataChannel) => {
      dataChannel.onopen = () => {
        sendData.current = (d: Object) => {
          dataChannel.send(JSON.stringify(d));
        };
      };

      dataChannel.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.type === 'msg' && data.msg === 'CONNECTED') {
          setWaiting(false);
          console.log('player connected');
          notification.info({
            message: 'Player connected',
          });
        }

        if (data.type === 'msg' && data.msg === 'PAUSE') {
          setPlay(false);
        }

        if (data.type === 'msg' && data.msg === 'PLAY') {
          setPlay(true);
        }

        if (data.type === 'msg' && data.msg === 'END') {
          if (!nextAvailable.current) {
            setPlay(false);
          } else {
            next();
          }
        }
      };
    });
  }, [next]);

  useEffect(() => {
    if (currentIndex + 1 < playlist.length) {
      nextAvailable.current = true;
    } else {
      nextAvailable.current = false;
    }

    if (waiting) {
      return;
    }

    if (playlist.length > currentIndex) {
      const curSong = playlist[currentIndex];

      if (curSongId.current !== curSong.id) {
        curSongId.current = curSong.id;
        console.log('play', curSong.title);
        sendDataSafe({ type: 'DATA', curSong: curSong });
      }
    } else {
      curSongId.current = 'NONE';
    }

    if (playlist.length > currentIndex + 1) {
      const nextSong = playlist[currentIndex + 1];

      if (nextSongId.current !== nextSong.id) {
        nextSongId.current = nextSong.id;
        console.log('next', nextSong.title);
        sendDataSafe({ type: 'DATA', nextSong: nextSong });
      }
    } else {
      nextSongId.current = 'END';
      console.log('next', 'END');
      sendDataSafe({ type: 'DATA', nextSong: 'END' });
    }
  }, [currentIndex, playlist, waiting]);

  return (
    <div className='control'>
      <div className='search'>
        <div className='status'>
          <Link to='/player' target='_blank'>
            Open player
          </Link>
          <Typography>
            Player status: {waiting ? 'not open' : 'ready'}
          </Typography>
        </div>
        <Divider />
        <Typography.Title level={5}>Add by Video ID</Typography.Title>
        <Input.Search
          style={{ width: 360 }}
          type='text'
          placeholder='video id'
          enterButton='Add'
          onSearch={handleSearchByID}
        />
        <Divider />
        <Typography.Title level={5}>Search Video</Typography.Title>
        <Input.Search
          style={{ width: 360 }}
          type='text'
          placeholder='title, category...'
          enterButton='Search'
          onSearch={handleSearch}
        />
      </div>
      <Divider type='vertical' style={{ height: '100%' }} />
      <div className='playlist-wrapper'>
        <div className='panel'>
          <div className='panel-container'>
            <button onClick={prev} className='background-none'>
              <StepBackwardOutlined style={{ fontSize: 24 }} />
            </button>
            {!isPlay && (
              <button onClick={play}>
                <CaretRightOutlined style={{ fontSize: 24 }} />
              </button>
            )}
            {isPlay && (
              <button onClick={pause}>
                <PauseOutlined style={{ fontSize: 24 }} />
              </button>
            )}
            <button onClick={next} className='background-none'>
              <StepForwardOutlined style={{ fontSize: 24 }} />
            </button>
          </div>
        </div>
        <div className='playlist'>
          <List
            className='playlist-container'
            dataSource={playlist}
            renderItem={(song, index) => (
              <List.Item
                className={`
                song-card 
                ${index < currentIndex ? 'played' : ''}
                ${index === currentIndex ? 'active' : ''}
              `}
                actions={[
                  <Button
                    disabled={index <= currentIndex + 1}
                    onClick={moveTop(index)}
                    icon={<VerticalAlignTopOutlined />}
                  />,
                  <Button
                    disabled={index <= currentIndex}
                    onClick={removeItem(index)}
                    icon={<CloseOutlined />}
                  />,
                ]}
              >
                <div className='container'>
                  <img src={song.thumb} alt='thumb'></img>
                  <div className='info'>
                    <div className='title'>{song.title}</div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(Controller);
