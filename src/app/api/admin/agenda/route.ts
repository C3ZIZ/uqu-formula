// Adds an agenda item.
import { createRoute } from "@/lib/crud-route";
import { agendaSchema } from "@/lib/validation";
import { createAgendaItem } from "@/services/agenda";

// Creates an agenda item from the admin form.
export const POST = createRoute(agendaSchema, createAgendaItem);
