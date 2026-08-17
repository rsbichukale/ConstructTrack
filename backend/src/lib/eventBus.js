/**
 * Real-Time LAN Event Broadcaster (Server-Sent Events - SSE)
 * Allows phones and laptops on the site Wi-Fi to receive sub-second updates
 * whenever inspections, tasks, or store inventory change.
 */

const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, payload) {
    const data = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      try {
        client.write(`event: ${eventType}\ndata: ${data}\n\n`);
      } catch (_) {
        this.clients.delete(client);
      }
    }
    this.emit(eventType, payload);
  }

  getClientCount() {
    return this.clients.size;
  }
}

const eventBus = new EventBus();
module.exports = eventBus;
