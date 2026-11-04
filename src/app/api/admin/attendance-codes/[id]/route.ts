// Changes or removes a daily attendance code.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { attendanceCodeUpdateSchema } from "@/lib/validation";
import { deleteAttendanceCode, updateAttendanceCode } from "@/services/attendance-codes";

// Changes the code's place or switches it on or off.
export const PUT = updateRoute(attendanceCodeUpdateSchema, updateAttendanceCode);

// Removes a code that no visitor has scanned yet.
export const DELETE = deleteRoute(deleteAttendanceCode);
