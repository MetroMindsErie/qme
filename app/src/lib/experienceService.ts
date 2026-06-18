import {
  createEce,
  deleteEce,
  getEce,
  listActiveEcesForEvent,
  listEcesForEvent,
  updateEce,
} from './eceService';

export const listExperiencesForEvent = listEcesForEvent;
export const listActiveExperiencesForEvent = listActiveEcesForEvent;
export const getExperience = getEce;
export const createExperience = createEce;
export const updateExperience = updateEce;
export const deleteExperience = deleteEce;
