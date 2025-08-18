// Central socket.io accessor to avoid circular dependencies
let ioInstance = { emit: () => {} };

export function setIo(io) {
  ioInstance = io;
}

export function getIo() {
  return ioInstance;
}

