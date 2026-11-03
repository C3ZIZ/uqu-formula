// Changes or removes an agenda item.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { agendaSchema } from "@/lib/validation";
import { deleteAgendaItem, updateAgendaItem } from "@/services/agenda";

// Saves edits to an agenda item.
export const PUT = updateRoute(agendaSchema, updateAgendaItem);

// Removes an agenda item.
export const DELETE = deleteRoute(deleteAgendaItem);
