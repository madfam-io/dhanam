/**
 * Maintains a mapping between LunchMoney IDs and Dhanam UUIDs
 * for idempotent migration across all entity types.
 */
export class IdMap {
  private maps: Map<string, Map<number, string>> = new Map();

  set(entityType: string, lmId: number, dhanamId: string): void {
    if (!this.maps.has(entityType)) {
      this.maps.set(entityType, new Map());
    }
    this.maps.get(entityType)!.set(lmId, dhanamId);
  }

  get(entityType: string, lmId: number): string | undefined {
    return this.maps.get(entityType)?.get(lmId);
  }

  has(entityType: string, lmId: number): boolean {
    return this.maps.get(entityType)?.has(lmId) ?? false;
  }

  getAll(entityType: string): Map<number, string> {
    return this.maps.get(entityType) || new Map();
  }

  count(entityType: string): number {
    return this.maps.get(entityType)?.size ?? 0;
  }

  summary(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [type, map] of this.maps) {
      result[type] = map.size;
    }
    return result;
  }
}
