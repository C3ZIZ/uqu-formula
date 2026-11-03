// Switches a daily attendance code on or off, or removes it.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { attendanceCodeUpdateSchema } from "@/lib/validation";
import { deleteAttendanceCode, setAttendanceCodeActive } from "@/services/attendance-codes";

// Switches the code on or off.
export const PUT = updateRoute(attendanceCodeUpdateSchema, (id, input) => setAttendanceCodeActive(id, input.isActive));

// Removes the code. Recorded attendance stays.
export const DELETE = deleteRoute(deleteAttendanceCode);
