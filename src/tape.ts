class Tape {
    private data: Map<number, string>;
    private blankSymbol: string;

    constructor(initialData: Map<number, string>, blankSymbol: string) {
        this.data = new Map(initialData);
        this.blankSymbol = blankSymbol;
    }

    read(index: number): string {
        return this.data.get(index) ?? this.blankSymbol;
    }

    write(index: number, value: string): void {
        if (value == this.blankSymbol) {
            if (this.data.has(index)) {
                this.data.delete(index);
            }
        } else {
            this.data.set(index, value);
        }
    }

    findFirstNonBlankPosition(): number {
        let minPosition = 0;
        let hasNonBlank = false;
        
        for (const [position] of this.data) {
            if (!hasNonBlank || position < minPosition) {
                minPosition = position;
                hasNonBlank = true;
            }
        }
        
        return minPosition;
    }

    toString(): string {
        if (this.data.size === 0) {
            return "";
        }

        const positions = Array.from(this.data.keys()).sort((a, b) => a - b);
        let result = "";
        
        for (let i = 0; i < positions.length - 1; i++) {
            const currentPos = positions[i];
            result += this.data.get(currentPos);
            
            const nextPos = positions[i + 1];
            const gap = nextPos - currentPos - 1;
            result += this.blankSymbol.repeat(gap);
        }
        
        if (positions.length > 0) {
            result += this.data.get(positions[positions.length - 1]);
        }
        
        return result;
    }
}

export { Tape }; 