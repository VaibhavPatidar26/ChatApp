const clients = new Map();

function addClient(userId, socket) {
  clients.set(userId, socket);
}

function removeClient(userId, socket) {
  if (clients.get(userId) === socket) {
    clients.delete(userId);
  }
}

function getClient(userId) {
  return clients.get(userId);
}

module.exports = {
  addClient,
  removeClient,
  getClient
};
