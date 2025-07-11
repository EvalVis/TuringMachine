import { Tape } from './tape.js';
import { Head } from './head.js';
import { InstructionTable, InstructionKey, Instruction } from './instruction-table.js';

interface ExecutionResult {
    tape: string;
    state: string;
    isInFinalState: boolean;
    hasCrashed: boolean;
    headPosition: number;
}

class TuringMachine {
    private currentState: string;
    private haltingStates: Set<string>;
    private instructionTable: InstructionTable;
    private tape: Tape;
    private head: Head;

    constructor(
        initialState: string,
        haltingStates: string[],
        instructionTable: InstructionTable,
        tape: Tape,
        headPosition: number | undefined = undefined
    ) {
        this.currentState = initialState;
        this.haltingStates = new Set(haltingStates);
        this.instructionTable = instructionTable;
        this.tape = tape;
        
        const firstNonBlankPosition = tape.findFirstNonBlankPosition();
        this.head = new Head(headPosition || firstNonBlankPosition, tape);
    }

    execute(): ExecutionResult {
        while (!this.isInFinalState()) {
            const currentValue = this.head.read();
            const instructionKey = new InstructionKey(this.currentState, currentValue);

            if (this.hasCrashed(instructionKey)) {
                return this.createExecutionResult(true);
            }

            const instruction = this.instructionTable.get(instructionKey)!;
            this.head.write(instruction.writeValue);
            this.head.move(instruction.direction);
            this.currentState = instruction.nextState;
        }

        return this.createExecutionResult(false);
    }

    step(): ExecutionResult {
        if (this.isInFinalState()) {
            return this.createExecutionResult(false);
        }

        const currentValue = this.head.read();
        const instructionKey = new InstructionKey(this.currentState, currentValue);

        if (this.hasCrashed(instructionKey)) {
            return this.createExecutionResult(true);
        }

        const instruction = this.instructionTable.get(instructionKey)!;
        this.head.write(instruction.writeValue);
        this.head.move(instruction.direction);
        this.currentState = instruction.nextState;

        return this.createExecutionResult(false);
    }

    private createExecutionResult(hasCrashed: boolean): ExecutionResult {
        return {
            tape: this.tape.toString(),
            state: this.currentState,
            isInFinalState: this.isInFinalState(),
            hasCrashed: hasCrashed,
            headPosition: this.head.currentPosition()
        };
    }

    private hasCrashed(instructionKey: InstructionKey): boolean {
        return !this.instructionTable.has(instructionKey);
    }
    
    private isInFinalState(): boolean {
        return this.haltingStates.has(this.currentState);
    }

    getTapeLeftmostPosition(): number {
        return this.tape.getLeftmostPosition();
    }
}

export { TuringMachine, Instruction, ExecutionResult }; 