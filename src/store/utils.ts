import { getMap } from "./maps/utils";
import { IStore } from "./types/store";

export type updatedParams = string | updatedParams[];
export const Mutators = "mutators";
export const isClient = typeof window !== "undefined" && window;
export const SignRegExp = /[\s$]+/;

export const getRootPaths = (paths: string[]) =>
    paths.reduce(
        (prev, val, idx) => prev.concat([(prev?.[idx - 1] || []).concat(val)]),
        [] as string[][],
    );

export const getUpdatedPaths = <T extends IStore>(
    updatedParams: T,
    prevValues: T,
    paths: string[],
    res: string[][] = [],
) => {
    if (isObject(updatedParams)) {
        for (const key in assign({}, prevValues || {}, updatedParams)) {
            const propName = paths ? [...paths, key] : [key];
            if (key === Mutators) {
                continue;
            }
            if (isObject(updatedParams[key])) {
                const updated = assign(
                    {},
                    (updatedParams[key] as IStore) || {},
                );
                const prev = assign({}, (prevValues[key] as IStore) || {});
                if (updated !== prev) {
                    res.push(propName);
                }
                getUpdatedPaths(updated, prev, propName, res);
            } else {
                if (prevValues[key] !== updatedParams[key]) {
                    res.push(propName);
                }
            }
        }
        return [paths, ...res];
    }

    return prevValues !== updatedParams ? [paths] : [];
};

export const isObject = (value: any) =>
    value && typeof value === "object" && !Array.isArray(value);

const getPrototypeOf = (value: object) => Object.getPrototypeOf(value);

export const defaultObjectProto = getPrototypeOf({});

export const isDefaultObject = (value: any) =>
    isObject(value) && defaultObjectProto === getPrototypeOf(value);

export function mergeDeep(target: any, ...sources: any): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) assign(target, { [key]: {} });
                if (!isDefaultObject(source[key])) {
                    target[key] = source[key];
                } else {
                    mergeDeep(target[key], source[key]);
                }
            } else {
                assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export const getAdditionalPaths = (paths: string[]) => {
    const storeMap = values(getMap()) as string[][];
    return paths
        .reduce((prev, path, idx) => {
            const curVal = prev.filter(
                (curVal) =>
                    curVal?.[idx] === path && curVal.length > paths.length,
            );
            return curVal;
        }, storeMap)
        .filter((v) => isArrayPathName(v));
};

export const createNewArrayValues = (
    keys: string[],
    prev: any,
    newValue: any,
    filterFunc?: Function,
) => {
    const l = keys.length - 1;
    if (Array.isArray(prev) && l >= 0) {
        return prev.map((prevVal) => {
            if (isAFunction(filterFunc) && !filterFunc?.(prevVal)) {
                return prevVal;
            }
            const e = keys[l],
                targetObj = keys.reduce(
                    (prev, key, idx) => (idx === l ? prev : prev[key]),
                    prevVal,
                );

            if (targetObj) {
                targetObj[e] = getParams(newValue, targetObj[e]);
            }
            return assign({}, prevVal);
        });
    }
    return prev;
};

export const getAdditionalMapKeys = (paths: string[]) => {
    const storeMap = Object.keys(getMap()) as string[],
        l = paths.length;

    return paths
        .reduce((prevName, path, idx) => {
            const curVal = prevName.filter((val) => {
                const pathMap = EStorage.getMapByKey(val);
                return pathMap[idx] === path && pathMap.length > l;
            });
            return curVal;
        }, storeMap)
        .filter((val) => val.includes("$"));
};

export const findPathArrayIndex = (array?: string[]) =>
    array?.findIndex((val) => val === "[]") ?? -1;

export const isAFunction = (value: any) => typeof value === "function";

export const getParams = (params: any, prev: any) =>
    isAFunction(params) ? params(prev) : params;

export const diffValues = (prevObject: any, newObject: any) =>
    diffValuesBoolean(prevObject, newObject) ? newObject : prevObject;

export const diffValuesBoolean = (prevObject: any, newObject: any) =>
    JSON.stringify(prevObject) !== JSON.stringify(newObject);

export const capitalizeName = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1);

export const capitalizeKeysToString = (arr: string[], ignoreFirst?: boolean) =>
    arr.map((k, i) => (!i && ignoreFirst ? k : capitalizeName(k))).join("");

export const assign = <T extends {}, U, V>(
    target: T,
    source: U,
    source2?: V,
): T & U & V => Object.assign(target, source, source2);

export const entries = (value: object) => Object.entries(value);

export const values = (value: object) => Object.values(value);

export const isNotMutator = (keyName: string) =>
    keyName !== capitalizeName(Mutators);

export const isArrayPathName = (name: string | string[]) => name.includes("[]");

export const generateId = (object: any) => {
    const { mapId } = EStorage;
    if (!mapId.has(object)) {
        mapId.set(object, ++EStorage.storeId);
    }
    return "#".concat(String(mapId.get(object)));
};
