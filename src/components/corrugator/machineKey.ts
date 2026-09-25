/** Physical machine of a `"<machineUuid>:<width>"` machine key (D-23). */
export const machineUuidOf = (machineKey: string): string => machineKey.slice(0, machineKey.lastIndexOf(':'));
