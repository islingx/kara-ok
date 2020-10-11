class Song {
  title: string;
  id: string;
  thumb: string;
  channel?: string;

  constructor(title: string, id: string, thumb: string) {
    this.title = title;
    this.id = id;
    this.thumb = thumb;
  }
}

export default Song;
