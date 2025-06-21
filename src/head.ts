import { Tape } from './tape';
import { Direction } from './direction';

class Head {
    private position: number;
    private tape: Tape;

    constructor(initialPosition: number, tape: Tape) {
        this.position = initialPosition;
        this.tape = tape;
    }

    read(): string {
        return this.tape.read(this.position);
    }

    write(value: string): void {
        this.tape.write(this.position, value);
    }

    move(direction: Direction): void {
        switch (direction) {
            case Direction.LEFT:
                this.position--;
                break;
            case Direction.RIGHT:
                this.position++;
                break;
            case Direction.STAY:
                break;
        }
    }

    currentPosition(): number {
        return this.position;
    }
}

export { Head }; 