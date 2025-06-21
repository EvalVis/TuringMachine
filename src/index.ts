import { Tape } from './tape.js';
import { Head } from './head.js';
import { Direction } from './direction.js';
import { TuringMachine, Instruction, ExecutionResult } from './turing-machine.js';
import { InstructionTable, InstructionKey } from './instruction-table.js';

export { Tape, Head, Direction, TuringMachine, Instruction, ExecutionResult };
class TuringMachineVisualizer {
    private machine: TuringMachine | null = null;
    private isRunning = false;
    private currentResult: ExecutionResult | null = null;
    private machineNeedsRecreation = false;
    private machineHasStarted = false;

    constructor() {
        this.setupEventListeners();
        this.loadExample();
    }

    private setupEventListeners(): void {
        document.getElementById('step-btn')?.addEventListener('click', () => this.step());
        document.getElementById('run-btn')?.addEventListener('click', () => this.run());
        document.getElementById('fastest-run-btn')?.addEventListener('click', () => this.fastestRun());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.reset());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clear());
        
        const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        speedSlider?.addEventListener('input', () => this.updateSpeedDisplay());
        
        document.getElementById('tape-input')?.addEventListener('input', () => {
            this.updateTapeDisplay();
            this.markMachineStale();
        });
        document.getElementById('instructions-input')?.addEventListener('input', () => this.markMachineStale());
        document.getElementById('initial-state')?.addEventListener('input', () => this.markMachineStale());
        document.getElementById('final-states')?.addEventListener('input', () => this.markMachineStale());
        document.getElementById('blank-symbol')?.addEventListener('input', () => this.markMachineStale());
    }

    private loadExample(): void {
        const instructionsMap = new Map<InstructionKey, Instruction>();
        
        instructionsMap.set(new InstructionKey('q0', '0'), { nextState: 'q0', writeValue: '0', direction: Direction.RIGHT });
        instructionsMap.set(new InstructionKey('q0', '1'), { nextState: 'q0', writeValue: '1', direction: Direction.RIGHT });
        instructionsMap.set(new InstructionKey('q0', '_'), { nextState: 'q1', writeValue: '_', direction: Direction.LEFT });
        
        instructionsMap.set(new InstructionKey('q1', '0'), { nextState: 'q2', writeValue: '1', direction: Direction.STAY });
        instructionsMap.set(new InstructionKey('q1', '1'), { nextState: 'q1', writeValue: '0', direction: Direction.LEFT });
        instructionsMap.set(new InstructionKey('q1', '_'), { nextState: 'q2', writeValue: '1', direction: Direction.STAY });

        const instructionTable = new InstructionTable(instructionsMap);
        
        const initialTapeData = new Map<number, string>();
        initialTapeData.set(0, '1');
        initialTapeData.set(1, '0');
        initialTapeData.set(2, '1');
        
        const tape = new Tape(initialTapeData, '_');
        this.machine = new TuringMachine('q0', ['q2'], instructionTable, tape);
        
        (document.getElementById('tape-input') as HTMLTextAreaElement).value = '101';
        (document.getElementById('initial-state') as HTMLInputElement).value = 'q0';
        (document.getElementById('final-states') as HTMLInputElement).value = 'q2';
        (document.getElementById('blank-symbol') as HTMLInputElement).value = '_';
        (document.getElementById('instructions-input') as HTMLTextAreaElement).value = 
            'q0,0 -> q0,0,R\nq0,1 -> q0,1,R\nq0,_ -> q1,_,L\nq1,0 -> q2,1,S\nq1,1 -> q1,0,L\nq1,_ -> q2,1,S';
        
        this.currentResult = null;
        this.updateDisplay();
    }

    private step(): void {
        if (!this.machine) return;
        
        if (this.machineNeedsRecreation) {
            this.recreateMachinePreservingExecution();
            this.machineNeedsRecreation = false;
        }
        
        this.machineHasStarted = true;
        this.currentResult = this.machine.step();
        this.updateDisplay();
        this.updateButtons();
        
        if (this.currentResult.isInFinalState || this.currentResult.hasCrashed) {
            this.isRunning = false;
            this.updateButtons();
        }
    }

    private async run(): Promise<void> {
        if (!this.machine) return;
        
        if (this.machineNeedsRecreation) {
            this.recreateMachinePreservingExecution();
            this.machineNeedsRecreation = false;
        }
        
        this.isRunning = true;
        this.updateButtons();
        
        while (!this.currentResult?.isInFinalState && !this.currentResult?.hasCrashed && this.isRunning) {
            this.step();
            const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
            const delay = parseInt(speedSlider.value) || 500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.isRunning = false;
        this.updateButtons();
    }

    private async fastestRun(): Promise<void> {
        if (!this.machine) return;
        
        if (this.machineNeedsRecreation) {
            this.recreateMachinePreservingExecution();
            this.machineNeedsRecreation = false;
        }
        
        this.isRunning = true;
        this.machineHasStarted = true;
        this.updateButtons();
        
        this.currentResult = this.machine.execute();
        this.updateDisplay();
        
        this.isRunning = false;
        this.updateButtons();
    }

    private updateSpeedDisplay(): void {
        const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
        const speedDisplay = document.getElementById('speed-display') as HTMLSpanElement;
        if (speedSlider && speedDisplay) {
            speedDisplay.textContent = `${speedSlider.value}ms`;
        }
    }

    private reset(): void {
        this.isRunning = false;
        this.machineHasStarted = false;
        this.createMachineFromInput();
        this.updateDisplay();
        this.updateButtons();
    }

    private clear(): void {
        (document.getElementById('tape-input') as HTMLTextAreaElement).value = '';
        (document.getElementById('initial-state') as HTMLInputElement).value = '';
        (document.getElementById('final-states') as HTMLInputElement).value = '';
        (document.getElementById('blank-symbol') as HTMLInputElement).value = '';
        (document.getElementById('instructions-input') as HTMLTextAreaElement).value = '';
        this.machine = null;
        this.currentResult = null;
        this.machineHasStarted = false;
        this.updateDisplay();
    }

    private createMachineFromInput(currentState: string | undefined = undefined, headPosition: number | undefined = undefined): void {
        try {
            const tapeInput = (document.getElementById('tape-input') as HTMLTextAreaElement).value;
            const initialState = (document.getElementById('initial-state') as HTMLInputElement).value;
            const finalStates = (document.getElementById('final-states') as HTMLInputElement).value.split(',').map((s: string) => s.trim());
            const blankSymbol = (document.getElementById('blank-symbol') as HTMLInputElement).value || '_';
            const instructionsInput = (document.getElementById('instructions-input') as HTMLTextAreaElement).value;

            const initialTapeData = new Map<number, string>();
            for (let i = 0; i < tapeInput.length; i++) {
                if (tapeInput[i] !== blankSymbol) {
                    initialTapeData.set(i, tapeInput[i]);
                }
            }
            const tape = new Tape(initialTapeData, blankSymbol);

            const instructionsMap = new Map<InstructionKey, Instruction>();
            const lines = instructionsInput.split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    const [from, to] = line.split('->').map((s: string) => s.trim());
                    const [currentState, currentSymbol] = from.split(',').map((s: string) => s.trim());
                    const [nextState, writeSymbol, direction] = to.split(',').map((s: string) => s.trim());
                    
                    let dir: Direction;
                    switch (direction.toUpperCase()) {
                        case 'L': dir = Direction.LEFT; break;
                        case 'R': dir = Direction.RIGHT; break;
                        case 'S': dir = Direction.STAY; break;
                        default: throw new Error(`Invalid direction: ${direction}`);
                    }
                    
                    instructionsMap.set(
                        new InstructionKey(currentState, currentSymbol),
                        { nextState, writeValue: writeSymbol, direction: dir }
                    );
                }
            }

            const instructionTable = new InstructionTable(instructionsMap);
            this.machine = new TuringMachine(currentState || initialState, finalStates, instructionTable, tape, headPosition);
            this.currentResult = null;
        } catch (error) {
            alert(`Error creating machine: ${error}`);
        }
    }

    private updateDisplay(): void {
        if (!this.machine) {
            document.getElementById('tape-display')!.innerHTML = '';
            document.getElementById('machine-status')!.innerHTML = 'No machine loaded';
            return;
        }


        if (!this.currentResult) {
            this.currentResult = {
                tape: this.getTapeString(),
                state: (document.getElementById('initial-state') as HTMLInputElement).value,
                isInFinalState: false,
                hasCrashed: false,
                headPosition: this.getInitialHeadPosition()
            };
        }

        this.renderTape();
        this.renderStatus();
    }

    private getTapeString(): string {
        const tapeInput = (document.getElementById('tape-input') as HTMLTextAreaElement).value;
        return tapeInput || '';
    }

    private getInitialHeadPosition(): number {
        const tapeInput = (document.getElementById('tape-input') as HTMLTextAreaElement).value;
        const blankSymbol = (document.getElementById('blank-symbol') as HTMLInputElement).value || '_';
        for (let i = 0; i < tapeInput.length; i++) {
            if (tapeInput[i] !== blankSymbol) {
                return i;
            }
        }
        return 0;
    }

    private renderTape(): void {
        const tapeDisplay = document.getElementById('tape-display')!;
        const tapeString = this.currentResult?.tape || this.getTapeString();
        const headPosition = this.currentResult?.headPosition || 0;
        const blankSymbol = (document.getElementById('blank-symbol') as HTMLInputElement).value || '_';
        
        let leftmostPos = headPosition;
        let rightmostPos = headPosition;
        
        if (this.machine && tapeString.length > 0) {
            const tapeLeftmost = this.machine.getTapeLeftmostPosition();
            leftmostPos = Math.min(leftmostPos, tapeLeftmost);
            rightmostPos = Math.max(rightmostPos, tapeLeftmost + tapeString.length - 1);
        }
        
        if (leftmostPos === headPosition && rightmostPos === headPosition) {
            leftmostPos = headPosition - 2;
            rightmostPos = headPosition + 2;
        }
        
        const cellsPerRow = 15;
        let html = '<div class="tape-rows">';
        
        for (let rowStart = leftmostPos; rowStart <= rightmostPos; rowStart += cellsPerRow) {
            const rowEnd = Math.min(rowStart + cellsPerRow - 1, rightmostPos);
            html += '<div class="tape-row">';
            
            for (let i = rowStart; i <= rowEnd; i++) {
                let symbol = blankSymbol;
                
                if (this.machine && tapeString.length > 0) {
                    const leftmostPos = this.machine.getTapeLeftmostPosition();
                    const stringIndex = i - leftmostPos;
                    if (stringIndex >= 0 && stringIndex < tapeString.length) {
                        symbol = tapeString[stringIndex];
                    }
                }
                
                const isHead = i === headPosition;
                const displaySymbol = symbol === ' ' ? '&nbsp;' : symbol;
                html += `<div class="tape-cell ${isHead ? 'head-position' : ''}" data-position="${i}">${displaySymbol}</div>`;
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        tapeDisplay.innerHTML = html;
    }

    private renderStatus(): void {
        const statusDiv = document.getElementById('machine-status')!;
        if (!this.currentResult) {
            statusDiv.innerHTML = 'Machine ready';
            return;
        }

        let status = `State: ${this.currentResult.state}`;
        if (this.currentResult.isInFinalState) {
            status += ' (FINAL STATE)';
        } else if (this.currentResult.hasCrashed) {
            status += ' (MACHINE CRASHED DUE TO MISSING INSTRUCTION)';
        }
        
        statusDiv.innerHTML = status;
    }

    private updateButtons(): void {
        const stepBtn = document.getElementById('step-btn') as HTMLButtonElement;
        const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
        const fastestRunBtn = document.getElementById('fastest-run-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
        const initialStateInput = document.getElementById('initial-state') as HTMLInputElement;
        
        const machineExists = this.machine !== null;
        const isFinished = this.currentResult?.isInFinalState || this.currentResult?.hasCrashed;
        
        stepBtn.disabled = !machineExists || this.isRunning || !!isFinished;
        runBtn.disabled = !machineExists || this.isRunning || !!isFinished;
        fastestRunBtn.disabled = !machineExists || this.isRunning || !!isFinished;
        runBtn.textContent = this.isRunning ? 'Running...' : 'Run';
        fastestRunBtn.textContent = this.isRunning ? 'Running...' : 'Fastest Run';
        resetBtn.disabled = !machineExists;
        initialStateInput.disabled = this.machineHasStarted;
    }

    private updateTapeDisplay(): void {
        if (this.machine && this.currentResult) {
            this.currentResult.tape = this.getTapeString();
            this.currentResult.headPosition = this.currentResult?.headPosition || this.getInitialHeadPosition();
            this.renderTape();
        }
    }

    private markMachineStale(): void {
        this.machineNeedsRecreation = true;
    }

    private recreateMachinePreservingExecution(): void {
        if (!this.currentResult) {
            this.createMachineFromInput();
            return;
        }
        
        this.createMachineFromInput(this.currentResult.state, this.currentResult.headPosition);
        
        this.currentResult = null;
    }


}

document.addEventListener('DOMContentLoaded', () => {
    new TuringMachineVisualizer();
});
