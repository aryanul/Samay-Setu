import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy QR path — founding intake now uses Verified Architect onboarding. */
export default function JoinCircleRedirect() {
  redirect("/onboarding");
}
