import { Music } from "lucide-react";
import EventCategoryManager from "./components/EventCategoryManager";

const ManageConcerts = () => (
  <EventCategoryManager
    category="concerts"
    title="Live Concerts & Stadium Shows"
    subtitle="Stadium tours, Bollywood fusion, EDM festivals & acoustic live sessions."
    icon={Music}
    accent="purple"
    addLabel="Add Concert"
  />
);

export default ManageConcerts;
