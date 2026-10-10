export class ObjectUtil {
  static groupBy<T, K extends string | number | symbol>(
    items: T[],
    selector: (item: T) => K,
  ): Record<K, T[]> {
    return items.reduce(
      (acc, item) => {
        const key = selector(item);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as Record<K, T[]>,
    );
  }
}
