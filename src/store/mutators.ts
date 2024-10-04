import { getGlobalData } from "./get-global";
import { updateStore } from "./global";
import { IGenerate, IStore, UpdateType } from "./types/store";
import {
    assign,
    capitalizeKeysToString,
    capitalizeName,
    entries,
    getParams,
    isAFunction,
    isDefaultObject,
    isNotMutator,
} from "./utils";

export const generateMutators = <T extends IStore<T>>(
    storeId: string,
    values: T,
    prevKey: string[] = [],
): IGenerate<T> =>
    entries(values).reduce(
        (result, [key, val]) =>
            key
                ? assign(
                      result,
                      isNotMutator(capitalizeName(key))
                          ? isDefaultObject(val) &&
                                generateMutators<IStore<T>>(
                                    storeId,
                                    val,
                                    prevKey.concat(key),
                                )
                          : createMutators(
                                val,
                                prevKey,
                                [storeId].concat(prevKey),
                            ),
                  )
                : result,
        {} as IGenerate<T>,
    );

export const createMutators = (
    values: Record<string, Function>,
    path: string[],
    storePath: string[],
) => {
    const pathName = path[0] + capitalizeKeysToString(path.slice(1));
    const get = () => getGlobalData(storePath);
    const set = (arg: any, type: UpdateType = "set") => {
        const params = getParams(arg, get());
        updateStore(storePath, params, type);
        return get();
    };
    const patch = (arg: any) => set(arg, "patch");

    return entries(values).reduce(
        (prev, [key, val]) =>
            assign(prev, {
                [pathName.concat(capitalizeName(key))]: (...args: any) => {
                    const fn = val({ set, get, patch }, get());
                    return isAFunction(fn) ? fn(...args) : fn;
                },
            }),
        {},
    );
};
