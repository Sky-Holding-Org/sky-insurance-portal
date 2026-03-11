import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CarModel = {
  id: string;
  make_id: string;
  name: string;
};

export function useCarModels(makeId: string | null) {
  const [models, setModels] = useState<CarModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }

    async function fetchModels() {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("car_models")
        .select("*")
        .eq("make_id", makeId)
        .order("name");
      if (data) setModels(data);
      setIsLoading(false);
    }
    fetchModels();
  }, [makeId]);

  return { models, isLoading };
}
