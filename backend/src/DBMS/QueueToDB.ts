import { DBQueueElement, } from "../types";
import { EventEmitter } from 'events';

class QueueToDB extends EventEmitter {
    private queue: DBQueueElement[] = [];

    constructor() {
        super();
        this.queue = [];

        this.on('newElement', () => {
            if (!this.isEmpty()) {
                const element = this.pop();
                if (element) {
                    const {operation, parameters}= element;
                    operation(...parameters).catch((error:Error) => {
                        console.log('Error in QueueToDB', error);
                    });
                }
            }
        });
    }

    push(data: DBQueueElement) {
        this.queue.push(data);
        this.emit('newElement');
    }

    pop() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

const queueToDB = new QueueToDB();

export {queueToDB};