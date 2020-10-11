import React, { FC, memo } from 'react';

type SongProps = {
  title: string;
  thumb: string;
  channel?: string;
};

const Song: FC<SongProps> = ({ title, channel, thumb }) => {
  return (
    <div className='song-card big'>
      <div className='container'>
        <div>
          <img src={thumb} alt='thumb' />
        </div>
        <div>
          <div className='title'>{title}</div>
          {channel && <div>{channel}</div>}
        </div>
      </div>
    </div>
  );
};

export default memo(Song);
