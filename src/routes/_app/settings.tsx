import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Globe,
  Bell,
  Lock,
  Clock,
  UserCog,
  Info,
  ChevronRight,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const APP_VERSION = "1.0.0";

export function SettingsPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showDistance: false,
  });

  const [timezone, setTimezone] = useState("madrid");

  const handleDeleteAccount = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="bg-primary px-5 pt-10 text-primary-foreground">
        <div className="relative flex items-center justify-center">
          <Link
            to="/profile"
            className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm"
          >
            <ChevronRight className="rotate-180" size={18} />
          </Link>
          <div className="flex flex-col items-center gap-4 pb-8">
            <h1 className="font-serif text-[32px] font-semibold leading-tight text-black">{t("settings")}</h1>
            <img src="/logo_sin_fondo.png" alt="SOLVE" className="h-20 w-auto" />
          </div>
        </div>
      </div>

      <div className="-mt-6 px-5 space-y-4">
        {/* Language */}
        <SettingsSection icon={Globe} title={t("language")} description={t("languageDesc")}>
          <Select value={lang} onValueChange={(v) => setLang(v as "es" | "en")}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t("spanish")}</SelectItem>
              <SelectItem value="en">{t("english")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={Bell} title={t("notifications")}>
          <div className="space-y-4">
            <ToggleItem
              title={t("pushNotifications")}
              description={t("pushNotificationsDesc")}
              checked={notifications.push}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
            />
            <Separator />
            <ToggleItem
              title={t("emailNotifications")}
              description={t("emailNotificationsDesc")}
              checked={notifications.email}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
            />
            <Separator />
            <ToggleItem
              title={t("smsNotifications")}
              description={t("smsNotificationsDesc")}
              checked={notifications.sms}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, sms: v }))}
            />
          </div>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection icon={Lock} title={t("privacy")}>
          <div className="space-y-4">
            <ToggleItem
              title={t("publicProfile")}
              description={t("publicProfileDesc")}
              checked={privacy.publicProfile}
              onCheckedChange={(v) => setPrivacy((p) => ({ ...p, publicProfile: v }))}
            />
            <Separator />
            <ToggleItem
              title={t("showDistance")}
              description={t("showDistanceDesc")}
              checked={privacy.showDistance}
              onCheckedChange={(v) => setPrivacy((p) => ({ ...p, showDistance: v }))}
            />
          </div>
        </SettingsSection>

        {/* Timezone */}
        <SettingsSection icon={Clock} title={t("timezone")} description={t("timezoneDesc")}>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="madrid">{t("madrid")}</SelectItem>
              <SelectItem value="paris">{t("paris")}</SelectItem>
              <SelectItem value="berlin">{t("berlin")}</SelectItem>
              <SelectItem value="london">{t("london")}</SelectItem>
            </SelectContent>
          </Select>
        </SettingsSection>

        {/* Account */}
        <SettingsSection icon={UserCog} title={t("account")}>
          <div className="space-y-3">
            <ActionItem
              title={t("changePassword")}
              description={t("changePasswordDesc")}
              onClick={() => {}}
            />
            <Separator />
            <ActionItem
              title={t("exportData")}
              description={t("exportDataDesc")}
              onClick={() => {}}
            />
            <Separator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-left transition-colors hover:bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <UserCog size={18} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-destructive">{t("deleteAccount")}</p>
                      <p className="text-xs text-muted-foreground">{t("deleteAccountDesc")}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteAccount")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmDelete")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={Info} title={t("about")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t("version")}</span>
              <span className="text-sm font-medium">v{APP_VERSION}</span>
            </div>
            <Separator />
            <LinkItem title={t("terms")} />
            <Separator />
            <LinkItem title={t("privacyPolicy")} />
            <Separator />
            <LinkItem title={t("helpSupport")} />
          </div>
        </SettingsSection>

        {/* Back to profile */}
        <Link
          to="/profile"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <ChevronRight className="rotate-180" size={16} />
          {t("profile")}
        </Link>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={18} strokeWidth={2} />
        </span>
        <div>
          <h2 className="font-serif text-lg font-semibold text-primary">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleItem({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ActionItem({
  title,
  description,
  onClick,
}: {
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
    </button>
  );
}

function LinkItem({ title }: { title: string }) {
  return (
    <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <ExternalLink size={14} className="text-muted-foreground" />
      </div>
    </button>
  );
}
