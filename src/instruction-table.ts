import { Direction } from './direction.js';

class InstructionKey {
    currentState: string;
    currentValue: string;

    constructor(currentState: string, currentValue: string) {
        this.currentState = currentState;
        this.currentValue = currentValue;
    }

    toString(): string {
        return `${this.currentState}_${this.currentValue}`;
    }
}

interface Instruction {
    nextState: string;
    writeValue: string;
    direction: Direction;
}

class InstructionTable {
    private table: Map<string, Instruction>;

    constructor(instructions: Map<InstructionKey, Instruction>) {
        this.table = new Map();
        for (const [key, instruction] of instructions.entries()) {
            this.table.set(key.toString(), instruction);
        }
    }

    get(key: InstructionKey): Instruction | undefined {
        return this.table.get(key.toString());
    }

    has(key: InstructionKey): boolean {
        return this.table.has(key.toString());
    }
}

export { InstructionTable, InstructionKey, Instruction }; 