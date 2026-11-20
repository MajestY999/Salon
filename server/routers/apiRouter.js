const router = require("express").Router();
const api = require("../controllers/apiController");
const asyncHandler = require("../utils/asyncHandler");

router.get("/services", asyncHandler(api.getServices));
router.get("/masters", asyncHandler(api.getMasters));
router.get("/masters/:id/slots", asyncHandler(api.getSlots));
router.post("/appointments", asyncHandler(api.createAppointment));

module.exports = router;
