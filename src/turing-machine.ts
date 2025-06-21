import { Tape } from './tape';
import { Head } from './head';
import { Direction } from './direction';

interface InstructionKey {
    currentState: string;
    currentValue: string;
}

interface Instruction {
    nextState: string;
    writeValue: string;
    direction: Direction;
}

interface ExecutionResult {
    tapeString: string;
    currentState: string;
    hasCrashed: boolean;
    headPosition: number;
}

class TuringMachine {
    private currentState: string;
    private haltingStates: Set<string>;
    private instructionTable: Map<InstructionKey, Instruction>;
    private tape: Tape;
    private head: Head;

    constructor(
        initialState: string,
        haltingStates: string[],
        instructionTable: Map<InstructionKey, Instruction>,
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
        while (!this.haltingStates.has(this.currentState)) {
            const currentValue = this.head.read();
            const instructionKey: InstructionKey = {currentState: this.currentState, currentValue: currentValue};
            
            if (!this.instructionTable.has(instructionKey)) {
                return this.createExecutionResult(false);
            }

            const instruction = this.instructionTable.get(instructionKey)!;
            this.head.write(instruction.writeValue);
            this.head.move(instruction.direction);
            this.currentState = instruction.nextState;
        }

        return this.createExecutionResult(true);
    }

    private createExecutionResult(hasCrashed: boolean): ExecutionResult {
        return {
            tapeString: this.tape.toString(),
            currentState: this.currentState,
            hasCrashed: hasCrashed,
            headPosition: this.head.currentPosition()
        };
    }
}

export { TuringMachine, Instruction, ExecutionResult }; 