import {
  jayessChannelClose,
  jayessChannelCreate,
  jayessChannelIsClosed,
  jayessChannelReceive,
  jayessChannelSend
} from "./channel-primitives.hpp";

export function create() {
  return jayessChannelCreate();
}

export function send(channel, value) {
  return jayessChannelSend(channel, value);
}

export function receive(channel) {
  return jayessChannelReceive(channel);
}

export function close(channel) {
  return jayessChannelClose(channel);
}

export function isClosed(channel) {
  return jayessChannelIsClosed(channel);
}
