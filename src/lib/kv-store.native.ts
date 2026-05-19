import AsyncStorage from "@react-native-async-storage/async-storage";
import type { KvStore } from "./kv-store";

export const kvStore: KvStore = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};
