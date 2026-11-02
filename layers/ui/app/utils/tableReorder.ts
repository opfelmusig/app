export interface TableReorder {
  id: string;
  targetId: string;
  placement: "before" | "after";
}

export const tableReorderEnabledKey: InjectionKey<Readonly<Ref<boolean>>> =
  Symbol("table-reorder-enabled");
