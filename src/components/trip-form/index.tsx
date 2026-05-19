import { View } from "react-native";
import { AdvancedFilters } from "@/components/trip-form/advanced-filters";
import { AiParser } from "@/components/trip-form/ai-parser";
import { HotelSpecifics } from "@/components/trip-form/hotel-specifics";
import { PriorityVibe } from "@/components/trip-form/priority-vibe";
import { SubmitButton } from "@/components/trip-form/submit-button";
import { useTripForm } from "@/components/trip-form/use-trip-form";
import { WhereWhen } from "@/components/trip-form/where-when";
import { WhoBudget } from "@/components/trip-form/who-budget";

export function TripForm() {
  const form = useTripForm();

  return (
    <View className="space-y-8">
      <AiParser form={form} />
      <WhereWhen form={form} />
      <WhoBudget form={form} />
      <HotelSpecifics form={form} />
      <PriorityVibe form={form} />
      <AdvancedFilters form={form} />
      <SubmitButton form={form} />
    </View>
  );
}
