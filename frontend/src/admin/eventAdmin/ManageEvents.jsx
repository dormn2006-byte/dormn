import { CalendarHeart } from "lucide-react";
import EventCategoryManager from "./components/EventCategoryManager";

const ManageEvents = () => (
  <EventCategoryManager
    category="events"
    title="Campus & Special Events"
    subtitle="College cultural fests, campus DJ nights, technical summits, standup comedy & gatherings."
    icon={CalendarHeart}
    accent="emerald"
    addLabel="Add Event"
  />
);

export default ManageEvents;
