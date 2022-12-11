export interface IAsteroid {
  _id: any;
  name: string;
  minerals: number;
  mined: number;
  position: {
    x: number;
    y: number;
  };
}
