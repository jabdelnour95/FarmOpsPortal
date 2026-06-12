import { doLogin, logout, restoreSession }                        from './modules/auth.js';
import { show, nav, openDept, openDeptFrom, openFinca, openOps, openFincaModule, navBackDept, filterCards, openResource, openCalendar } from './modules/navigation.js';
import { openInventarios, openRopaCama, openPropsMenu, openPropsForm, adjQty, submitInventario } from './modules/inventory.js';
import { openChecklistMenu, promptChecklist, closeModal, confirmChecklist, toggleCB, startChecklist, submitChecklist } from './modules/checklists.js';
import { openForm, submitForm }                          from './modules/forms.js';
import { toggleMic, stopRec }                           from './modules/audio.js';
import { handlePhotoUpload, removePhoto }               from './modules/photos.js';
import { openManualSection, renderManualLimp, renderManualManto } from './modules/manuals.js';
import { openReports, toggleAcc, viewReport }           from './modules/reports.js';
import { openFood, openFoodForm, submitFoodForm,
         addFoodInputRow, removeFoodInputRow,
         addFoodAvailRow, removeFoodAvailRow,
         addPrepBedRow, removePrepBedRow,
         addApplyBedRow, removeApplyBedRow,
         addHarvestRow, removeHarvestRow } from './modules/food.js';

// Expose to HTML event handlers (onclick attributes) and cross-module calls
Object.assign(window, {
  doLogin, logout,
  nav, openDept, openDeptFrom, openFinca, openOps, openFincaModule, navBackDept, filterCards, openResource,
  openInventarios, openRopaCama, openPropsMenu, openPropsForm, adjQty, submitInventario,
  openChecklistMenu, promptChecklist, closeModal, confirmChecklist, toggleCB, startChecklist, submitChecklist,
  openForm, submitForm,
  toggleMic, stopRec,
  handlePhotoUpload, removePhoto,
  openManualSection,
  openReports, toggleAcc, viewReport,
  // Food production module
  openFood, openFoodForm, submitFoodForm,
  addFoodInputRow, removeFoodInputRow,
  addFoodAvailRow, removeFoodAvailRow,
  addPrepBedRow, removePrepBedRow,
  addApplyBedRow, removeApplyBedRow,
  addHarvestRow, removeHarvestRow,
  // Internal bindings used by navigation.js to avoid circular imports
  _openChecklistMenu: openChecklistMenu,
  _openInventarios:   openInventarios,
  _openProveedores:   () => {}, // placeholder for future module
  _renderManualLimp:  renderManualLimp,
  _renderManualManto: renderManualManto,
});

// Wire up non-inline event listeners
document.getElementById('lp').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// Restore session if a valid token is stored locally
restoreSession();
