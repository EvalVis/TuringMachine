class Tape {
    private data: Map<number, string>;

    constructor(initialData: Map<number, string>) {
        this.data = new Map(initialData);
    }

    read(index: number): string {
        return this.data.get(index) ?? "b";
    }

    write(index: number, value: string): void {
        this.data.set(index, value);
    }
}

export { Tape }; 