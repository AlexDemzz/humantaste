import { createFileRoute } from "@tanstack/react-router";

import { InfoPageView } from "@/components/info-page";
import { INFO_PAGES } from "@/lib/info-pages";
import { infoPageHead } from "@/lib/seo";

const ContactPage = () => <InfoPageView page={INFO_PAGES.contact} />;

export const Route = createFileRoute("/contact")({
  head: () => infoPageHead("contact"),
  component: ContactPage,
});
