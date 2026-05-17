import { redirect } from "next/navigation";

/** /ong → /ong/dashboard */
export default function OngIndexPage() {
  redirect("/ong/dashboard");
}
