import { Tape } from './tape';
import { Head } from './head';
import { InstructionTable, InstructionKey, Instruction } from './instruction-table';

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
        tape: Tape
    ) {
        this.currentState = initialState;
        this.haltingStates = new Set(haltingStates);
        this.instructionTable = instructionTable;
        this.tape = tape;
        
        const firstNonBlankPosition = tape.findFirstNonBlankPosition();
        this.head = new Head(firstNonBlankPosition, tape);
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
}

export { TuringMachine, Instruction, ExecutionResult }; 