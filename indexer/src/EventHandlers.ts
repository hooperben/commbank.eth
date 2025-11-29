/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Commbankdoteth,
  Commbankdoteth_LeafInserted,
  Commbankdoteth_NotePayload,
  Commbankdoteth_NullifierUsed,
  Commbankdoteth_RoleAdminChanged,
  Commbankdoteth_RoleGranted,
  Commbankdoteth_RoleRevoked,
} from "generated";

Commbankdoteth.LeafInserted.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_LeafInserted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    leafIndex: event.params.leafIndex,
    leafValue: event.params.leafValue,
  };

  context.Commbankdoteth_LeafInserted.set(entity);
});

Commbankdoteth.NotePayload.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_NotePayload = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    encryptedNote: event.params.encryptedNote,
  };

  context.Commbankdoteth_NotePayload.set(entity);
});

Commbankdoteth.NullifierUsed.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_NullifierUsed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    nullifier: event.params.nullifier,
  };

  context.Commbankdoteth_NullifierUsed.set(entity);
});

Commbankdoteth.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_RoleAdminChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };

  context.Commbankdoteth_RoleAdminChanged.set(entity);
});

Commbankdoteth.RoleGranted.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_RoleGranted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.Commbankdoteth_RoleGranted.set(entity);
});

Commbankdoteth.RoleRevoked.handler(async ({ event, context }) => {
  const entity: Commbankdoteth_RoleRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.Commbankdoteth_RoleRevoked.set(entity);
});
