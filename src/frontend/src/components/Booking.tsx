import { z } from "zod";

export const bookingSchema = z.object({
  destination: z.string().describe("City name"),
  date: z.iso.datetime().describe("Date and time of the booking"),
});
export function BookingCard({
  destination,
  date,
}: z.infer<typeof bookingSchema>) {
  const formatted = new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{destination}</h3>
      <p className="text-sm text-gray-500">{formatted}</p>
    </div>
  );
}
