import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CarMake = {
  id: string;
  name: string;
  is_chinese: boolean;
  chinese_tier: string;
};

export function useCarMakes() {
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMakes() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("car_makes")
        .select("*")
        .order("name");
      if (data) setMakes(data);
      setIsLoading(false);
    }
    fetchMakes();
  }, []);

  return { makes, isLoading };
}
