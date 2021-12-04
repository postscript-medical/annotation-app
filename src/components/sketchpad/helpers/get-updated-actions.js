import { get } from "svelte/store";
import { actions } from "../../../stores.js";
import clone from "../../../methods/clone.js";

export default function getUpdatedActions(updatedAction, index) {
  const state = get(actions);
  const updatedActions = clone(state.current);
  updatedActions[index] = updatedAction;

  return updatedActions;
}
