"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.illegalCoordinate = exports.illegalNumber = void 0;
const illegalNumber = (value) => isNaN(value) || value < 1 || value > 200;
exports.illegalNumber = illegalNumber;
const illegalCoordinate = (coord) => coord.x < 0 || coord.x > 2000 || coord.y < 0 || coord.y > 2000;
exports.illegalCoordinate = illegalCoordinate;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
