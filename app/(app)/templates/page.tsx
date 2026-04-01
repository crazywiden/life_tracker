import { TemplateManager } from "@/components/template-manager";
import { SetupState } from "@/components/setup-state";
import { requireAppUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { listTemplates } from "@/lib/queries";
import { getTemplateExample } from "@/lib/template-schema";

export default async function TemplatesPage() {
  if (!isSupabaseConfigured()) {
    return <SetupState />;
  }

  const context = await requireAppUser();
  if (!context.supabase || !context.user) {
    return <SetupState />;
  }

  const templates = await listTemplates(context.supabase, context.user);

  return <TemplateManager initialTemplates={templates} exampleSource={getTemplateExample()} />;
}
