import { Number } from "mongoose";

export const illegalNumber = (value: number) =>
  isNaN(value) || value < 1 || value > 200;

export const illegalCoordinate = (coord: { x: number; y: number }) =>
  coord.x < 0 || coord.x > 2000 || coord.y < 0 || coord.y > 2000;
