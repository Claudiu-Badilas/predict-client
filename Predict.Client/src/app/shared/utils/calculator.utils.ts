export class Calculator {
  static sum(numbers: number[]): number | null {
    if (!numbers?.length) return null;

    return numbers
      .filter((n) => n !== null && n !== undefined)
      .reduce((total, num) => total + num, 0);
  }
}
