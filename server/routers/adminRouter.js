const router = require("express").Router();
const api = require("../controllers/apiController");
const requireAdmin = require("../middleware/requireAdmin");
const asyncHandler = require("../utils/asyncHandler");

router.use(requireAdmin);
router.get("/appointments", asyncHandler(api.getAdminAppointments));
router.delete("/appointments", asyncHandler(api.deleteAllAdminAppointments));
router.delete("/appointments/:id", asyncHandler(api.deleteAdminAppointment));
router.patch("/appointments/:id", asyncHandler(api.updateAppointment));
router.post("/services", asyncHandler(api.createService));
router.patch("/services/:id", asyncHandler(api.updateService));
router.delete("/services/:id", asyncHandler(api.deleteService));

module.exports = router;
