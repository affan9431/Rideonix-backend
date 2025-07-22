// socketController.js

const driverList = new Map(); // change to map from array
const nearestDriverList = new Map();
const rideLocks = new Map(); // 🔐 This goes outside the socket.on()
const riderSocketMap = new Map();
const driverSocketMap = new Map();

exports.registerRider = (socket) => {
  return (data) => {
    riderSocketMap.set(data.riderId, socket.id);
  };
};
