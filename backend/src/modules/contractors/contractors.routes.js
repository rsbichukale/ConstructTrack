const express = require('express');
const router = express.Router();
const contractorsController = require('./contractors.controller');

router.get('/', contractorsController.getContractors);
router.post('/', contractorsController.createContractor);
router.get('/targets', contractorsController.getDailyTargets);
router.post('/targets', contractorsController.createDailyTarget);
router.patch('/targets/:id', contractorsController.updateDailyTarget);
router.post('/attendance', contractorsController.recordAttendance);

// Multi-Skill Muster Roll & Wage Advances
router.get('/muster', contractorsController.getMusterRoll);
router.get('/advances', contractorsController.getAllWageAdvances);
router.post('/advances', contractorsController.createWageAdvance);

module.exports = router;
