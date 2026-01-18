export const averageRange = (data: number[], from: number, to: number): number => {
    const start = Math.floor(data.length * from);
    const end = Math.floor(data.length * to);
    let sum = 0;

    for (let i = start; i < end; i++) {
        sum += data[i];
    }

    return sum / (end - start || 1);

}