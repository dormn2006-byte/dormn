import { Compass } from "lucide-react";
import EventCategoryManager from "./components/EventCategoryManager";

const ManageExperiences = () => (
  <EventCategoryManager
    category="all"
    title="All Experiences & Listings"
    subtitle="Complete catalog of all live nightlife clubs, live concerts, and campus fests across the city."
    icon={Compass}
    accent="purple"
    addLabel="Add Experience"
  />
);

export default ManageExperiences;
