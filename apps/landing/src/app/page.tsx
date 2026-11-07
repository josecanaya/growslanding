import { redirect } from "next/navigation";
import { getAppWebUrlFor } from "@/lib/config";

export default function Page() {
  redirect(getAppWebUrlFor("/home"));
}
