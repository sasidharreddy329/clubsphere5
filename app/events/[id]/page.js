import { defaultEvents } from "../../../lib/storage";
import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
  return defaultEvents.map((event) => ({ id: event.id }));
}

export default function EventDetailPage({ params }) {
  return <EventDetailClient eventId={params.id} />;
}
