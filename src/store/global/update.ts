import { _pushStoreValueEvent, _updatePathEvent } from "../events";
import { getGlobalData } from "./get";
import { patchToGlobalMap } from "../maps/maps";
import { getMapByKey } from "../maps/utils";
import { storageAction } from "../storage";
import { IStore, Options, StorageType, UpdateType } from "../types/store";
import {
    createCopy,
    diffValuesBoolean,
    getAdditionalKeys,
    getParams,
    isObject,
    isOptionalPathName,
    mergeDeep,
} from "../utils";

export const updateGlobalData = (
    paths: string[],
    data?: Partial<IStore>,
    src: Record<string, any> = getGlobalData([]),
) => {
    const [path, ...rest] = paths;
    if (!rest.length) {
        src[path] = createCopy(data);
        return;
    }
    if (!src[path]) {
        src[path] = {};
    }
    updateGlobalData(rest, data, src[path]);
};

export const updateStore = <T>(
    path: string[],
    params?: Partial<T> | ((prev: T) => Partial<T>),
    options?: Options<T>,
    type: UpdateType = UpdateType.S,
) => {
    const prevValues = getGlobalData(path);
    const updatedParams = getParams(params, prevValues);
    updateGlobalData(
        path,
        type === UpdateType.P && isObject(updatedParams) && isObject(prevValues)
            ? mergeDeep(undefined, {}, prevValues, updatedParams)
            : updatedParams,
    );

    const updatePathKeys = getAdditionalKeys(path, isOptionalPathName);

    updatePathKeys.forEach((mapKey) => {
        const prevPath = getMapByKey(mapKey);
        patchToGlobalMap(mapKey);
        if (diffValuesBoolean(prevPath, getMapByKey(mapKey))) {
            _updatePathEvent(mapKey, getMapByKey(mapKey));
        }
    });
    _pushStoreValueEvent(path, updatedParams, prevValues);
    storageAction(StorageType.P, options);
};