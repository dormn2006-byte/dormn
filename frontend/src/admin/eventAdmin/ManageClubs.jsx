import { Sparkles } from "lucide-react";
import EventCategoryManager from "./components/EventCategoryManager";

const ManageClubs = () => (
  <EventCategoryManager
    category="clubs"
    title="Nightlife & Club Venues"
    subtitle="DJ nights, guestlist RSVPs, couple free entries, and VIP table reservations."
    icon={Sparkles}
    accent="pink"
    addLabel="Add Club"
  />
);

export default ManageClubs;
