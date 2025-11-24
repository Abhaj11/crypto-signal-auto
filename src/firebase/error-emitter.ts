import { EventEmitter } from 'events';

// This is a simple event emitter that will be used to globally handle Firestore permission errors.
export const errorEmitter = new EventEmitter();
